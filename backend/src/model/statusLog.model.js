
// Create Status Logs table
const createStatusLogTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(query, (err) => {
    if (err) {
      console.error("Error creating status_logs table:", err.message);
    } else {
      console.log("status_logs table ready.");
    }
  });
};

// Insert new status log
const addStatusLog = (complaint_id, old_status, new_status, changed_by, callback) => {
  const query = `
    INSERT INTO status_logs (complaint_id, old_status, new_status, changed_by)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [complaint_id, old_status, new_status, changed_by], function (err) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, { id: this.lastID });
    }
  });
};

// Get logs for a specific complaint
const getLogsByComplaintId = (complaint_id, callback) => {
  const query = `
    SELECT * FROM status_logs
    WHERE complaint_id = ?
    ORDER BY created_at ASC

  `;

  db.all(query, [complaint_id], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
};

const getFilteredLogs = (filters, callback) => {
  let query = `SELECT * FROM status_logs WHERE 1=1`;
  let params = [];

  if (filters.complaint_id) {
    query += ` AND complaint_id = ?`;
    params.push(filters.complaint_id);
  }
  
 if (filters.start_date) {
    query += ` AND created_at >= ?`;
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    query += ` AND created_at <= ?`;
    params.push(filters.end_date);
  }

  query += ` ORDER BY created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
};

module.exports = {
  createStatusLogTable,
  addStatusLog,
  getLogsByComplaintId,
  getFilteredLogs,
};