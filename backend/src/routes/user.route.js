import express from 'express';
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  updateUser
} from '../controllers/user.controller.js';

const router = express.Router();

router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/id/:id', getUserById);
router.get('/email/:email', getUserByEmail);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
