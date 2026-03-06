// accessment.controller controller: handles HTTP request/response flow for this module.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { selectComplaintById } from '../model/complaint.model.js';
import {
  accessmentQuery,
  createAccessmentQuery,
  fetchAccessmentsQuery,
  fetchAccessmentByIdQuery,
  fetchAccessmentsByComplaintIdQuery,
  fetchAccessmentsByAssessorIdQuery,
  updateAccessmentQuery,
  updateAccessmentAdminResponseQuery,
  deleteAccessmentQuery,
  VALID_ACCESSMENT_STATUSES
} from '../model/accessment.model.js';

const isAdmin = (req) => req.user?.role === 'admin';

const allQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows);
    });
  });

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });

const ensureAccessmentsTableSchema = async () => {
  const columns = await allQuery('PRAGMA table_info(accessments)');
  const existing = new Set(columns.map((col) => col.name));

  if (!existing.has('complaint_id')) await runQuery('ALTER TABLE accessments ADD COLUMN complaint_id INTEGER');
  if (!existing.has('assessor_id')) await runQuery('ALTER TABLE accessments ADD COLUMN assessor_id INTEGER');
  if (!existing.has('findings')) await runQuery('ALTER TABLE accessments ADD COLUMN findings TEXT');
  if (!existing.has('recommendation')) await runQuery('ALTER TABLE accessments ADD COLUMN recommendation TEXT');
  if (!existing.has('status')) await runQuery("ALTER TABLE accessments ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
  if (!existing.has('admin_response')) await runQuery('ALTER TABLE accessments ADD COLUMN admin_response TEXT');
  if (!existing.has('updated_at')) await runQuery('ALTER TABLE accessments ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');

  await runQuery("UPDATE accessments SET status = COALESCE(status, 'pending')");
  await runQuery('CREATE INDEX IF NOT EXISTS idx_accessments_complaint_id ON accessments(complaint_id)');
  await runQuery('CREATE INDEX IF NOT EXISTS idx_accessments_assessor_id ON accessments(assessor_id)');
};

export const CreateAccessmentsTable = () => {
  complaintDB.run(accessmentQuery, async (err) => {
    if (err) {
      console.error('Error creating accessments table:', err.message);
      return;
    }
    try {
      await ensureAccessmentsTableSchema();
      console.log('Accessments table created or already exists');
    } catch (migrationErr) {
      console.error('Error migrating accessments table:', migrationErr.message);
    }
  });
};

export const createAccessment = (req, res) => {
  if (!isAdmin(req)) {
    return sendError(res, 403, 'Only admin can create accessments');
  }

  const {
    complaint_id,
    findings,
    recommendation = null,
    status = 'pending',
    admin_response = null
  } = req.body;

  if (!complaint_id || !findings) {
    return sendError(res, 400, 'complaint_id and findings are required');
  }
  if (!VALID_ACCESSMENT_STATUSES.includes(status)) {
    return sendError(res, 400, `status must be one of: ${VALID_ACCESSMENT_STATUSES.join(', ')}`);
  }

  complaintDB.get(selectComplaintById, [complaint_id], (complaintErr, complaintRow) => {
    if (complaintErr) {
      return sendError(res, 500, 'Failed to validate complaint', complaintErr.message);
    }
    if (!complaintRow) {
      return sendError(res, 404, 'Complaint not found');
    }

    complaintDB.run(
      createAccessmentQuery,
      [complaint_id, req.user.id, findings, recommendation, status, admin_response],
      function onCreate(err) {
        if (err) {
          return sendError(res, 500, 'Failed to create accessment', err.message);
        }

        complaintDB.get(fetchAccessmentByIdQuery, [this.lastID], (getErr, row) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch accessment', getErr.message);
          }
          return sendSuccess(res, 201, 'Accessment created successfully', row);
        });
      }
    );
  });
};

export const getAllAccessments = (req, res) => {
  if (!isAdmin(req)) {
    return sendError(res, 403, 'Only admin can view all accessments');
  }

  complaintDB.all(fetchAccessmentsQuery, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch accessments', err.message);
    }
    return sendSuccess(res, 200, 'Accessments retrieved successfully', rows);
  });
};

