import express from 'express';
import {
  createFeedback,
  deleteFeedback,
  deleteFeedbackByComplaintId,
  getAllFeedback,
  getFeedbackByComplaintId,
  getFeedbackById,
  updateFeedback
} from '../controllers/feedback.controller.js';

const router = express.Router();

router.post('/', createFeedback);
router.get('/', getAllFeedback);
router.get('/complaint/:complaintId', getFeedbackByComplaintId);
router.get('/:id', getFeedbackById);
router.put('/:id', updateFeedback);
router.delete('/complaint/:complaintId', deleteFeedbackByComplaintId);
router.delete('/:id', deleteFeedback);

export default router;
