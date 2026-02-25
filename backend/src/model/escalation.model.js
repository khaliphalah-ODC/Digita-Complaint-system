export const VALID_ESCALATION_LEVELS = ['level_1', 'level_2', 'level_3'];
export const VALID_ESCALATION_STATUSES = ['pending', 'in_progress', 'resolved', 'rejected'];

export const escalationsQuery = `
CREATE TABLE IF NOT EXISTS escalations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accessment_id INTEGER NOT NULL,
  escalated_by INTEGER NOT NULL,
  assigned_to INTEGER,
  escalation_level TEXT NOT NULL DEFAULT 'level_1' CHECK(escalation_level IN ('level_1', 'level_2', 'level_3')),
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (accessment_id) REFERENCES accessments(id),
  FOREIGN KEY (escalated_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
`;

export const createEscalationQuery = `
INSERT INTO escalations (
  accessment_id,
  escalated_by,
  assigned_to,
  escalation_level,
  reason,
  notes,
  status
)
VALUES (?, ?, ?, ?, ?, ?, ?);
`;

export const fetchEscalationsQuery = `SELECT * FROM escalations ORDER BY id DESC;`;
export const fetchEscalationByIdQuery = `SELECT * FROM escalations WHERE id = ?;`;
export const fetchEscalationsByAccessmentIdQuery = `
SELECT * FROM escalations WHERE accessment_id = ? ORDER BY id DESC;
`;
export const fetchEscalationsByStatusQuery = `
SELECT * FROM escalations WHERE status = ? ORDER BY id DESC;
`;

export const updateEscalationQuery = `
UPDATE escalations
SET
  assigned_to = ?,
  escalation_level = ?,
  reason = ?,
  notes = ?,
  status = ?,
  resolved_at = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;

export const updateEscalationStatusQuery = `
UPDATE escalations
SET
  status = ?,
  resolved_at = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;

export const deleteEscalationQuery = `DELETE FROM escalations WHERE id = ?;`;
