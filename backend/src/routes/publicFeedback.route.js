import express from 'express';
import {
  getPublicFeedbackFormBySlug,
  submitPublicFeedback
} from '../controllers/publicFeedback.controller.js';

const router = express.Router();

router.get('/:slug', getPublicFeedbackFormBySlug);
router.post('/:slug/submit', submitPublicFeedback);
router.post('/:slug/submissions', submitPublicFeedback);

export default router;
