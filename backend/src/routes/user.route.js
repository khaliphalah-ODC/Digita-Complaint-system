import express from 'express';
import { login } from '../utils/middleware/login.js';
import { validate, registerSchema } from '../utils/middleware/passwordValidation.js';

import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  updateUser
} from '../controllers/user.controller.js';

const router = express.Router();

router.post('/', validate(registerSchema), createUser);
router.post('/login', login);
router.get('/', getAllUsers);
router.get('/id/:id', getUserById);
router.get('/email/:email', getUserByEmail);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
