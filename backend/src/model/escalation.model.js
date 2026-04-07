// escalation.model model: defines SQLite schema and SQL queries for this module.
export const VALID_ESCALATION_LEVELS = ['level_1', 'level_2', 'level_3'];
export const VALID_ESCALATION_STATUSES = ['pending', 'in_progress', 'resolved', 'rejected'];

export const escalationsQuery = `
CREATE TABLE IF NOT EXISTS escalations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accessment_id INTEGER NOT NULL,
  organization_id INTEGER,
  escalated_by INTEGER NOT NULL,
  assigned_to INTEGER,
  escalation_level TEXT NOT NULL DEFAULT 'level_1' CHECK(escalation_level IN ('level_1', 'level_2', 'level_3')),
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organization(organization_id),
  FOREIGN KEY (accessment_id) REFERENCES accessments(id),
  FOREIGN KEY (escalated_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
`;

export const createEscalationQuery = `
INSERT INTO escalations (
  accessment_id,
  organization_id,
  escalated_by,
  assigned_to,
  escalation_level,
  reason,
  notes,
  status
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);
`;

export const fetchEscalationsQuery = `SELECT * FROM escalations ORDER BY id DESC;`;
export const fetchEscalationsBaseQuery = `
SELECT
  e.*,
  a.complaint_id,
  c.title AS complaint_title
FROM escalations e
LEFT JOIN accessments a ON a.id = e.accessment_id
LEFT JOIN complaint c ON c.id = a.complaint_id
`;

export const fetchEscalationByIdQuery = `
${fetchEscalationsBaseQuery}
WHERE e.id = ?;
`;
export const fetchEscalationsByOrganizationIdQuery = `
${fetchEscalationsBaseQuery}
WHERE e.organization_id = ? ORDER BY e.id DESC;
`;
export const fetchEscalationsByAccessmentIdQuery = `
${fetchEscalationsBaseQuery}
WHERE e.accessment_id = ? ORDER BY e.id DESC;
`;
export const fetchEscalationsByStatusQuery = `
${fetchEscalationsBaseQuery}
WHERE e.status = ? ORDER BY e.id DESC;
`;
export const fetchEscalationsByOrganizationAndStatusQuery = `
${fetchEscalationsBaseQuery}
WHERE e.organization_id = ? AND e.status = ? ORDER BY e.id DESC;
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
