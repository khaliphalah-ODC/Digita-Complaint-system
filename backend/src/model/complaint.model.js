// complaint.model model: defines SQLite schema and SQL queries for this module.
export const VALID_COMPLAINT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const VALID_COMPLAINT_STATUSES = ['submitted', 'in_review', 'resolved', 'closed'];

export const Complaint = `
CREATE TABLE IF NOT EXISTS complaint (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  organization_id INTEGER,
  department_id INTEGER,
  is_anonymous INTEGER NOT NULL DEFAULT 0 CHECK(is_anonymous IN (0, 1)),
  anonymous_label TEXT,
  title TEXT NOT NULL,
  complaint TEXT NOT NULL,
  category TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'in_review', 'resolved', 'closed')),
  tracking_code TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organization(organization_id),
  FOREIGN KEY (department_id) REFERENCES department(id)

);
`;


export const insertComplaint = `
INSERT INTO complaint (
  user_id,
  organization_id,
  department_id,
  is_anonymous,
  anonymous_label,
  title,
  complaint,
  category,
  priority,
  status,
  tracking_code
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

export const selectComplaint = `
SELECT
  c.*,
  c.complaint AS description,
  u.full_name AS user_full_name,
  u.email AS user_email,
  c.organization_id AS complaint_organization_id,
  c.department_id AS complaint_department_id,
  COALESCE(o.name, anonymous_org.name) AS organization_name,
  d.name AS department_name,
  o.organization_type AS organization_type,
  o.email AS organization_email,
  o.phone AS organization_phone,
  o.address AS organization_address,
  reviewer.full_name AS reviewer_name
FROM complaint c
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN organization o ON o.organization_id = u.organization_id
LEFT JOIN organization anonymous_org ON anonymous_org.organization_id = c.organization_id
LEFT JOIN department d ON d.id = c.department_id
LEFT JOIN users reviewer ON reviewer.id = c.reviewed_by
ORDER BY c.id DESC;
`;

export const selectComplaintById = `
SELECT
  c.*,
  c.complaint AS description,
  u.full_name AS user_full_name,
  u.email AS user_email,
  c.organization_id AS complaint_organization_id,
  c.department_id AS complaint_department_id,
  COALESCE(o.name, anonymous_org.name) AS organization_name,
  d.name AS department_name,
  o.organization_type AS organization_type,
  o.email AS organization_email,
  o.phone AS organization_phone,
  o.address AS organization_address,
  reviewer.full_name AS reviewer_name
FROM complaint c
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN organization o ON o.organization_id = u.organization_id
LEFT JOIN organization anonymous_org ON anonymous_org.organization_id = c.organization_id
LEFT JOIN department d ON d.id = c.department_id
LEFT JOIN users reviewer ON reviewer.id = c.reviewed_by
WHERE c.id = ?;
`;

export const selectComplaintByUserId = `
SELECT
  c.*,
  c.complaint AS description,
  u.full_name AS user_full_name,
  u.email AS user_email,
  c.organization_id AS complaint_organization_id,
  c.department_id AS complaint_department_id,
  COALESCE(o.name, anonymous_org.name) AS organization_name,
  d.name AS department_name,
  o.organization_type AS organization_type,
  o.email AS organization_email,
  o.phone AS organization_phone,
  o.address AS organization_address,
  reviewer.full_name AS reviewer_name
FROM complaint c
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN organization o ON o.organization_id = u.organization_id
LEFT JOIN organization anonymous_org ON anonymous_org.organization_id = c.organization_id
LEFT JOIN department d ON d.id = c.department_id
LEFT JOIN users reviewer ON reviewer.id = c.reviewed_by
WHERE c.user_id = ?
ORDER BY c.id DESC;
`;

export const selectComplaintByOrganizationId = `
SELECT
  c.*,
  c.complaint AS description,
  u.full_name AS user_full_name,
  u.email AS user_email,
  c.organization_id AS complaint_organization_id,
  c.department_id AS complaint_department_id,
  COALESCE(o.name, anonymous_org.name) AS organization_name,
  d.name AS department_name,
  o.organization_type AS organization_type,
  o.email AS organization_email,
  o.phone AS organization_phone,
  o.address AS organization_address,
  reviewer.full_name AS reviewer_name
FROM complaint c
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN organization o ON o.organization_id = u.organization_id
LEFT JOIN organization anonymous_org ON anonymous_org.organization_id = c.organization_id
LEFT JOIN department d ON d.id = c.department_id
LEFT JOIN users reviewer ON reviewer.id = c.reviewed_by
WHERE c.organization_id = ?
ORDER BY c.id DESC;
`;

export const selectComplaintByTrackingCode = `
SELECT
  c.*,
  c.complaint AS description,
  u.full_name AS user_full_name,
  u.email AS user_email,
  c.organization_id AS complaint_organization_id,
  c.department_id AS complaint_department_id,
  COALESCE(o.name, anonymous_org.name) AS organization_name,
  d.name AS department_name,
  o.organization_type AS organization_type,
  o.email AS organization_email,
  o.phone AS organization_phone,
  o.address AS organization_address,
  reviewer.full_name AS reviewer_name
FROM complaint c
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN organization o ON o.organization_id = u.organization_id
LEFT JOIN organization anonymous_org ON anonymous_org.organization_id = c.organization_id
LEFT JOIN department d ON d.id = c.department_id
LEFT JOIN users reviewer ON reviewer.id = c.reviewed_by
WHERE c.tracking_code = ?;
`;

export const selectUnassignedAnonymousComplaints = `
SELECT
  c.*,
  c.complaint AS description,
  u.full_name AS user_full_name,
  u.email AS user_email,
  c.organization_id AS complaint_organization_id,
  c.department_id AS complaint_department_id,
  COALESCE(o.name, anonymous_org.name) AS organization_name,
  d.name AS department_name,
  o.organization_type AS organization_type,
  o.email AS organization_email,
  o.phone AS organization_phone,
  o.address AS organization_address,
  reviewer.full_name AS reviewer_name
FROM complaint c
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN organization o ON o.organization_id = u.organization_id
LEFT JOIN organization anonymous_org ON anonymous_org.organization_id = c.organization_id
LEFT JOIN department d ON d.id = c.department_id
LEFT JOIN users reviewer ON reviewer.id = c.reviewed_by
WHERE c.is_anonymous = 1 AND c.organization_id IS NULL
ORDER BY c.id DESC;
`;

export const updateComplaintById = `
UPDATE complaint
SET
  department_id = ?,
  is_anonymous = ?,
  anonymous_label = ?,
  title = ?,
  complaint = ?,
  category = ?,
  priority = ?,
  status = ?,
  admin_response = ?,
  reviewed_by = ?,
  reviewed_at = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;

export const assignComplaintOrganizationById = `
UPDATE complaint
SET
  organization_id = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;

export const deleteComplaintById = `DELETE FROM complaint WHERE id = ?;`;
