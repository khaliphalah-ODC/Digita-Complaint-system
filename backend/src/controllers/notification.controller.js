// notification.controller controller: handles HTTP request/response flow for this module.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  notificationsQuery,
  createNotificationQuery,
  fetchNotificationByIdQuery,
  fetchNotificationsByOrganizationIdQuery,
  fetchNotificationsByUserIdQuery,
  markNotificationAsReadQuery,
  deleteNotificationByIdQuery
} from '../model/notification.model.js';
import { fetchUserByIdQuery } from '../model/user.model.js';
import { selectComplaintById } from '../model/complaint.model.js';
import { denySuperAdminInternalAccess } from '../utils/tenantScope.js';

export const CreateNotificationsTable = () => {
  complaintDB.run(notificationsQuery, (err) => {
    if (err) {
      console.error('Error creating notifications table:', err.message);
    } else {
      complaintDB.all('PRAGMA table_info(notifications)', [], async (schemaErr, columns) => {
        if (schemaErr) {
          console.error('Error inspecting notifications table:', schemaErr.message);
          return;
        }

        const existing = new Set((columns || []).map((col) => col.name));
        try {
          if (!existing.has('organization_id')) {
            await new Promise((resolve, reject) => {
              complaintDB.run('ALTER TABLE notifications ADD COLUMN organization_id INTEGER', (alterErr) => {
                if (alterErr) return reject(alterErr);
                return resolve();
              });
            });
          }

          const tableExists = (tableName) =>
            new Promise((resolve, reject) => {
              complaintDB.get(
                `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
                [tableName],
                (tableErr, row) => {
                  if (tableErr) return reject(tableErr);
                  return resolve(Boolean(row));
                }
              );
            });

          const [hasComplaintTable, hasUsersTable] = await Promise.all([
            tableExists('complaint'),
            tableExists('users')
          ]);

          const organizationSources = [];
          if (hasComplaintTable) {
            organizationSources.push(`
              (
                SELECT c.organization_id
                FROM complaint c
                WHERE c.id = notifications.complaint_id
              )
            `);
          }
          if (hasUsersTable) {
            organizationSources.push(`
              (
                SELECT u.organization_id
                FROM users u
                WHERE u.id = notifications.user_id
              )
            `);
          }

          if (organizationSources.length > 0) {
            await new Promise((resolve, reject) => {
              complaintDB.run(
                `
                UPDATE notifications
                SET organization_id = COALESCE(${organizationSources.join(',')})
                WHERE organization_id IS NULL
                `,
                (updateErr) => {
                  if (updateErr) return reject(updateErr);
                  return resolve();
                }
              );
            });
          }

          await new Promise((resolve, reject) => {
            complaintDB.run('CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id)', (indexErr) => {
              if (indexErr) return reject(indexErr);
              return resolve();
            });
          });
          console.log('Notifications table created or already exists');
        } catch (migrationErr) {
          console.error('Error migrating notifications table:', migrationErr.message);
        }
      });
    }
  });
};

export const createNotification = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage notifications directly')) {
    return;
  }
  if (req.user?.role !== 'org_admin') {
    return sendError(res, 403, 'Only org_admin can create notifications');
  }

  const { user_id = null, complaint_id = null, type, message, is_read = 0 } = req.body;

  if (!type || !message) {
    return sendError(res, 400, 'type and message are required');
  }

  const finalizeCreate = (organizationId) => {
    complaintDB.run(
      createNotificationQuery,
      [organizationId, user_id, complaint_id, type, message, is_read ? 1 : 0],
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

  if (complaint_id) {
    complaintDB.get(selectComplaintById, [complaint_id], (complaintErr, complaintRow) => {
      if (complaintErr) {
        return sendError(res, 500, 'Failed to validate complaint', complaintErr.message);
      }
      if (!complaintRow) {
        return sendError(res, 404, 'Complaint not found');
      }
      if (String(complaintRow.complaint_organization_id) !== String(req.user.organization_id)) {
        return sendError(res, 403, 'Access denied');
      }
      return finalizeCreate(complaintRow.complaint_organization_id);
    });
    return;
  }

  if (user_id) {
    complaintDB.get(fetchUserByIdQuery, [user_id], (userErr, userRow) => {
      if (userErr) {
        return sendError(res, 500, 'Failed to validate user', userErr.message);
      }
      if (!userRow) {
        return sendError(res, 404, 'User not found');
      }
      if (String(userRow.organization_id) !== String(req.user.organization_id)) {
        return sendError(res, 403, 'Access denied');
      }
      return finalizeCreate(userRow.organization_id);
    });
    return;
  }

  return finalizeCreate(req.user.organization_id);
};

export const getAllNotifications = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access notifications directly')) {
    return;
  }

  const query = req.user?.role === 'org_admin' ? fetchNotificationsByOrganizationIdQuery : fetchNotificationsByUserIdQuery;
  const params = req.user?.role === 'org_admin' ? [req.user.organization_id] : [req.user.id];

  complaintDB.all(query, params, (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch notifications', err.message);
    }
    return sendSuccess(res, 200, 'Notifications retrieved successfully', rows);
  });
};

export const getNotificationById = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access notifications directly')) {
    return;
  }

  complaintDB.get(fetchNotificationByIdQuery, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch notification', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Notification not found');
    }
    if (req.user?.role === 'org_admin' && String(row.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }
    if (req.user?.role === 'user' && Number(row.user_id) !== Number(req.user.id)) {
      return sendError(res, 403, 'Access denied');
    }
    return sendSuccess(res, 200, 'Notification retrieved successfully', row);
  });
};

export const markNotificationAsRead = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access notifications directly')) {
    return;
  }

  complaintDB.get(fetchNotificationByIdQuery, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch notification', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Notification not found');
    }
    if (req.user?.role === 'org_admin' && String(existing.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }
    if (req.user?.role === 'user' && Number(existing.user_id) !== Number(req.user.id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(markNotificationAsReadQuery, [req.params.id], function onUpdate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to update notification', err.message);
      }

      complaintDB.get(fetchNotificationByIdQuery, [req.params.id], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch updated notification', getErr.message);
        }
        return sendSuccess(res, 200, 'Notification marked as read', row);
      });
    });
  });
};

export const deleteNotification = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage notifications directly')) {
    return;
  }

  complaintDB.get(fetchNotificationByIdQuery, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch notification', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Notification not found');
    }
    if (req.user?.role === 'org_admin' && String(existing.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }
    if (req.user?.role === 'user') {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(deleteNotificationByIdQuery, [req.params.id], function onDelete(err) {
      if (err) {
        return sendError(res, 500, 'Failed to delete notification', err.message);
      }
      return sendSuccess(res, 200, 'Notification deleted successfully', { id: req.params.id });
    });
  });
};
