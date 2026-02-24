// Create table
export const StatusLog = `
  CREATE TABLE IF NOT EXISTS status_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL,
    changed_by INTEGER NOT NULL,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;


// Insert status log
export const insertStatusLog = `
  INSERT INTO status_logs (
    complaint_id,
    changed_by,
    old_status,
    new_status
  )
  VALUES (?, ?, ?, ?)
`;


// Select all status logs
export const selectStatusLogs = `
  SELECT * FROM status_logs
`;


// Select logs by complaint ID
export const selectStatusLogsByComplaintId = `
  SELECT * FROM status_logs
  WHERE complaint_id = ?
  ORDER BY created_at DESC
`;


// Delete status log by ID
export const deleteStatusLogById = `
  DELETE FROM status_logs
  WHERE log_id = ?
`;


// Update status log by ID (
export const updateStatusLogById = `
  UPDATE status_logs
  SET old_status = ?,
      new_status = ?,
      changed_by = ?
  WHERE log_id = ?
`;