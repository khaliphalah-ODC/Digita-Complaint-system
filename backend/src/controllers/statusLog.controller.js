import {
  insertStatusLog,
  selectStatusLogsByComplaintId,
  selectStatusLogs,
  deleteStatusLogById
} from "../model/statusLog.model.js";

// Add new status log
export const createStatusLog = (req, res) => {
  const { complaint_id, changed_by, old_status, new_status, change_at } = req.body;

  complainDB.run(
    insertStatusLog,
    [complaint_id, changed_by, old_status, new_status, change_at],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: "Status log created successfully",
        log_id: this.lastID
      });
    }
  );
};


// Get all logs
export const getAllStatusLogs = (req, res) => {
  complainDB.all(selectStatusLogs, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json(rows);
  });
};


// Get logs by complaint ID
export const getStatusLogsByComplaintId = (req, res) => {
  const { id } = req.params;

  complainDB.all(selectStatusLogsByComplaintId, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json(rows);
  });
};

// Update log by Complaint ID 
export const updateStatusLog = (req, res) => {
  res.status(501).json({ message: "Update status log not implemented yet" });
} ;

// Delete log by ID
export const deleteStatusLog = (req, res) => {
  const { id } = req.params;

  complainDB.run(deleteStatusLogById, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json({
      message: "Status log deleted successfully"
    });
  });
};
