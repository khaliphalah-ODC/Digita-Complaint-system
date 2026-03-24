// feedback.controller controller: handles HTTP request/response flow for this module.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  Feedback,
  createFeedbackQuery,
  fetchFeedbackByIdQuery,
  fetchFeedbackByUserIdQuery,
  updateFeedbackQuery,
  deleteFeedbackByIdQuery
} from '../model/feedback.model.js';
import { selectComplaintById } from '../model/complaint.model.js';
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

const ensureFeedbackTableSchema = async () => {
  const fkRows = await allQuery('PRAGMA foreign_key_list(feedback)');
  const hasLegacyComplaintFk = fkRows.some((row) => row.from === 'complaint_id' && row.table === 'complaints');

  if (!hasLegacyComplaintFk) {
    return;
  }

  // Rebuild feedback table with correct FK to complaint(id).
  await runQuery('ALTER TABLE feedback RENAME TO feedback_legacy');
  await runQuery(Feedback);
  await runQuery(
    `
    INSERT INTO feedback (id, complaint_id, user_id, rating, comment, created_at)
    SELECT fl.id, fl.complaint_id, fl.user_id, fl.rating, fl.comment, fl.created_at
    FROM feedback_legacy fl
    INNER JOIN complaint c ON c.id = fl.complaint_id
    INNER JOIN users u ON u.id = fl.user_id
    `
  );
  await runQuery('DROP TABLE feedback_legacy');
};

export const CreateFeedbackTable = () => {
  complaintDB.run(Feedback, async (err) => {
    if (err) {
      console.error('Error creating feedback table:', err.message);
    } else {
      try {
        await ensureFeedbackTableSchema();
        console.log('Feedback table created or already exists');
      } catch (migrationErr) {
        console.error('Error migrating feedback table:', migrationErr.message);
      }
    }
  });
};

export const createFeedback = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access feedback records directly')) {
    return;
  }
  if (req.user?.role !== 'user') {
    return sendError(res, 403, 'Only users can access feedback records');
  }

  const complaintId = Number(req.body?.complaint_id);
  const rating = Number(req.body?.rating);
  const comment = req.body?.comment ?? null;

  if (!Number.isInteger(complaintId) || complaintId <= 0 || !Number.isInteger(rating)) {
    return sendError(res, 400, 'complaint_id and rating are required');
  }
  if (rating < 1 || rating > 5) {
    return sendError(res, 400, 'rating must be between 1 and 5');
  }

  complaintDB.get(selectComplaintById, [complaintId], (complaintErr, complaintRow) => {
    if (complaintErr) {
      return sendError(res, 500, 'Failed to validate complaint', complaintErr.message);
    }
    if (!complaintRow) {
      return sendError(res, 404, 'Complaint not found');
    }

    complaintDB.get('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userRow) => {
      if (userErr) {
        return sendError(res, 500, 'Failed to validate user', userErr.message);
      }
      if (!userRow) {
        return sendError(res, 401, 'Authenticated user does not exist');
      }

      if (complaintRow.user_id !== req.user.id) {
        return sendError(res, 403, 'You can only submit feedback for your own complaint');
      }

      complaintDB.run(
        createFeedbackQuery,
        [complaintId, req.user.id, rating, comment],
        function onCreate(err) {
          if (err) {
            if (String(err.message || '').includes('SQLITE_CONSTRAINT: FOREIGN KEY constraint failed')) {
              return sendError(
                res,
                400,
                'Invalid complaint reference or user reference for feedback',
                err.message
              );
            }
            return sendError(res, 500, 'Failed to create feedback', err.message);
          }
          complaintDB.get(fetchFeedbackByIdQuery, [this.lastID], (getErr, row) => {
            if (getErr) {
              return sendError(res, 500, 'Failed to fetch feedback', getErr.message);
            }
            return sendSuccess(res, 201, 'Feedback created successfully', row);
          });
        }
      );
    });
  });
};

export const getAllFeedback = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access feedback records directly')) {
    return;
  }
  if (req.user?.role !== 'user') {
    return sendError(res, 403, 'Only users can access feedback records');
  }

  complaintDB.all(fetchFeedbackByUserIdQuery, [req.user.id], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch feedback', err.message);
    }
    return sendSuccess(res, 200, 'Feedback retrieved successfully', rows);
  });
};

export const getFeedbackById = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access feedback records directly')) {
    return;
  }
  if (req.user?.role !== 'user') {
    return sendError(res, 403, 'Only users can access feedback records');
  }

  complaintDB.get(fetchFeedbackByIdQuery, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch feedback', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Feedback not found');
    }
    if (Number(row.user_id) !== Number(req.user.id)) {
      return sendError(res, 403, 'Access denied');
    }
    return sendSuccess(res, 200, 'Feedback retrieved successfully', row);
  });
};

export const updateFeedback = (req, res) => {
  const { rating, comment = null } = req.body;

  if (!rating) {
    return sendError(res, 400, 'rating is required');
  }
  if (rating < 1 || rating > 5) {
    return sendError(res, 400, 'rating must be between 1 and 5');
  }

  complaintDB.get(fetchFeedbackByIdQuery, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch feedback', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Feedback not found');
    }
    if (req.user.role !== 'user') {
      return sendError(res, 403, 'Only users can update feedback records');
    }
    if (existing.user_id !== req.user.id) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(updateFeedbackQuery, [rating, comment, req.params.id], function onUpdate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to update feedback', err.message);
      }

      complaintDB.get(fetchFeedbackByIdQuery, [req.params.id], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch updated feedback', getErr.message);
        }
        return sendSuccess(res, 200, 'Feedback updated successfully', row);
      });
    });
  });
};

export const deleteFeedback = (req, res) => {
  complaintDB.get(fetchFeedbackByIdQuery, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch feedback', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Feedback not found');
    }
    if (req.user.role !== 'user') {
      return sendError(res, 403, 'Only users can delete feedback records');
    }
    if (existing.user_id !== req.user.id) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(deleteFeedbackByIdQuery, [req.params.id], function onDelete(err) {
      if (err) {
        return sendError(res, 500, 'Failed to delete feedback', err.message);
      }
      return sendSuccess(res, 200, 'Feedback deleted successfully', { id: req.params.id });
    });
  });
};
