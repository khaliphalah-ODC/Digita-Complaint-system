// complaintMessage.controller controller: handles complaint live-chat HTTP request/response flow.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { selectComplaintById } from '../model/complaint.model.js';
import {
  complaintMessagesQuery,
  createComplaintMessageQuery,
  deleteComplaintMessageByIdQuery,
  fetchComplaintMessageByIdQuery,
  fetchComplaintMessagesByComplaintIdQuery,
  updateComplaintMessageByIdQuery
} from '../model/complaintMessage.model.js';

export const CreateComplaintMessagesTable = () => {
  complaintDB.run(complaintMessagesQuery, (err) => {
    if (err) {
      console.error('Error creating complaint_messages table:', err.message);
    } else {
      console.log('Complaint messages table created or already exists');
      complaintDB.all('PRAGMA table_info(complaint_messages)', [], (pragmaErr, columns) => {
        if (pragmaErr) {
          console.error('Error inspecting complaint_messages table:', pragmaErr.message);
          return;
        }

        const hasUpdatedAt = (columns || []).some((column) => column.name === 'updated_at');
        if (hasUpdatedAt) {
          return;
        }

        complaintDB.run(
          'ALTER TABLE complaint_messages ADD COLUMN updated_at DATETIME',
          (alterErr) => {
            if (alterErr) {
              console.error('Error migrating complaint_messages table (updated_at):', alterErr.message);
            } else {
              complaintDB.run(
                'UPDATE complaint_messages SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)',
                (updateErr) => {
                  if (updateErr) {
                    console.error('Error backfilling complaint_messages.updated_at:', updateErr.message);
                  } else {
                    console.log('Complaint messages table migrated successfully (updated_at)');
                  }
                }
              );
            }
          }
        );
      });
    }
  });
};

const ensureChatAccess = (req, res, complaintId, onAllowed) => {
  complaintDB.get(selectComplaintById, [complaintId], (findErr, complaintRow) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to validate complaint', findErr.message);
    }
    if (!complaintRow) {
      return sendError(res, 404, 'Complaint not found');
    }

    if (req.user.role === 'super_admin') {
      return sendError(res, 403, 'Super admin cannot access complaint chat directly');
    }
    if (req.user.role === 'org_admin') {
      if (String(complaintRow.complaint_organization_id) !== String(req.user.organization_id)) {
        return sendError(res, 403, 'Access denied');
      }
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
      [complaintId, req.user.id, req.user.role === 'org_admin' ? 'admin' : 'user', text],
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

export const updateComplaintMessage = (req, res) => {
  const complaintId = Number(req.params.complaintId);
  const messageId = Number(req.params.messageId);
  const text = String(req.body?.message || '').trim();

  if (!complaintId || !messageId) {
    return sendError(res, 400, 'Invalid complaint or message id');
  }
  if (!text) {
    return sendError(res, 400, 'message is required');
  }

  return ensureChatAccess(req, res, complaintId, () => {
    complaintDB.run(
      updateComplaintMessageByIdQuery,
      [text, messageId, complaintId, req.user.id],
      function onUpdate(err) {
        if (err) {
          return sendError(res, 500, 'Failed to update complaint message', err.message);
        }
        if (this.changes === 0) {
          return sendError(res, 403, 'You can only edit your own messages');
        }
        complaintDB.get(fetchComplaintMessageByIdQuery, [messageId], (getErr, row) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch updated complaint message', getErr.message);
          }
          return sendSuccess(res, 200, 'Complaint message updated successfully', row);
        });
      }
    );
  });
};

export const deleteComplaintMessage = (req, res) => {
  const complaintId = Number(req.params.complaintId);
  const messageId = Number(req.params.messageId);

  if (!complaintId || !messageId) {
    return sendError(res, 400, 'Invalid complaint or message id');
  }

  return ensureChatAccess(req, res, complaintId, () => {
    complaintDB.run(
      deleteComplaintMessageByIdQuery,
      [messageId, complaintId, req.user.id],
      function onDelete(err) {
        if (err) {
          return sendError(res, 500, 'Failed to delete complaint message', err.message);
        }
        if (this.changes === 0) {
          return sendError(res, 403, 'You can only delete your own messages');
        }
        return sendSuccess(res, 200, 'Complaint message deleted successfully', {
          id: messageId,
          complaint_id: complaintId
        });
      }
    );
  });
};
