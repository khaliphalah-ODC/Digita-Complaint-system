// feedback.route routes: maps API endpoints to controller handlers.
import express from 'express';
import {
  createFeedback,
  deleteFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedback
} from '../controllers/feedback.controller.js';
import {
  createCurrentFeedbackField,
  createCurrentFeedbackForm,
  deleteCurrentFeedbackField,
  getCurrentFeedbackForm,
  getCurrentFeedbackFormQr,
  getCurrentFeedbackSubmissionById,
  getCurrentFeedbackSubmissions,
  getSystemPublicFeedbackAnalytics,
  reorderCurrentFeedbackFields,
  updateCurrentFeedbackField,
  updateCurrentFeedbackForm
} from '../controllers/publicFeedback.controller.js';

const router = express.Router();

router.get('/forms/current', getCurrentFeedbackForm);
router.post('/forms/current', createCurrentFeedbackForm);
router.put('/forms/current', updateCurrentFeedbackForm);
router.get('/forms/current/qr', getCurrentFeedbackFormQr);
router.post('/forms/current/fields', createCurrentFeedbackField);
router.put('/forms/current/fields/reorder', reorderCurrentFeedbackFields);
router.put('/forms/current/fields/:fieldId', updateCurrentFeedbackField);
router.delete('/forms/current/fields/:fieldId', deleteCurrentFeedbackField);
router.get('/submissions/current', getCurrentFeedbackSubmissions);
router.get('/submissions/current/:id', getCurrentFeedbackSubmissionById);
router.get('/analytics/public/system', getSystemPublicFeedbackAnalytics);

router.post('/', createFeedback);
router.get('/', getAllFeedback);
router.get('/:id', getFeedbackById);
router.put('/:id', updateFeedback);
router.delete('/:id', deleteFeedback);

export default router;
