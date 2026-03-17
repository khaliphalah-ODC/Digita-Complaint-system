// complaint.controller controller: handles HTTP request/response flow for this module.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEntry, buildAuditMetadata } from '../utils/audit.js';
import {
  Complaint,
  assignComplaintOrganizationById,
  insertComplaint,
  selectComplaint,
  selectComplaintById,
  selectComplaintByTrackingCode,
  selectComplaintByOrganizationId,
  selectComplaintByUserId,
  selectUnassignedAnonymousComplaints,
  updateComplaintById,
  deleteComplaintById,
  VALID_COMPLAINT_PRIORITIES,
  VALID_COMPLAINT_STATUSES
} from '../model/complaint.model.js';
import { fetchUserByIdQuery } from '../model/user.model.js';
import { selectOrganizationById } from '../model/organization.model.js';
import { selectDepartmentById } from '../model/department.model.js';
import { denySuperAdminInternalAccess } from '../utils/tenantScope.js';

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });

const allQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows);
    });
  });

const generateTrackingCode = () => {
  const serial = String((Date.now() + Math.floor(Math.random() * 1000)) % 1000000).padStart(6, '0');
  return `TRK-${serial.slice(0, 3)}-${serial.slice(3)}`;
};

const ensureComplaintTableSchema = async () => {
  const columns = await allQuery('PRAGMA table_info(complaint)');
  const existing = new Set(columns.map((col) => col.name));

  if (!existing.has('user_id')) await runQuery('ALTER TABLE complaint ADD COLUMN user_id INTEGER');
  if (!existing.has('organization_id')) await runQuery('ALTER TABLE complaint ADD COLUMN organization_id INTEGER');
  if (!existing.has('department_id')) await runQuery('ALTER TABLE complaint ADD COLUMN department_id INTEGER');
  if (!existing.has('is_anonymous')) await runQuery('ALTER TABLE complaint ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0');
  if (!existing.has('anonymous_label')) await runQuery('ALTER TABLE complaint ADD COLUMN anonymous_label TEXT');
  if (!existing.has('title')) await runQuery('ALTER TABLE complaint ADD COLUMN title TEXT');
  if (!existing.has('category')) await runQuery('ALTER TABLE complaint ADD COLUMN category TEXT');
  if (!existing.has('priority')) await runQuery("ALTER TABLE complaint ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'");
  if (!existing.has('status')) await runQuery("ALTER TABLE complaint ADD COLUMN status TEXT NOT NULL DEFAULT 'submitted'");
  if (!existing.has('tracking_code')) await runQuery('ALTER TABLE complaint ADD COLUMN tracking_code TEXT');
  if (!existing.has('admin_response')) await runQuery('ALTER TABLE complaint ADD COLUMN admin_response TEXT');
  if (!existing.has('reviewed_by')) await runQuery('ALTER TABLE complaint ADD COLUMN reviewed_by INTEGER');
  if (!existing.has('reviewed_at')) await runQuery('ALTER TABLE complaint ADD COLUMN reviewed_at DATETIME');
  if (!existing.has('updated_at')) await runQuery('ALTER TABLE complaint ADD COLUMN updated_at DATETIME');

  await runQuery("UPDATE complaint SET title = COALESCE(title, 'Untitled Complaint')");
  await runQuery("UPDATE complaint SET priority = COALESCE(priority, 'medium')");
  await runQuery("UPDATE complaint SET status = COALESCE(status, 'submitted')");
  await runQuery('UPDATE complaint SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)');
  await runQuery(`
    UPDATE complaint
    SET organization_id = (
      SELECT u.organization_id
      FROM users u
      WHERE u.id = complaint.user_id
    )
    WHERE organization_id IS NULL AND user_id IS NOT NULL
  `);

  const rows = await allQuery('SELECT id FROM complaint WHERE tracking_code IS NULL OR tracking_code = ""');
  for (const row of rows) {
    await runQuery('UPDATE complaint SET tracking_code = ? WHERE id = ?', [generateTrackingCode(), row.id]);
  }

  await runQuery('CREATE UNIQUE INDEX IF NOT EXISTS idx_complaint_tracking_code ON complaint(tracking_code)');
};

