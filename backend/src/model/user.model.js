// user.model model: defines SQLite schema and SQL queries for this module.
export const usersQuery = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER,
  department_id INTEGER,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 0 CHECK(must_change_password IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('super_admin', 'org_admin', 'user')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
export const fetchUsersQuery = `SELECT * FROM users ORDER BY id DESC;`;
export const fetchUsersByOrganizationQuery = `SELECT * FROM users WHERE organization_id = ? ORDER BY id DESC;`;
export const fetchUserByEmailQuery = `SELECT * FROM users WHERE email = ?;`;    
export const createUserQuery = `INSERT INTO users (organization_id, department_id, full_name, email, password, must_change_password, status, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;
export const fetchUserByIdQuery = `SELECT * FROM users WHERE id = ?;`;
export const updateUserQuery = `
UPDATE users
SET
  organization_id = ?,
  department_id = ?,
  full_name = ?,
  email = ?,
  password = ?,
  must_change_password = ?,
  status = ?,
  role = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;
export const updateUserStatusQuery = `UPDATE users SET status = ? WHERE id = ?;`;
export const updateUserRoleQuery = `UPDATE users SET role = ? WHERE id = ?;`;
export const assignUserToOrganizationQuery = `
UPDATE users
SET
  organization_id = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;
export const deleteUserQuery = `DELETE FROM users WHERE id = ?;`;

export const revokedTokensQuery = `
CREATE TABLE IF NOT EXISTS revoked_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const createRevokedTokenQuery = `
INSERT OR IGNORE INTO revoked_tokens (token) VALUES (?);
`;

export const fetchRevokedTokenQuery = `
SELECT id FROM revoked_tokens WHERE token = ?;
`;

export const updateOwnPasswordQuery = `
UPDATE users
SET
  password = ?,
  must_change_password = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;
