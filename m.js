import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  Complaint,
  insertComplaint,
  selectComplaint,
  selectComplaintById,
  selectComplaintByUserId,
  updateComplaintById,
  deleteComplaintById,
  VALID_COMPLAINT_PRIORITIES,
  VALID_COMPLAINT_STATUSES
} from '../model/complaint.model.js';

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

const generateTrackingCode = () =>
  `CMP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const ensureComplaintTableSchema = async () => {
  const columns = await allQuery('PRAGMA table_info(complaint)');
  const existing = new Set(columns.map((col) => col.name));

  if (!existing.has('user_id')) await runQuery('ALTER TABLE complaint ADD COLUMN user_id INTEGER');
  if (!existing.has('is_anonymous')) await runQuery('ALTER TABLE complaint ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0');
  if (!existing.has('anonymous_label')) await runQuery('ALTER TABLE complaint ADD COLUMN anonymous_label TEXT');
  if (!existing.has('title')) await runQuery('ALTER TABLE complaint ADD COLUMN title TEXT');
  if (!existing.has('category')) await runQuery('ALTER TABLE complaint ADD COLUMN category TEXT');
  if (!existing.has('priority')) await runQuery("ALTER TABLE complaint ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'");
  if (!existing.has('status')) await runQuery("ALTER TABLE complaint ADD COLUMN status TEXT NOT NULL DEFAULT 'submitted'");
  if (!existing.has('tracking_code')) await runQuery('ALTER TABLE complaint ADD COLUMN tracking_code TEXT');
  if (!existing.has('updated_at')) await runQuery('ALTER TABLE complaint ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');

  await runQuery("UPDATE complaint SET title = COALESCE(title, 'Untitled Complaint')");
  await runQuery("UPDATE complaint SET priority = COALESCE(priority, 'medium')");
  await runQuery("UPDATE complaint SET status = COALESCE(status, 'submitted')");

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
    anonymous_label = null
  } = req.body;

  if (!title || !complaint) {
    return sendError(res, 400, 'title and complaint are required');
  }
  if (!VALID_COMPLAINT_PRIORITIES.includes(priority)) {
    return sendError(res, 400, `priority must be one of: ${VALID_COMPLAINT_PRIORITIES.join(', ')}`);
  }
  if (!VALID_COMPLAINT_STATUSES.includes(status)) {
    return sendError(res, 400, `status must be one of: ${VALID_COMPLAINT_STATUSES.join(', ')}`);
  }
  if (!is_anonymous && !req.user) {
    return sendError(res, 401, 'Authentication is required for non-anonymous complaint submission');
  }
  if (req.user?.role !== 'admin' && status !== 'submitted') {
    return sendError(res, 403, 'Only admin can create a complaint with a custom status');
  }

  const finalUserId = is_anonymous ? null : req.user?.id || null;
  const finalAnonymousLabel = is_anonymous ? anonymous_label || 'Anonymous Reporter' : null;
  const trackingCode = generateTrackingCode();

  complaintDB.run(
    insertComplaint,
    [
      finalUserId,
      is_anonymous ? 1 : 0,
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

export const getAllComplaints = (req, res) => {
  const query = req.user?.role === 'admin' ? selectComplaint : selectComplaintByUserId;
  const params = req.user?.role === 'admin' ? [] : [req.user?.id];

  complaintDB.all(query, params, (err, rows) => {
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

    if (req.user.role !== 'admin' && row.user_id !== req.user.id) {
      return sendError(res, 403, 'Access denied');
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
    if (req.user.role !== 'admin' && existing.user_id !== req.user.id) {
      return sendError(res, 403, 'Access denied');
    }

    const isAnonymous = req.body.is_anonymous === undefined ? !!existing.is_anonymous : !!req.body.is_anonymous;
    const updated = {
      is_anonymous: isAnonymous,
      anonymous_label: isAnonymous
        ? req.body.anonymous_label || existing.anonymous_label || 'Anonymous Reporter'
        : null,
      title: req.body.title || existing.title,
      complaint: req.body.complaint || existing.complaint,
      category: req.body.category === undefined ? existing.category : req.body.category,
      priority: req.body.priority || existing.priority,
      status: req.body.status || existing.status
    };

    if (!VALID_COMPLAINT_PRIORITIES.includes(updated.priority)) {
      return sendError(res, 400, `priority must be one of: ${VALID_COMPLAINT_PRIORITIES.join(', ')}`);
    }
    if (!VALID_COMPLAINT_STATUSES.includes(updated.status)) {
      return sendError(res, 400, `status must be one of: ${VALID_COMPLAINT_STATUSES.join(', ')}`);
    }
    if (req.user.role !== 'admin' && updated.status !== existing.status) {
      return sendError(res, 403, 'Only admin can update complaint status');
    }

    complaintDB.run(
      updateComplaintById,
      [
        updated.is_anonymous ? 1 : 0,
        updated.anonymous_label,
        updated.title,
        updated.complaint,
        updated.category,
        updated.priority,
        updated.status,
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
    if (req.user.role !== 'admin' && existing.user_id !== req.user.id) {
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
