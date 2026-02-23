export const Department = `CREATE TABLE IF NOT EXISTS department (
    departmentId INTEGER PRIMARY KEY AUTOINCREMENT,
    organizationId INTEGER,
    name TEXT,
   description TEXT,
   accessmentId INTEGER,
   FOREIGN KEY (organizationId) REFERENCES organization(organizationId),
   FOREIGN KEY (accessmentId) REFERENCES accessment(accessmentId),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

export const insertDepartment = `INSERT INTO department (organizationId, name, description, accessmentId) VALUES (?, ?, ?, ?, ?)`;

export const selectDepartments = `SELECT * FROM department`;

export const selectDepartmentById = `SELECT * FROM department WHERE departmentId = ?`;

export const deleteDepartmentById = `DELETE FROM department WHERE departmentId= ?`;

export const updateDepartmentById = `UPDATE department SET organizationId = ?, name = ?, description = ?, accessmentId = ?, departmentId = ? WHERE departmentId = ?`;


