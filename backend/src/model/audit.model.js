export const AuditLogTable = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id INTEGER,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const insertAuditLogQuery = `
INSERT INTO audit_logs (actor_id, actor_role, action, target_table, target_id, metadata)
VALUES (?, ?, ?, ?, ?, ?);
`;

export const selectAuditLogsQuery = `
SELECT
  id,
  actor_id,
  actor_role,
  action,
  target_table,
  target_id,
  metadata,
  created_at
FROM audit_logs
ORDER BY id DESC
LIMIT ? OFFSET ?;
`;

export const countAuditLogsQuery = `
SELECT COUNT(*) AS count
FROM audit_logs;
`;
