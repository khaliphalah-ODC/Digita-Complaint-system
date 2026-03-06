// complaint.route routes: maps API endpoints to controller handlers.
import express from 'express';
import {
  createComplaint,
  deleteComplaint,
  getAllComplaints,
  getComplaintById,
  getComplaintByTrackingCode,
  updateComplaint
} from '../controllers/complaint.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', optionalAuthenticateToken, createComplaint);
router.get('/track/:trackingCode', getComplaintByTrackingCode);
router.get('/', authenticateToken, getAllComplaints);
router.get('/:id', authenticateToken, getComplaintById);
router.put('/:id', authenticateToken, updateComplaint);
router.delete('/:id', authenticateToken, deleteComplaint);

export default router;