export const CreateComplaintTable = () => {
  complaintDB.run(Complaint, async (err) => {
    if (err) {
      console.error('Error creating complaint table:', err.message);
      return;
    }
    try {
      await ensureComplaintTableSchema();
      console.log('Complaint table created or already exists');
    } catch (migrationErr) {
      console.error('Error migrating complaint table:', migrationErr.message);
    }
  });
};

export const createComplaint = (req, res) => {
  const {
    title,
    complaint,
    category = null,
    priority = 'medium',
    status = 'submitted',
    is_anonymous = false,
    anonymous_label = null,
    organization_id = null,
    department_id = null,
    unknown_organization = false
  } = req.body;
  const isAnonymousComplaint =
    is_anonymous === true ||
    is_anonymous === 1 ||
    is_anonymous === '1' ||
    is_anonymous === 'true';
  const allowUnassignedRouting =
    unknown_organization === true ||
    unknown_organization === 1 ||
    unknown_organization === '1' ||
    unknown_organization === 'true';

  if (!title || !complaint) {
    return sendError(res, 400, 'title and complaint are required');
  }
  if (!VALID_COMPLAINT_PRIORITIES.includes(priority)) {
    return sendError(res, 400, `priority must be one of: ${VALID_COMPLAINT_PRIORITIES.join(', ')}`);
  }
  if (!VALID_COMPLAINT_STATUSES.includes(status)) {
    return sendError(res, 400, `status must be one of: ${VALID_COMPLAINT_STATUSES.join(', ')}`);
  }
  if (!isAnonymousComplaint && !req.user) {
    return sendError(res, 401, 'Authentication is required for non-anonymous complaint submission');
  }
  if (req.user?.role !== 'super_admin' && req.user?.role !== 'org_admin' && status !== 'submitted') {
    return sendError(res, 403, 'Only admin can create a complaint with a custom status');
  }

  const createComplaintRecord = (resolvedOrganizationId = null) => {
    const requestedDepartmentId =
      department_id === null || department_id === undefined || department_id === ''
        ? null
        : Number(department_id);
    const finalUserId = isAnonymousComplaint ? null : req.user?.id || null;
    const finalOrganizationId = resolvedOrganizationId;
    const finalAnonymousLabel = isAnonymousComplaint ? anonymous_label || 'Anonymous Reporter' : null;
    const trackingCode = generateTrackingCode();

    if (requestedDepartmentId !== null && (!Number.isInteger(requestedDepartmentId) || requestedDepartmentId <= 0)) {
      return sendError(res, 400, 'department_id must be a valid department id when provided');
    }

    const persistComplaint = (resolvedDepartmentId = null) => {
      complaintDB.run(
        insertComplaint,
        [
          finalUserId,
          finalOrganizationId,
          resolvedDepartmentId,
          isAnonymousComplaint ? 1 : 0,
          finalAnonymousLabel,
          title,
          complaint,
          category,
          priority,
          status,
          trackingCode
        ],
        function onCreate(err) {
          if (err) {
            return sendError(res, 500, 'Failed to create complaint', err.message);
          }

          complaintDB.get(selectComplaintById, [this.lastID], (getErr, row) => {
            if (getErr) {
              return sendError(res, 500, 'Failed to fetch complaint', getErr.message);
            }
            return sendSuccess(res, 201, 'Complaint created successfully', row);
          });
        }
      );
    };

    if (requestedDepartmentId === null) {
      return persistComplaint(null);
    }

    if (finalOrganizationId === null) {
      return sendError(res, 400, 'department_id requires a routed organization');
    }

    complaintDB.get(
      selectDepartmentById,
      [requestedDepartmentId],
      (departmentErr, departmentRow) => {
        if (departmentErr) {
          return sendError(res, 500, 'Failed to validate department', departmentErr.message);
        }
        if (!departmentRow) {
          return sendError(res, 404, 'Selected department not found');
        }
        if (String(departmentRow.organization_id) !== String(finalOrganizationId)) {
          return sendError(res, 400, 'Selected department does not belong to the chosen organization');
        }
        return persistComplaint(requestedDepartmentId);
      }
    );
  };

  const requestedOrganizationId = organization_id === null || organization_id === undefined || organization_id === ''
    ? null
    : Number(organization_id);

  if (requestedOrganizationId !== null && (!Number.isInteger(requestedOrganizationId) || requestedOrganizationId <= 0)) {
    return sendError(res, 400, 'organization_id must be a valid organization id when provided');
  }

  const validateAndCreateComplaint = (resolvedOrganizationId) => {
    if (resolvedOrganizationId === null) {
      if (!allowUnassignedRouting) {
        return sendError(res, 400, 'organization_id is required unless unknown_organization is true');
      }
      return createComplaintRecord(null);
    }

    complaintDB.get(selectOrganizationById, [resolvedOrganizationId], (orgErr, organizationRow) => {
      if (orgErr) {
        return sendError(res, 500, 'Failed to validate organization', orgErr.message);
      }
      if (!organizationRow) {
        return sendError(res, 404, 'Selected organization not found');
      }
      if (String(organizationRow.status || '').toLowerCase() !== 'active') {
        return sendError(res, 400, 'Selected organization is not active');
      }
      return createComplaintRecord(resolvedOrganizationId);
    });
  };

  if (isAnonymousComplaint) {
    const fallbackOrganizationId = req.user?.organization_id ? Number(req.user.organization_id) : null;
    const finalOrganizationId = requestedOrganizationId ?? fallbackOrganizationId;
    return validateAndCreateComplaint(finalOrganizationId);
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], (userErr, userRow) => {
    if (userErr) {
      return sendError(res, 500, 'Failed to verify complaint author', userErr.message);
    }
    if (!userRow) {
      return sendError(res, 404, 'User not found');
    }

    const finalOrganizationId =
      requestedOrganizationId ??
      (userRow.organization_id ? Number(userRow.organization_id) : null);
    return validateAndCreateComplaint(finalOrganizationId);
  });
};

