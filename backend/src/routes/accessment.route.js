import express from 'express';
import {
  createAccessment,
  deleteAccessment,
  getAccessmentById,
  getAllAccessments,
  getAccessmentsByUserId,
  updateAccessmentAdminResponse
} from '../controllers/accessment.controller.js';

const router = express.Router();

router.post('/', createAccessment);
router.get('/', getAllAccessments);
router.get('/user/:userId', getAccessmentsByUserId);
router.get('/:id', getAccessmentById);
router.patch('/:id/admin-response', updateAccessmentAdminResponse);
router.delete('/:id', deleteAccessment);

export default router;
