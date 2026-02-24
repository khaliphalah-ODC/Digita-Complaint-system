export const Organization = `CREATE TABLE IF NOT EXISTS organization (
    organizationId INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    organizationType TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone numeric,
    address TEXT NOT NULL,
    logo TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

export const insertOrganization = `INSERT INTO organization (name, organizationType, email, phone, address, logo, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

export const selectOrganizations = `SELECT * FROM organization`;

export const selectOrganizationById = `SELECT * FROM organization WHERE organizationId = ?`;

export const deleteOrganizationById = `DELETE FROM organization WHERE organizationId= ?`;

export const updateOrganizationById = `UPDATE organization SET name = ?, organizationType = ?, email = ?, phone = ?, address = ?, logo = ?, status = ? WHERE organizationId = ?`;


