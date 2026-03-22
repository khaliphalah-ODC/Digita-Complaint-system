// statusLog.controller controller: handles HTTP request/response flow for this module.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { fetchAccessmentByIdQuery } from '../model/assessment.model.js';
import {
  statusLogsQuery,
  createStatusLogQuery,
  fetchAllStatusLogsQuery,
  fetchStatusLogByIdQuery,
  fetchStatusLogsByAccessmentIdQuery,
  fetchStatusLogsByOrganizationIdQuery,
  updateStatusLogQuery,
  deleteStatusLogByIdQuery,
  deleteStatusLogsByAccessmentIdQuery
} from '../model/statusLog.model.js';
import { denySuperAdminInternalAccess } from '../utils/tenantScope.js';

const allQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows || []);
    });
  });

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });

const isOrgAdmin = (req) => req.user?.role === 'org_admin';

export const CreateStatusLogsTable = () => {
  complaintDB.run(statusLogsQuery, async (err) => {
    if (err) {
      console.error('Error creating status_logs table:', err.message);
    } else {
      try {
        const columns = await allQuery('PRAGMA table_info(status_logs)');
        const existing = new Set(columns.map((col) => col.name));
        if (!existing.has('organization_id')) {
          await runQuery('ALTER TABLE status_logs ADD COLUMN organization_id INTEGER');
        }
        await runQuery(`
          UPDATE status_logs
          SET organization_id = (
            SELECT a.organization_id
            FROM accessments a
            WHERE a.id = status_logs.accessment_id
          )
          WHERE organization_id IS NULL
        `);
        await runQuery('CREATE INDEX IF NOT EXISTS idx_status_logs_organization_id ON status_logs(organization_id)');
        console.log('Status logs table created or already exists');
      } catch (migrationErr) {
        console.error('Error migrating status_logs table:', migrationErr.message);
      }
    }
  });
};

export const createStatusLog = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage status logs directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can manage status logs');
  }

  const { accessment_id, old_status = null, new_status, notes = null } = req.body;

  if (!accessment_id || !new_status) {
    return sendError(res, 400, 'assessment_id and new_status are required');
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

    complaintDB.run(
      createStatusLogQuery,
      [accessment_id, accessmentRow.organization_id, req.user.id, old_status, new_status, notes],
      function onCreate(err) {
        if (err) {
          return sendError(res, 500, 'Failed to create status log', err.message);
        }

        complaintDB.get(fetchStatusLogByIdQuery, [this.lastID], (getErr, row) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch status log', getErr.message);
          }
          return sendSuccess(res, 201, 'Status log created successfully', row);
        });
      }
    );
  });
};

export const getAllStatusLogs = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access status logs directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can access status logs');
  }

  complaintDB.all(fetchStatusLogsByOrganizationIdQuery, [req.user.organization_id], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch status logs', err.message);
    }
    return sendSuccess(res, 200, 'Status logs retrieved successfully', rows);
  });
};

export const getStatusLogById = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access status logs directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can access status logs');
  }

  complaintDB.get(fetchStatusLogByIdQuery, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch status log', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Status log not found');
    }
    if (String(row.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }
    return sendSuccess(res, 200, 'Status log retrieved successfully', row);
  });
};

export const getStatusLogsByAccessmentId = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access status logs directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can access status logs');
  }

  complaintDB.get(fetchAccessmentByIdQuery, [req.params.accessmentId], (accessmentErr, accessmentRow) => {
    if (accessmentErr) {
      return sendError(res, 500, 'Failed to validate assessment', accessmentErr.message);
    }
    if (!accessmentRow) {
      return sendError(res, 404, 'Assessment not found');
    }
    if (String(accessmentRow.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.all(fetchStatusLogsByAccessmentIdQuery, [req.params.accessmentId], (err, rows) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch status logs by assessment', err.message);
      }
      return sendSuccess(res, 200, 'Status logs retrieved successfully', rows);
    });
  });
};

export const updateStatusLog = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage status logs directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can manage status logs');
  }

  const { old_status = null, new_status, notes = null } = req.body;

  if (!new_status) {
    return sendError(res, 400, 'new_status is required');
  }

  complaintDB.get(fetchStatusLogByIdQuery, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch status log', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Status log not found');
    }
    if (String(existing.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(updateStatusLogQuery, [old_status, new_status, notes, req.params.id], function onUpdate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to update status log', err.message);
      }

      complaintDB.get(fetchStatusLogByIdQuery, [req.params.id], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch updated status log', getErr.message);
        }
        return sendSuccess(res, 200, 'Status log updated successfully', row);
      });
    });
  });
};

export const deleteStatusLog = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage status logs directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can manage status logs');
  }

  complaintDB.get(fetchStatusLogByIdQuery, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch status log', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Status log not found');
    }
    if (String(existing.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(deleteStatusLogByIdQuery, [req.params.id], function onDelete(err) {
      if (err) {
        return sendError(res, 500, 'Failed to delete status log', err.message);
      }
      return sendSuccess(res, 200, 'Status log deleted successfully', { id: req.params.id });
    });
  });
};

export const deleteStatusLogsByAccessmentId = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage status logs directly')) {
    return;
  }
  if (!isOrgAdmin(req)) {
    return sendError(res, 403, 'Only org_admin can manage status logs');
  }

  complaintDB.get(fetchAccessmentByIdQuery, [req.params.accessmentId], (accessmentErr, accessmentRow) => {
    if (accessmentErr) {
      return sendError(res, 500, 'Failed to validate assessment', accessmentErr.message);
    }
    if (!accessmentRow) {
      return sendError(res, 404, 'Assessment not found');
    }
    if (String(accessmentRow.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(deleteStatusLogsByAccessmentIdQuery, [req.params.accessmentId], function onDelete(err) {
      if (err) {
        return sendError(res, 500, 'Failed to delete status logs', err.message);
      }
      return sendSuccess(res, 200, 'Status logs deleted successfully', {
        accessment_id: req.params.accessmentId,
        deleted_count: this.changes
      });
    });
  });
};
