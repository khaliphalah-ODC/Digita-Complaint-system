
import {
  insertStatusLog,
  selectStatusLogsByComplaintId,
  selectStatusLogs,
  deleteStatusLogById
} from "../model/statusLog.model.js";


// Add new status log
export const createStatusLog = (req, res) => {
  const { complaint_id, changed_by, old_status, new_status } = req.body;

  complainDB.run(
    insertStatusLog,
    [complaint_id, changed_by, old_status, new_status],
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