export const getUnassignedAnonymousComplaints = (req, res) => {
  if (req.user?.role !== 'super_admin') {
    return sendError(res, 403, 'Only super_admin can access anonymous triage complaints');
  }

  complaintDB.all(selectUnassignedAnonymousComplaints, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch unassigned anonymous complaints', err.message);
    }
    return sendSuccess(res, 200, 'Unassigned anonymous complaints retrieved successfully', rows);
  });
};

export const assignComplaintOrganization = (req, res) => {
  if (req.user?.role !== 'super_admin') {
    return sendError(res, 403, 'Only super_admin can assign anonymous complaints');
  }

  const organizationId = Number(req.body?.organization_id);
  if (!Number.isInteger(organizationId) || organizationId <= 0) {
    return sendError(res, 400, 'organization_id is required');
  }

  complaintDB.get(selectComplaintById, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch complaint', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Complaint not found');
    }
    if (!Number(existing.is_anonymous)) {
      return sendError(res, 400, 'Only anonymous complaints can be assigned through triage');
    }
    if (existing.complaint_organization_id) {
      return sendError(res, 400, 'Complaint is already assigned to an organization');
    }

    complaintDB.get(selectOrganizationById, [organizationId], (orgErr, organizationRow) => {
      if (orgErr) {
        return sendError(res, 500, 'Failed to validate organization', orgErr.message);
      }
      if (!organizationRow) {
        return sendError(res, 404, 'Selected organization not found');
      }
      if (String(organizationRow.status || '').toLowerCase() !== 'active') {
        return sendError(res, 400, 'Selected organization is not active');
      }

          complaintDB.run(assignComplaintOrganizationById, [organizationId, req.params.id], function onAssign(updateErr) {
            if (updateErr) {
              return sendError(res, 500, 'Failed to assign complaint organization', updateErr.message);
            }

            complaintDB.get(selectComplaintById, [req.params.id], (getErr, row) => {
              if (getErr) {
                return sendError(res, 500, 'Complaint assigned but failed to reload complaint', getErr.message);
              }
              const auditMeta = buildAuditMetadata(req);
              auditMeta.complaint_id = row.id;
              auditMeta.assigned_to = organizationId;
              void logAuditEntry(req, {
                action: 'assign_complaint_organization',
                targetTable: 'complaint',
                targetId: row.id,
                metadata: auditMeta
              }).catch((_) => {
                console.error('Failed to record audit log for complaint assignment');
              });
              return sendSuccess(res, 200, 'Complaint assigned to organization successfully', row);
            });
          });
    });
  });
};

