const express = require("express");
const router = express.Router();
const { getLogsByComplaintId } = require("../controllers/statusLogController");

// GET logs for a complaint
router.get("/complaints/:id/logs", getLogsByComplaintId);

module.exports = router;