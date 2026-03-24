// escalation.route routes: maps API endpoints to controller handlers.
import express from 'express';
import {
  createEscalation,
  deleteEscalation,
  getAllEscalations,
  updateEscalation,
  updateEscalationStatus
} from '../controllers/escalation.controller.js';

const router = express.Router();

router.post('/', createEscalation);
router.get('/', getAllEscalations);
router.put('/:id', updateEscalation);
router.patch('/:id/status', updateEscalationStatus);
router.delete('/:id', deleteEscalation);

export default router;