export const getAccessmentById = (req, res) => {
  complaintDB.get(fetchAccessmentByIdQuery, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch accessment', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Accessment not found');
    }

    if (!isAdmin(req) && row.complaint_user_id !== req.user.id && row.assessor_id !== req.user.id) {
      return sendError(res, 403, 'Access denied');
    }

    return sendSuccess(res, 200, 'Accessment retrieved successfully', row);
  });
};

export const getAccessmentsByComplaintId = (req, res) => {
  complaintDB.get(selectComplaintById, [req.params.complaintId], (complaintErr, complaintRow) => {
    if (complaintErr) {
      return sendError(res, 500, 'Failed to validate complaint', complaintErr.message);
    }
    if (!complaintRow) {
      return sendError(res, 404, 'Complaint not found');
    }
    if (!isAdmin(req) && complaintRow.user_id !== req.user.id) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.all(fetchAccessmentsByComplaintIdQuery, [req.params.complaintId], (err, rows) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch accessments by complaint', err.message);
      }
      return sendSuccess(res, 200, 'Accessments retrieved successfully', rows);
    });
  });
};

export const getAccessmentsByUserId = (req, res) => {
  if (!isAdmin(req) && Number(req.params.userId) !== req.user.id) {
    return sendError(res, 403, 'Access denied');
  }

  complaintDB.all(fetchAccessmentsByAssessorIdQuery, [req.params.userId], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch accessments by user', err.message);
    }
    return sendSuccess(res, 200, 'Accessments retrieved successfully', rows);
  });
};

export const updateAccessment = (req, res) => {
  if (!isAdmin(req)) {
    return sendError(res, 403, 'Only admin can update accessments');
  }

  complaintDB.get(fetchAccessmentByIdQuery, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch accessment', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Accessment not found');
    }

    const findings = req.body.findings || existing.findings;
    const recommendation = req.body.recommendation === undefined ? existing.recommendation : req.body.recommendation;
    const status = req.body.status || existing.status;
    const admin_response = req.body.admin_response === undefined ? existing.admin_response : req.body.admin_response;

    if (!VALID_ACCESSMENT_STATUSES.includes(status)) {
      return sendError(res, 400, `status must be one of: ${VALID_ACCESSMENT_STATUSES.join(', ')}`);
    }

    complaintDB.run(
      updateAccessmentQuery,
      [findings, recommendation, status, admin_response, req.params.id],
      function onUpdate(err) {
        if (err) {
          return sendError(res, 500, 'Failed to update accessment', err.message);
        }

        complaintDB.get(fetchAccessmentByIdQuery, [req.params.id], (getErr, row) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch updated accessment', getErr.message);
          }
          return sendSuccess(res, 200, 'Accessment updated successfully', row);
        });
      }
    );
  });
};

export const updateAccessmentAdminResponse = (req, res) => {
  if (!isAdmin(req)) {
    return sendError(res, 403, 'Only admin can update admin response');
  }

  const { admin_response } = req.body;
  if (!admin_response) {
    return sendError(res, 400, 'admin_response is required');
  }

  complaintDB.run(updateAccessmentAdminResponseQuery, [admin_response, req.params.id], function onUpdate(err) {
    if (err) {
      return sendError(res, 500, 'Failed to update accessment', err.message);
    }

    if (this.changes === 0) {
      return sendError(res, 404, 'Accessment not found');
    }

    complaintDB.get(fetchAccessmentByIdQuery, [req.params.id], (getErr, row) => {
      if (getErr) {
        return sendError(res, 500, 'Failed to fetch updated accessment', getErr.message);
      }
      return sendSuccess(res, 200, 'Accessment updated successfully', row);
    });
  });
};

export const deleteAccessment = (req, res) => {
  if (!isAdmin(req)) {
    return sendError(res, 403, 'Only admin can delete accessments');
  }

  complaintDB.run(deleteAccessmentQuery, [req.params.id], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete accessment', err.message);
    }

    if (this.changes === 0) {
      return sendError(res, 404, 'Accessment not found');
    }

    return sendSuccess(res, 200, 'Accessment deleted successfully', { id: req.params.id });
  });
};
