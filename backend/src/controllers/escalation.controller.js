// escalation.controller controller: handles HTTP request/response flow for this module.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { fetchUserByIdQuery } from '../model/user.model.js';
import { fetchAccessmentByIdQuery } from '../model/assessment.model.js';
import {
  VALID_ESCALATION_LEVELS,
  VALID_ESCALATION_STATUSES,
  createEscalationQuery,
  deleteEscalationQuery,
  escalationsQuery,
  fetchEscalationByIdQuery,
  fetchEscalationsByOrganizationIdQuery,
  updateEscalationQuery,
  updateEscalationStatusQuery
} from '../model/escalation.model.js';
import { denySuperAdminInternalAccess } from '../utils/tenantScope.js';
import {
  createSystemNotificationSafely,
  NOTIFICATION_TYPES
} from '../services/notification.service.js';
import { getPlatformSettingsSafe } from '../utils/platformSettings.js';

const ensureAdminAssignee = (assignedTo, organizationId, callback) => {
  if (assignedTo === null || assignedTo === undefined || assignedTo === '') {
    callback(null, null);
    return;
  }

  complaintDB.get(fetchUserByIdQuery, [assignedTo], (userErr, userRow) => {
    if (userErr) {
      callback(userErr);
      return;
    }
    if (!userRow) {
      callback(new Error('Assigned user not found'));
      return;
    }
    if (userRow.role !== 'org_admin') {
      callback(new Error('Escalation can only be assigned to an organization admin'));
      return;
    }
    if (String(userRow.organization_id) !== String(organizationId)) {
      callback(new Error('Assigned organization admin must belong to the same organization'));
      return;
    }
    callback(null, Number(assignedTo));
  });
};

const isOrgAdmin = (req) => req.user?.role === 'org_admin';

const notifyEscalationOrganization = (escalationRow, message) =>
  createSystemNotificationSafely(
    {
      organizationId: escalationRow.organization_id,
      userId: null,
      complaintId: escalationRow.complaint_id || null,
      type: NOTIFICATION_TYPES.ESCALATION_UPDATED,
      message
    },
    'escalation notification'
  );

const notifyEscalationAssignee = (escalationRow, message) => {
  if (!escalationRow?.assigned_to) {
    return Promise.resolve(null);
  }

  return createSystemNotificationSafely(
    {
      organizationId: escalationRow.organization_id,
      userId: escalationRow.assigned_to,
      complaintId: escalationRow.complaint_id || null,
      type: NOTIFICATION_TYPES.ESCALATION_ASSIGNED,
      message
    },
    'escalation assignment notification'
  );
};

export const CreateEscalationsTable = () => {
  complaintDB.run(escalationsQuery, (err) => {
    if (err) {
      console.error('Error creating escalations table:', err.message);
    } else {
      complaintDB.all('PRAGMA table_info(escalations)', [], async (schemaErr, columns) => {
        if (schemaErr) {
          console.error('Error inspecting escalations table:', schemaErr.message);
          return;
        }

        const existing = new Set((columns || []).map((col) => col.name));
        try {
          if (!existing.has('organization_id')) {
            await new Promise((resolve, reject) => {
              complaintDB.run('ALTER TABLE escalations ADD COLUMN organization_id INTEGER', (alterErr) => {
                if (alterErr) return reject(alterErr);
                return resolve();
              });
            });
          }
          await new Promise((resolve, reject) => {
            complaintDB.run(
              `
              UPDATE escalations
              SET organization_id = (
                SELECT a.organization_id
                FROM accessments a
                WHERE a.id = escalations.accessment_id
              )
              WHERE organization_id IS NULL
              `,
              (updateErr) => {
                if (updateErr) return reject(updateErr);
                return resolve();
              }
            );
          });
          await new Promise((resolve, reject) => {
            complaintDB.run('CREATE INDEX IF NOT EXISTS idx_escalations_organization_id ON escalations(organization_id)', (indexErr) => {
              if (indexErr) return reject(indexErr);
              return resolve();
            });
          });
          console.log('Escalations table created or already exists');
        } catch (migrationErr) {
          console.error('Error migrating escalations table:', migrationErr.message);
        }
      });
    }
  });
};

