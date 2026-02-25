export const accessmentQuery = `
CREATE TABLE IF NOT EXISTS accessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  is_anonymous INTEGER NOT NULL DEFAULT 0 CHECK(is_anonymous IN (0, 1)),
  title TEXT NOT NULL,
  accessment_type TEXT NOT NULL CHECK(accessment_type IN ('type1', 'type2', 'type3')),
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high')),
  tracking_code TEXT NOT NULL UNIQUE,
  admin_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

export const VALID_ACCESSMENT_TYPES = ['type1', 'type2', 'type3'];
export const VALID_ACCESSMENT_PRIORITIES = ['low', 'medium', 'high'];
export const fetchAccessmentsQuery = `SELECT * FROM accessments ORDER BY id DESC;`;
export const createAccessmentQuery = `INSERT INTO accessments (user_id, is_anonymous, title, accessment_type, priority, tracking_code) VALUES (?, ?, ?, ?, ?, ?);`;
export const fetchAccessmentByIdQuery = `SELECT * FROM accessments WHERE id = ?;`;
export const fetchAccessmentsByUserIdQuery = `SELECT * FROM accessments WHERE user_id = ?;`;
export const updateAccessmentAdminResponseQuery = `
UPDATE accessments
SET admin_response = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;
export const deleteAccessmentQuery = `DELETE FROM accessments WHERE id = ?;`;