export const getAllComplaints = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access complaint records directly')) {
    return;
  }

  if (req.user?.role === 'org_admin') {
    if (!req.user.organization_id) {
      return sendSuccess(res, 200, 'Complaints retrieved successfully', []);
    }

    complaintDB.all(selectComplaintByOrganizationId, [req.user.organization_id], (err, rows) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch complaints', err.message);
      }
      return sendSuccess(res, 200, 'Complaints retrieved successfully', rows);
    });
    return;
  }

  complaintDB.all(selectComplaintByUserId, [req.user?.id], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch complaints', err.message);
    }
    return sendSuccess(res, 200, 'Complaints retrieved successfully', rows);
  });
};

export const getComplaintById = (req, res) => {
  complaintDB.get(selectComplaintById, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch complaint', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Complaint not found');
    }

    if (req.user.role === 'super_admin') {
      return sendError(res, 403, 'Super admin cannot access complaint records directly');
    }
    if (req.user.role === 'org_admin') {
      if (!req.user.organization_id || String(req.user.organization_id) !== String(row.complaint_organization_id)) {
        return sendError(res, 403, 'Access denied');
      }
      return sendSuccess(res, 200, 'Complaint retrieved successfully', row);
    }
    if (row.user_id !== req.user.id) {
      return sendError(res, 403, 'Access denied');
    }

    return sendSuccess(res, 200, 'Complaint retrieved successfully', row);
  });
};

export const getComplaintByTrackingCode = (req, res) => {
  complaintDB.get(selectComplaintByTrackingCode, [req.params.trackingCode], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch complaint by tracking code', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Complaint not found');
    }
    return sendSuccess(res, 200, 'Complaint retrieved successfully', row);
  });
};

