// complaint.model model: defines SQLite schema and SQL queries for this module.
export const VALID_COMPLAINT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const VALID_COMPLAINT_STATUSES = ['submitted', 'in_review', 'resolved', 'closed'];

export const Complaint = `
CREATE TABLE IF NOT EXISTS complaint (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  is_anonymous INTEGER NOT NULL DEFAULT 0 CHECK(is_anonymous IN (0, 1)),
  anonymous_label TEXT,
  title TEXT NOT NULL,
  complaint TEXT NOT NULL,
  category TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'in_review', 'resolved', 'closed')),
  tracking_code TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)

);
`;




export const insertComplaint = `
INSERT INTO complaint (
  user_id,
  is_anonymous,
  anonymous_label,
  title,
  complaint,
  category,
  priority,
  status,
  tracking_code
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

export const selectComplaint = `SELECT * FROM complaint ORDER BY id DESC;`;
export const selectComplaintById = `SELECT * FROM complaint WHERE id = ?;`;
export const selectComplaintByUserId = `SELECT * FROM complaint WHERE user_id = ? ORDER BY id DESC;`;

export const updateComplaintById = `
UPDATE complaint
SET
  is_anonymous = ?,
  anonymous_label = ?,
  title = ?,
  complaint = ?,
  category = ?,
  priority = ?,
  status = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;

export const deleteComplaintById = `DELETE FROM complaint WHERE id = ?;`;
