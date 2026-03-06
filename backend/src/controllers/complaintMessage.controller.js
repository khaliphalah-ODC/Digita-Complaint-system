// complaintMessage.controller controller: handles complaint live-chat HTTP request/response flow.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  complaintMessagesQuery,
  createComplaintMessageQuery,
  fetchComplaintMessageByIdQuery,
  fetchComplaintMessagesByComplaintIdQuery
} from '../model/complaintMessage.model.js';

const fetchComplaintOwnerQuery = `SELECT id, user_id, is_anonymous FROM complaint WHERE id = ?;`;

export const CreateComplaintMessagesTable = () => {
  complaintDB.run(complaintMessagesQuery, (err) => {
    if (err) {
      console.error('Error creating complaint_messages table:', err.message);
    } else {
      console.log('Complaint messages table created or already exists');
    }
  });
};

const ensureChatAccess = (req, res, complaintId, onAllowed) => {
  complaintDB.get(fetchComplaintOwnerQuery, [complaintId], (findErr, complaintRow) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to validate complaint', findErr.message);
    }
    if (!complaintRow) {
      return sendError(res, 404, 'Complaint not found');
    }

    if (req.user.role === 'admin') {
      return onAllowed(complaintRow);
    }
    if (!complaintRow.user_id || complaintRow.user_id !== req.user.id) {
      return sendError(res, 403, 'Access denied');
    }
    return onAllowed(complaintRow);
  });
};

export const getComplaintMessagesByComplaintId = (req, res) => {
  const complaintId = Number(req.params.complaintId);
  if (!complaintId) {
    return sendError(res, 400, 'Invalid complaint id');
  }

  return ensureChatAccess(req, res, complaintId, () => {
    complaintDB.all(fetchComplaintMessagesByComplaintIdQuery, [complaintId], (err, rows) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch complaint messages', err.message);
      }
      return sendSuccess(res, 200, 'Complaint messages retrieved successfully', rows);
    });
  });
};

export const createComplaintMessage = (req, res) => {
  const complaintId = Number(req.params.complaintId);
  const text = String(req.body?.message || '').trim();

  if (!complaintId) {
    return sendError(res, 400, 'Invalid complaint id');
  }
  if (!text) {
    return sendError(res, 400, 'message is required');
  }

  return ensureChatAccess(req, res, complaintId, () => {
    complaintDB.run(
      createComplaintMessageQuery,
      [complaintId, req.user.id, req.user.role === 'admin' ? 'admin' : 'user', text],
      function onCreate(err) {
        if (err) {
          return sendError(res, 500, 'Failed to create complaint message', err.message);
        }
        complaintDB.get(fetchComplaintMessageByIdQuery, [this.lastID], (getErr, row) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch complaint message', getErr.message);
          }
          return sendSuccess(res, 201, 'Complaint message sent successfully', row);
        });
      }
    );
  });
};

