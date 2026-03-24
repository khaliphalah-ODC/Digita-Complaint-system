// organization.model model: defines SQLite schema and SQL queries for this module.
export const Organization = `CREATE TABLE IF NOT EXISTS organization (
    organization_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    organization_type TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone numeric,
    address TEXT NOT NULL,
    logo TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    join_code TEXT UNIQUE,
    self_signup_enabled INTEGER NOT NULL DEFAULT 1 CHECK(self_signup_enabled IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

export const insertOrganization = `
INSERT INTO organization (
  name,
  organization_type,
  email,
  phone,
  address,
  logo,
  status,
  join_code,
  self_signup_enabled
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const selectOrganizations = `
SELECT
  o.*,
  COUNT(c.id) AS complaints_count
FROM organization o
LEFT JOIN users u ON u.organization_id = o.organization_id
LEFT JOIN complaint c ON c.user_id = u.id
GROUP BY o.organization_id
ORDER BY o.organization_id DESC
`;

export const selectOrganizationById = `
SELECT
  o.*,
  COUNT(c.id) AS complaints_count
FROM organization o
LEFT JOIN users u ON u.organization_id = o.organization_id
LEFT JOIN complaint c ON c.user_id = u.id
WHERE o.organization_id = ?
GROUP BY o.organization_id
`;

export const selectOrganizationByJoinCode = `
SELECT *
FROM organization
WHERE join_code = ? AND status = 'active'
LIMIT 1
`;

export const selectAnyOrganizationByJoinCode = `
SELECT *
FROM organization
WHERE join_code = ?
LIMIT 1
`;

export const deleteOrganizationById = `DELETE FROM organization WHERE organization_id= ?`;

export const updateOrganizationById = `
UPDATE organization
SET
  name = ?,
  organization_type = ?,
  email = ?,
  phone = ?,
  address = ?,
  logo = ?,
  status = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE organization_id = ?
`;

export const updateOrganizationJoinCodeById = `
UPDATE organization
SET
  join_code = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE organization_id = ?
`;

export const updateOrganizationStatusById = `
UPDATE organization
SET
  status = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE organization_id = ?
`;

export const updateOrganizationSelfSignupById = `
UPDATE organization
SET
  self_signup_enabled = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE organization_id = ?
`;