export const updateComplaint = (req, res) => {
  complaintDB.get(selectComplaintById, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch complaint', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Complaint not found');
    }
    if (req.user.role === 'super_admin') {
      return sendError(res, 403, 'Super admin cannot update complaint records directly');
    }
    if (req.user.role !== 'org_admin' && existing.user_id !== req.user.id) {
      return sendError(res, 403, 'Access denied');
    }
    if (req.user.role === 'org_admin' && String(existing.complaint_organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    const isAnonymous = req.body.is_anonymous === undefined ? !!existing.is_anonymous : !!req.body.is_anonymous;
    const updated = {
      department_id: req.body.department_id === undefined ? existing.complaint_department_id : req.body.department_id,
      is_anonymous: isAnonymous,
      anonymous_label: isAnonymous
        ? req.body.anonymous_label || existing.anonymous_label || 'Anonymous Reporter'
        : null,
      title: req.body.title || existing.title,
      complaint: req.body.complaint || existing.complaint,
      category: req.body.category === undefined ? existing.category : req.body.category,
      priority: req.body.priority || existing.priority,
      status: req.body.status || existing.status,
      admin_response: req.body.admin_response === undefined ? existing.admin_response : req.body.admin_response
    };

    if (!VALID_COMPLAINT_PRIORITIES.includes(updated.priority)) {
      return sendError(res, 400, `priority must be one of: ${VALID_COMPLAINT_PRIORITIES.join(', ')}`);
    }
    if (!VALID_COMPLAINT_STATUSES.includes(updated.status)) {
      return sendError(res, 400, `status must be one of: ${VALID_COMPLAINT_STATUSES.join(', ')}`);
    }
    if (req.user.role !== 'super_admin' && req.user.role !== 'org_admin' && updated.status !== existing.status) {
      return sendError(res, 403, 'Only admin can update complaint status');
    }
    if (req.user.role !== 'super_admin' && req.user.role !== 'org_admin' && req.body.admin_response !== undefined) {
      return sendError(res, 403, 'Only admin can add a complaint response');
    }

    const reviewedBy = req.user.role === 'org_admin' ? req.user.id : existing.reviewed_by;
    const reviewedAt = req.user.role === 'org_admin'
      ? new Date().toISOString().slice(0, 19).replace('T', ' ')
      : existing.reviewed_at;

    const normalizedDepartmentId =
      updated.department_id === null || updated.department_id === undefined || updated.department_id === ''
        ? null
        : Number(updated.department_id);

    if (normalizedDepartmentId !== null && (!Number.isInteger(normalizedDepartmentId) || normalizedDepartmentId <= 0)) {
      return sendError(res, 400, 'department_id must be a valid department id when provided');
    }

    const continueUpdate = () => {
      complaintDB.run(
        updateComplaintById,
        [
          normalizedDepartmentId,
          updated.is_anonymous ? 1 : 0,
          updated.anonymous_label,
          updated.title,
          updated.complaint,
          updated.category,
          updated.priority,
          updated.status,
          updated.admin_response,
          reviewedBy,
          reviewedAt,
          req.params.id
        ],
        function onUpdate(updateErr) {
          if (updateErr) {
            return sendError(res, 500, 'Failed to update complaint', updateErr.message);
          }

          complaintDB.get(selectComplaintById, [req.params.id], (getErr, row) => {
            if (getErr) {
              return sendError(res, 500, 'Failed to fetch updated complaint', getErr.message);
            }
            return sendSuccess(res, 200, 'Complaint updated successfully', row);
          });
        }
      );
    };

    if (normalizedDepartmentId === null) {
      return continueUpdate();
    }

    complaintDB.get(selectDepartmentById, [normalizedDepartmentId], (departmentErr, departmentRow) => {
      if (departmentErr) {
        return sendError(res, 500, 'Failed to validate department', departmentErr.message);
      }
      if (!departmentRow) {
        return sendError(res, 404, 'Selected department not found');
      }
      if (String(departmentRow.organization_id) !== String(existing.complaint_organization_id)) {
        return sendError(res, 400, 'Selected department does not belong to the complaint organization');
      }
      return continueUpdate();
    });
  });
};

export const deleteComplaint = (req, res) => {
  complaintDB.get(selectComplaintById, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch complaint', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Complaint not found');
    }
    if (req.user.role === 'super_admin') {
      return sendError(res, 403, 'Super admin cannot delete complaint records directly');
    }
    if (req.user.role !== 'org_admin' && existing.user_id !== req.user.id) {
      return sendError(res, 403, 'Access denied');
    }
    if (req.user.role === 'org_admin' && String(existing.complaint_organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(deleteComplaintById, [req.params.id], function onDelete(deleteErr) {
      if (deleteErr) {
        return sendError(res, 500, 'Failed to delete complaint', deleteErr.message);
      }
      return sendSuccess(res, 200, 'Complaint deleted successfully', { id: req.params.id });
    });
  });
};
