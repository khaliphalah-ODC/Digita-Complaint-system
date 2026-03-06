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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
)`;

export const insertOrganization = `INSERT INTO organization (name, organization_type, email, phone, address, logo, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
export const selectOrganizations = `SELECT * FROM organization`;

export const selectOrganizationById = `SELECT * FROM organization WHERE organization_id = ?`;

export const deleteOrganizationById = `DELETE FROM organization WHERE organization_id= ?`;

export const updateOrganizationById = `UPDATE organization SET name = ?, organization_type = ?, email = ?, phone = ?, address = ?, logo = ?, status = ? WHERE organization_id = ?`;


