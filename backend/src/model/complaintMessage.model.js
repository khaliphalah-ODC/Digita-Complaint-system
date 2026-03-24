// complaintMessage.model model: defines SQLite schema and SQL queries for complaint chat.
export const complaintMessagesQuery = `
CREATE TABLE IF NOT EXISTS complaint_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  sender_user_id INTEGER NOT NULL,
  sender_role TEXT NOT NULL CHECK(sender_role IN ('admin', 'user')),
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaint(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

export const createComplaintMessageQuery = `
INSERT INTO complaint_messages (complaint_id, sender_user_id, sender_role, message)
VALUES (?, ?, ?, ?);
`;

export const fetchComplaintMessagesByComplaintIdQuery = `
SELECT
  cm.*,
  u.full_name AS sender_name,
  u.email AS sender_email
FROM complaint_messages cm
LEFT JOIN users u ON u.id = cm.sender_user_id
WHERE cm.complaint_id = ?
ORDER BY cm.id ASC;
`;

export const fetchComplaintMessageByIdQuery = `
SELECT
  cm.*,
  u.full_name AS sender_name,
  u.email AS sender_email
FROM complaint_messages cm
LEFT JOIN users u ON u.id = cm.sender_user_id
WHERE cm.id = ?;
`;

export const updateComplaintMessageByIdQuery = `
UPDATE complaint_messages
SET
  message = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND complaint_id = ? AND sender_user_id = ?;
`;

export const deleteComplaintMessageByIdQuery = `
DELETE FROM complaint_messages
WHERE id = ? AND complaint_id = ? AND sender_user_id = ?;
`;
