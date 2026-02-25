export const usersQuery = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
export const fetchUsersQuery = `SELECT * FROM users ORDER BY id DESC;`;
export const fetchUserByEmailQuery = `SELECT * FROM users WHERE email = ?;`;    
export const createUserQuery = `INSERT INTO users (organization_id, full_name, email, password, status, role) VALUES (?, ?, ?, ?, ?, ?);`;
export const fetchUserByIdQuery = `SELECT * FROM users WHERE id = ?;`;
export const updateUserQuery = `
UPDATE users
SET
  organization_id = ?,
  full_name = ?,
  email = ?,
  password = ?,
  status = ?,
  role = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;
export const updateUserStatusQuery = `UPDATE users SET status = ? WHERE id = ?;`;
export const updateUserRoleQuery = `UPDATE users SET role = ? WHERE id = ?;`;
export const deleteUserQuery = `DELETE FROM users WHERE id = ?;`;