export const createEscalation = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage escalations directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can manage escalations');
  }

  const {
    accessment_id,
    assigned_to = null,
    escalation_level = 'level_1',
    reason,
    notes = null,
    status = 'pending'
  } = req.body;

  if (!accessment_id || !reason) {
    return sendError(res, 400, 'assessment_id and reason are required');
  }
  if (!VALID_ESCALATION_LEVELS.includes(escalation_level)) {
    return sendError(res, 400, `escalation_level must be one of: ${VALID_ESCALATION_LEVELS.join(', ')}`);
  }
  if (!VALID_ESCALATION_STATUSES.includes(status)) {
    return sendError(res, 400, `status must be one of: ${VALID_ESCALATION_STATUSES.join(', ')}`);
  }

  complaintDB.get(fetchAccessmentByIdQuery, [accessment_id], (accessmentErr, accessmentRow) => {
    if (accessmentErr) {
      return sendError(res, 500, 'Failed to validate assessment', accessmentErr.message);
    }
    if (!accessmentRow) {
      return sendError(res, 404, 'Assessment not found');
    }
    if (String(accessmentRow.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    getPlatformSettingsSafe()
      .then((settings) => {
        if (Number(settings.enforce_escalation_threshold || 0) === 1) {
          const thresholdHours = Number(settings.escalation_threshold_hours || 0);
          const createdAt = accessmentRow.created_at ? new Date(accessmentRow.created_at) : null;
          if (thresholdHours > 0 && createdAt && Number.isFinite(createdAt.getTime())) {
            const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursSince < thresholdHours) {
              return sendError(
                res,
                400,
                `Escalation can be created after ${thresholdHours} hours from assessment creation`
              );
            }
          }
        }

        ensureAdminAssignee(assigned_to, accessmentRow.organization_id, (assigneeErr, normalizedAssignedTo) => {
          if (assigneeErr) {
            return sendError(res, 400, 'Invalid escalation assignment', assigneeErr.message);
          }

          complaintDB.run(
            createEscalationQuery,
            [
              accessment_id,
              accessmentRow.organization_id,
              req.user.id,
              normalizedAssignedTo,
              escalation_level,
              reason,
              notes,
              status
            ],
            function onCreate(err) {
              if (err) {
                return sendError(res, 500, 'Failed to create escalation', err.message);
              }
              complaintDB.get(fetchEscalationByIdQuery, [this.lastID], (getErr, row) => {
                if (getErr) {
                  return sendError(res, 500, 'Failed to fetch escalation', getErr.message);
                }

                void notifyEscalationOrganization(
                  row,
                  `A new escalation was created for complaint "${accessmentRow.complaint_title || 'Untitled Complaint'}".`
                );
                if (row.assigned_to) {
                  void notifyEscalationAssignee(
                    row,
                    `You were assigned an escalation for complaint "${accessmentRow.complaint_title || 'Untitled Complaint'}".`
                  );
                }

                return sendSuccess(res, 201, 'Escalation created successfully', row);
              });
            }
          );
        });
      })
      .catch((settingsErr) => {
        return sendError(res, 500, 'Failed to load escalation policy', settingsErr.message);
      });
  });
};

export const getAllEscalations = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access escalations directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can access escalations');
  }

  complaintDB.all(fetchEscalationsByOrganizationIdQuery, [req.user.organization_id], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch escalations', err.message);
    }
    return sendSuccess(res, 200, 'Escalations retrieved successfully', rows);
  });
};

export const updateEscalation = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage escalations directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can manage escalations');
  }

  const {
    assigned_to = null,
    escalation_level,
    reason,
    notes = null,
    status,
    resolved_at = null
  } = req.body;

  if (!escalation_level || !reason || !status) {
    return sendError(res, 400, 'escalation_level, reason, and status are required');
  }
  if (!VALID_ESCALATION_LEVELS.includes(escalation_level)) {
    return sendError(res, 400, `escalation_level must be one of: ${VALID_ESCALATION_LEVELS.join(', ')}`);
  }
  if (!VALID_ESCALATION_STATUSES.includes(status)) {
    return sendError(res, 400, `status must be one of: ${VALID_ESCALATION_STATUSES.join(', ')}`);
  }

  complaintDB.get(fetchEscalationByIdQuery, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch escalation', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Escalation not found');
    }
    if (String(existing.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    ensureAdminAssignee(assigned_to, existing.organization_id, (assigneeErr, normalizedAssignedTo) => {
      if (assigneeErr) {
        return sendError(res, 400, 'Invalid escalation assignment', assigneeErr.message);
      }

      complaintDB.run(
        updateEscalationQuery,
        [normalizedAssignedTo, escalation_level, reason, notes, status, resolved_at, req.params.id],
        function onUpdate(err) {
          if (err) {
            return sendError(res, 500, 'Failed to update escalation', err.message);
          }

          complaintDB.get(fetchEscalationByIdQuery, [req.params.id], (getErr, row) => {
            if (getErr) {
              return sendError(res, 500, 'Failed to fetch updated escalation', getErr.message);
            }

            if (status !== existing.status) {
              void notifyEscalationOrganization(
                row,
                `Escalation #${row.id} is now ${status.replace('_', ' ')}.`
              );
            }
            if (normalizedAssignedTo && Number(normalizedAssignedTo) !== Number(existing.assigned_to)) {
              void notifyEscalationAssignee(
                row,
                `You were assigned escalation #${row.id}.`
              );
            }

            return sendSuccess(res, 200, 'Escalation updated successfully', row);
          });
        }
      );
    });
  });
};

export const updateEscalationStatus = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage escalations directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can manage escalations');
  }

  const { status, resolved_at = null } = req.body;

  if (!status) {
    return sendError(res, 400, 'status is required');
  }
  if (!VALID_ESCALATION_STATUSES.includes(status)) {
    return sendError(res, 400, `status must be one of: ${VALID_ESCALATION_STATUSES.join(', ')}`);
  }

  complaintDB.get(fetchEscalationByIdQuery, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch escalation', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Escalation not found');
    }
    if (String(existing.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(updateEscalationStatusQuery, [status, resolved_at, req.params.id], function onUpdate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to update escalation status', err.message);
      }

      complaintDB.get(fetchEscalationByIdQuery, [req.params.id], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch updated escalation', getErr.message);
        }

        if (status !== existing.status) {
          void notifyEscalationOrganization(
            row,
            `Escalation #${row.id} status changed to ${status.replace('_', ' ')}.`
          );
        }

        return sendSuccess(res, 200, 'Escalation status updated successfully', row);
      });
    });
  });
};

export const deleteEscalation = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage escalations directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can manage escalations');
  }

  complaintDB.get(fetchEscalationByIdQuery, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch escalation', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Escalation not found');
    }
    if (String(existing.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(deleteEscalationQuery, [req.params.id], function onDelete(err) {
      if (err) {
        return sendError(res, 500, 'Failed to delete escalation', err.message);
      }
      return sendSuccess(res, 200, 'Escalation deleted successfully', { id: req.params.id });
    });
  });
};
