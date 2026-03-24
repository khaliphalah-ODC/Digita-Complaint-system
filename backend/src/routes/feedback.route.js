// feedback.route routes: maps API endpoints to controller handlers.
import express from 'express';
import {
  createFeedback,
  deleteFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedback
} from '../controllers/feedback.controller.js';

const router = express.Router();

router.post('/', createFeedback);
router.get('/', getAllFeedback);
router.get('/:id', getFeedbackById);
router.put('/:id', updateFeedback);
router.delete('/:id', deleteFeedback);

export default router;
