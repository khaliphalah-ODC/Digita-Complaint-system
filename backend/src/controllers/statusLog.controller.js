const StatusLog = require("../models/statusLog.model.js");

// Get logs for one complaint
const getLogsByComplaintId = (req, res) => {
  const complaintId = req.params.id;

  StatusLog.getLogsByComplaintId(complaintId, (err, logs) => {
    if (err) {
      return res.status(500).json({ error: "Failed to retrieve logs" });
    }

    if (logs.length === 0) {
      return res.status(404).json({ message: "No logs found for this complaint" });
    }

    res.status(200).json(logs);
  });
};

const getFilteredLogs = (req, res) => {
  const filters = {
    complaint_id: req.query.complaint_id,
    start_date: req.query.start_date,
    end_date: req.query.end_date,
  };

  StatusLog.getFilteredLogs(filters, (err, logs) => {
    if (err) {
      return res.status(500).json({ error: "Failed to retrieve logs" });
    }

    res.status(200).json(logs);
  });
};

module.exports = {
  getLogsByComplaintId,
};