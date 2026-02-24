import express from "express";
import {
  createStatusLog,
  getAllStatusLogs,
  getStatusLogsByComplaintId,
  deleteStatusLog
} from "../controllers/statusLog.controller.js";

const StatusLogRouter = express.Router();

// Create a new status log
StatusLogRouter.post("/status-log", createStatusLog);

// Get all status logs
StatusLogRouter.get("/status-log", getAllStatusLogs);

// Get logs by complaint ID
StatusLogRouter.get("/status-log/:id", getStatusLogsByComplaintId);

// Delete a status log by ID
StatusLogRouter.delete("/status-log/:id", deleteStatusLog);

export default StatusLogRouter;