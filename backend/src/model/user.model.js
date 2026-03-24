// user.model model: defines SQLite schema and SQL queries for this module.
// export const usersQuery = `
// CREATE TABLE IF NOT EXISTS users (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   organization_id INTEGER,
//   department_id INTEGER,
//   full_name TEXT NOT NULL,
//   email TEXT NOT NULL UNIQUE,
//   password TEXT NOT NULL,
//   emil_verified IN
//   must_change_password INTEGER NOT NULL DEFAULT 0 CHECK(must_change_password IN (0, 1)),
//   status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
//   role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('super_admin', 'org_admin', 'user')),
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
// );
// `;


export const usersQuery = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER,
  department_id INTEGER,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK(email_verified IN (0, 1)),
  email_verified_at DATETIME DEFAULT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 0 CHECK(must_change_password IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
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

export const updateOwnEmailQuery = `
UPDATE users
SET
  email = ?,
  email_verified = ?,
  email_verified_at = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;

export const emailVerificationTokensQuery = `
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

export const insertEmailVerificationTokenQuery = `
INSERT INTO email_verification_tokens (user_id, token, expires_at)
VALUES (?, ?, ?);
`;

export const selectActiveEmailVerificationTokenQuery = `
SELECT *
FROM email_verification_tokens
WHERE token = ? AND consumed = 0 AND expires_at >= ?
LIMIT 1;
`;

export const consumeEmailVerificationTokenQuery = `
UPDATE email_verification_tokens
SET consumed = 1
WHERE id = ?;
`;

export const invalidateEmailVerificationTokensByUserQuery = `
UPDATE email_verification_tokens
SET consumed = 1
WHERE user_id = ?;
`;

export const markUserEmailVerifiedQuery = `
UPDATE users
SET
  email_verified = 1,
  email_verified_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;
