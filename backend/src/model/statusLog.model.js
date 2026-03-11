// statusLog.model model: defines SQLite schema and SQL queries for this module.
export const statusLogsQuery = `
CREATE TABLE IF NOT EXISTS status_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accessment_id INTEGER NOT NULL,
  organization_id INTEGER,
  changed_by INTEGER NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organization(organization_id),
  FOREIGN KEY (accessment_id) REFERENCES accessments(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
`;

export const createStatusLogQuery = `
INSERT INTO status_logs (accessment_id, organization_id, changed_by, old_status, new_status, notes)
VALUES (?, ?, ?, ?, ?, ?);
`;

export const fetchAllStatusLogsQuery = `
SELECT * FROM status_logs ORDER BY id DESC;
`;
export const fetchStatusLogsByOrganizationIdQuery = `
SELECT * FROM status_logs WHERE organization_id = ? ORDER BY id DESC;
`;

export const fetchStatusLogByIdQuery = `
SELECT * FROM status_logs WHERE id = ?;
`;

export const fetchStatusLogsByAccessmentIdQuery = `
SELECT * FROM status_logs WHERE accessment_id = ? ORDER BY created_at DESC;
`;

export const updateStatusLogQuery = `
UPDATE status_logs
SET old_status = ?, new_status = ?, notes = ?
WHERE id = ?;
`;

export const deleteStatusLogByIdQuery = `DELETE FROM status_logs WHERE id = ?;`;
export const deleteStatusLogsByAccessmentIdQuery = `DELETE FROM status_logs WHERE accessment_id = ?;`;
