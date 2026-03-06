// notification.model model: defines SQLite schema and SQL queries for this module.
export const notificationsQuery = `
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  complaint_id INTEGER,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (complaint_id) REFERENCES complaint(id)
);
`;

export const createNotificationQuery = `
INSERT INTO notifications (user_id, complaint_id, type, message, is_read)
VALUES (?, ?, ?, ?, ?);
`;
export const fetchNotificationsQuery = `SELECT * FROM notifications ORDER BY id DESC;`;
export const fetchNotificationByIdQuery = `SELECT * FROM notifications WHERE id = ?;`;
export const fetchNotificationsByComplaintIdQuery = `
SELECT * FROM notifications WHERE complaint_id = ? ORDER BY id DESC;
`;
export const markNotificationAsReadQuery = `
UPDATE notifications
SET is_read = 1
WHERE id = ?;
`;
export const deleteNotificationByIdQuery = `DELETE FROM notifications WHERE id = ?;`;
