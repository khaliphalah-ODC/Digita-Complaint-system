export const notification = `CREATE TABLE IF NOT EXISTS NOTIFICATION (
    id INTERGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    complaint_id INTEGER,
    type TEXT,
    message TEXT,
    is_read TEXT,
    creat_at TEXT DEFAULT CURRENT_TIMESTAMP
)`;


export const createNotificationTable = `INSERT INTO notification (user_id, complaint_id, type, message, is_real, creat_at)VALUES (?, ?, ?, ?, ?, ?)`  
export const userNotice = `SELECT * FROM notification ORDER BY id DESC`;
export const complaintByID = `SELECT * FROM complaints WHERE id = ?`;
export const deletenotification = `DELETE * FROM notification WHERE id = ?`;

// export const updatenotification = `UPDATE * FROM notification WHERE complaint_id = ?`;



