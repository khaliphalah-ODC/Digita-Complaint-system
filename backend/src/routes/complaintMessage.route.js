// complaintMessage.route routes: maps complaint live-chat endpoints to controller handlers.
import express from 'express';
import {
  createComplaintMessage,
  deleteComplaintMessage,
  getComplaintMessagesByComplaintId,
  updateComplaintMessage
} from '../controllers/complaintMessage.controller.js';

const router = express.Router();

router.get('/:complaintId', getComplaintMessagesByComplaintId);
router.post('/:complaintId', createComplaintMessage);
router.put('/:complaintId/:messageId', updateComplaintMessage);
router.delete('/:complaintId/:messageId', deleteComplaintMessage);

export default router;
