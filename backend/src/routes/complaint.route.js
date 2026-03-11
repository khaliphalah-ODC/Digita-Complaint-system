// complaint.route routes: maps API endpoints to controller handlers.
import express from 'express';
import {
  assignComplaintOrganization,
  createComplaint,
  deleteComplaint,
  getAllComplaints,
  getComplaintById,
  getComplaintByTrackingCode,
  getUnassignedAnonymousComplaints,
  updateComplaint
} from '../controllers/complaint.controller.js';
import { optionalAuthenticateToken } from '../middleware/auth.middleware.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/', optionalAuthenticateToken, createComplaint);
router.get('/track/:trackingCode', getComplaintByTrackingCode);
router.get('/unassigned', verifyToken, getUnassignedAnonymousComplaints);
router.get('/', verifyToken, getAllComplaints);
router.patch('/:id/assign-organization', verifyToken, assignComplaintOrganization);
router.get('/:id', verifyToken, getComplaintById);
router.put('/:id', verifyToken, updateComplaint);
router.delete('/:id', verifyToken, deleteComplaint);

export default router;
