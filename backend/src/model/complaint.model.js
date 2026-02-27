export const Complaint = `CREATE TABLE IF NOT EXISTS complaint (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
)`;

export const insertComplaint = `INSERT INTO complaint (complaint) VALUES (?)`;

export const selectComplaint = `SELECT * FROM complaint`;

export const selectComplaintById = `SELECT * FROM complaint WHERE id = ?`;

export const deleteComplaintById = `DELETE FROM complaint WHERE id= ?`;

export const updateComplaintById = `UPDATE complaint SET complaint = ? WHERE id = ?`;


