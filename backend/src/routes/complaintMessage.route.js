// complaintMessage.route routes: maps complaint live-chat endpoints to controller handlers.
import express from 'express';
import {
  createComplaintMessage,
  getComplaintMessagesByComplaintId
} from '../controllers/complaintMessage.controller.js';

const router = express.Router();

router.get('/:complaintId', getComplaintMessagesByComplaintId);
router.post('/:complaintId', createComplaintMessage);

export default router;

