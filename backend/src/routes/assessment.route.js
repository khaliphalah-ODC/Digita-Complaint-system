// assessment.route routes: maps API endpoints to controller handlers.
import express from 'express';
import {
  createAccessment,
  deleteAccessment,
  getAccessmentById,
  getAllAccessments,
  getAccessmentsByComplaintId,
  getAccessmentsByUserId,
  updateAccessment,
  updateAccessmentAdminResponse
} from '../controllers/assessment.controller.js';

const router = express.Router();

router.post('/', createAccessment);
router.get('/', getAllAccessments);
router.get('/complaint/:complaintId', getAccessmentsByComplaintId);
router.get('/user/:userId', getAccessmentsByUserId);
router.get('/:id', getAccessmentById);
router.put('/:id', updateAccessment);
router.patch('/:id/admin-response', updateAccessmentAdminResponse);
router.delete('/:id', deleteAccessment);

export default router;
