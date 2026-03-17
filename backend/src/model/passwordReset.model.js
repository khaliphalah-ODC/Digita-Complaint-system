// passwordReset.model: schema and queries for password reset tokens.
export const passwordResetTokensQuery = `
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

export const insertPasswordResetTokenQuery = `
INSERT INTO password_reset_tokens (user_id, token, expires_at)
VALUES (?, ?, ?);
`;

export const selectActivePasswordResetTokenQuery = `
SELECT *
FROM password_reset_tokens
WHERE token = ? AND consumed = 0 AND expires_at >= ?
LIMIT 1;
`;

export const consumePasswordResetTokenQuery = `
UPDATE password_reset_tokens
SET consumed = 1
WHERE id = ?;
`;

export const invalidatePasswordResetTokensByUserQuery = `
UPDATE password_reset_tokens
SET consumed = 1
WHERE user_id = ?;
`;
