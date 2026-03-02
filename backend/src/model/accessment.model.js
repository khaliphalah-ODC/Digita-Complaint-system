// accessment.model model: defines SQLite schema and SQL queries for this module.
export const VALID_ACCESSMENT_STATUSES = ['pending', 'in_review', 'completed', 'rejected'];

export const accessmentQuery = `
CREATE TABLE IF NOT EXISTS accessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  assessor_id INTEGER NOT NULL,
  findings TEXT NOT NULL,
  recommendation TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_review', 'completed', 'rejected')),
  admin_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaint(id) ON DELETE CASCADE,
  FOREIGN KEY (assessor_id) REFERENCES users(id)
);
`;







export const createAccessmentQuery = `
INSERT INTO accessments (
  complaint_id,
  assessor_id,
  findings,
  recommendation,
  status,
  admin_response
)
VALUES (?, ?, ?, ?, ?, ?);
`;

export const fetchAccessmentsQuery = `
SELECT
  a.*,
  c.title AS complaint_title,
  c.user_id AS complaint_user_id,
  c.status AS complaint_status
FROM accessments a
LEFT JOIN complaint c ON c.id = a.complaint_id
ORDER BY a.id DESC;
`;

export const fetchAccessmentByIdQuery = `
SELECT
  a.*,
  c.title AS complaint_title,
  c.user_id AS complaint_user_id,
  c.status AS complaint_status
FROM accessments a
LEFT JOIN complaint c ON c.id = a.complaint_id
WHERE a.id = ?;
`;

export const fetchAccessmentsByComplaintIdQuery = `
SELECT
  a.*,
  c.title AS complaint_title,
  c.user_id AS complaint_user_id,
  c.status AS complaint_status
FROM accessments a
LEFT JOIN complaint c ON c.id = a.complaint_id
WHERE a.complaint_id = ?
ORDER BY a.id DESC;
`;

export const fetchAccessmentsByAssessorIdQuery = `
SELECT
  a.*,
  c.title AS complaint_title,
  c.user_id AS complaint_user_id,
  c.status AS complaint_status
FROM accessments a
LEFT JOIN complaint c ON c.id = a.complaint_id
WHERE a.assessor_id = ?
ORDER BY a.id DESC;
`;

export const updateAccessmentQuery = `
UPDATE accessments
SET
  findings = ?,
  recommendation = ?,
  status = ?,
  admin_response = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;

export const updateAccessmentAdminResponseQuery = `
UPDATE accessments
SET admin_response = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;

export const deleteAccessmentQuery = `DELETE FROM accessments WHERE id = ?;`;
