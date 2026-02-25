import express from 'express';
import {
  createStatusLog,
  deleteStatusLog,
  deleteStatusLogsByAccessmentId,
  getAllStatusLogs,
  getStatusLogById,
  getStatusLogsByAccessmentId,
  updateStatusLog
} from '../controllers/statusLog.controller.js';

const router = express.Router();

router.post('/', createStatusLog);
router.get('/', getAllStatusLogs);
router.get('/accessment/:accessmentId', getStatusLogsByAccessmentId);
router.get('/:id', getStatusLogById);
router.put('/:id', updateStatusLog);
router.delete('/accessment/:accessmentId', deleteStatusLogsByAccessmentId);
router.delete('/:id', deleteStatusLog);

export default router;
