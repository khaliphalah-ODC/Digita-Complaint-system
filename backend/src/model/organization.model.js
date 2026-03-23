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
    join_code_expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

export const insertOrganization = `INSERT INTO organization (name, organization_type, email, phone, address, logo, status, join_code, join_code_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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
SELECT * FROM organization WHERE join_code = ?
`;

export const deleteOrganizationById = `DELETE FROM organization WHERE organization_id = ?`;

export const updateOrganizationById = `UPDATE organization SET name = ?, organization_type = ?, email = ?, phone = ?, address = ?, logo = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE organization_id = ?`;

export const updateOrganizationJoinCode = `UPDATE organization SET join_code = ?, join_code_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE organization_id = ?`;

// Fetch all pending users for a specific organization
export const selectPendingUsersByOrganization = `
SELECT id, full_name, email, role, status, created_at
FROM users
WHERE organization_id = ? AND status = 'pending'
ORDER BY created_at DESC
`;

// Approve a pending user
export const approvePendingUser = `
UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ?
`;

// Reject and remove a pending user
export const rejectPendingUser = `
DELETE FROM users WHERE id = ? AND organization_id = ? AND status = 'pending'
`;