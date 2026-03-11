// department.model model: defines SQLite schema and SQL queries for this module.
export const Department = `CREATE TABLE IF NOT EXISTS department (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER,
    name TEXT,
   description TEXT,
   accessment_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (organization_id) REFERENCES organization(organization_id),
   FOREIGN KEY (accessment_id) REFERENCES accessments(id)

)`;

export const insertDepartment = `INSERT INTO department (organization_id, name, description, accessment_id) VALUES (?, ?, ?, ?)`;
export const selectDepartments = `SELECT * FROM department`;
export const selectDepartmentsByOrganizationId = `SELECT * FROM department WHERE organization_id = ? ORDER BY id DESC`;
export const selectPublicDepartmentsByOrganizationId = `
SELECT id, organization_id, name, description
FROM department
WHERE organization_id = ?
ORDER BY name COLLATE NOCASE ASC, id ASC
`;

export const selectDepartmentById = `SELECT * FROM department WHERE id = ?`;

export const deleteDepartmentById = `DELETE FROM department WHERE id= ?`;

export const updateDepartmentById = `
UPDATE department
SET organization_id = ?, name = ?, description = ?, accessment_id = ?
WHERE id = ?;
`;
