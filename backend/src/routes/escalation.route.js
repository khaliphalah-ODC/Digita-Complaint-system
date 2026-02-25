import express from 'express';
import {
  createEscalation,
  deleteEscalation,
  getAllEscalations,
  getEscalationById,
  getEscalationsByAccessmentId,
  getEscalationsByStatus,
  updateEscalation,
  updateEscalationStatus
} from '../controllers/escalation.controller.js';

const router = express.Router();

router.post('/', createEscalation);
router.get('/', getAllEscalations);
router.get('/accessment/:accessmentId', getEscalationsByAccessmentId);
router.get('/status/:status', getEscalationsByStatus);
router.get('/:id', getEscalationById);
router.put('/:id', updateEscalation);
router.patch('/:id/status', updateEscalationStatus);
router.delete('/:id', deleteEscalation);

export default router;
