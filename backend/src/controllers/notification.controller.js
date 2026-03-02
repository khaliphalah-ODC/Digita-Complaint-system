// notification.controller controller: handles HTTP request/response flow for this module.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  notificationsQuery,
  createNotificationQuery,
  fetchNotificationsQuery,
  fetchNotificationByIdQuery,
  fetchNotificationsByComplaintIdQuery,
  markNotificationAsReadQuery,
  deleteNotificationByIdQuery
} from '../model/notification.model.js';

export const CreateNotificationsTable = () => {
  complaintDB.run(notificationsQuery, (err) => {
    if (err) {
      console.error('Error creating notifications table:', err.message);
    } else {
      console.log('Notifications table created or already exists');
    }
  });
};

export const createNotification = (req, res) => {
  const { user_id = null, complaint_id = null, type, message, is_read = 0 } = req.body;

  if (!type || !message) {
    return sendError(res, 400, 'type and message are required');
  }

  complaintDB.run(
    createNotificationQuery,
    [user_id, complaint_id, type, message, is_read ? 1 : 0],
    function onCreate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create notification', err.message);
      }

      complaintDB.get(fetchNotificationByIdQuery, [this.lastID], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch notification', getErr.message);
        }
        return sendSuccess(res, 201, 'Notification created successfully', row);
      });
    }
  );
};

export const getAllNotifications = (_req, res) => {
  complaintDB.all(fetchNotificationsQuery, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch notifications', err.message);
    }
    return sendSuccess(res, 200, 'Notifications retrieved successfully', rows);
  });
};

export const getNotificationById = (req, res) => {
  complaintDB.get(fetchNotificationByIdQuery, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch notification', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Notification not found');
    }
    return sendSuccess(res, 200, 'Notification retrieved successfully', row);
  });
};

export const getNotificationsByComplaintId = (req, res) => {
  complaintDB.all(fetchNotificationsByComplaintIdQuery, [req.params.complaintId], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch notifications', err.message);
    }
    return sendSuccess(res, 200, 'Notifications retrieved successfully', rows);
  });
};

export const markNotificationAsRead = (req, res) => {
  complaintDB.run(markNotificationAsReadQuery, [req.params.id], function onUpdate(err) {
    if (err) {
      return sendError(res, 500, 'Failed to update notification', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Notification not found');
    }

    complaintDB.get(fetchNotificationByIdQuery, [req.params.id], (getErr, row) => {
      if (getErr) {
        return sendError(res, 500, 'Failed to fetch updated notification', getErr.message);
      }
      return sendSuccess(res, 200, 'Notification marked as read', row);
    });
  });
};

export const deleteNotification = (req, res) => {
  complaintDB.run(deleteNotificationByIdQuery, [req.params.id], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete notification', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Notification not found');
    }
    return sendSuccess(res, 200, 'Notification deleted successfully', { id: req.params.id });
  });
};
