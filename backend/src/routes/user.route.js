// user.route routes: maps API endpoints to controller handlers.
import express from 'express';
import { login } from '../utils/middleware/login.js';
import {
  createUser,
  deleteUser,
  getCurrentUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  loginUser,
  logoutUser,
  registerUser,
  updateUser
} from '../controllers/user.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();


router.post('/', createUser);
router.post('/login', login)
router.get('/', getAllUsers);
router.get('/id/:id', getUserById);
router.get('/email/:email', getUserByEmail);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

router.post('/', authenticateToken, authorizeRoles('admin'), createUser);
router.get('/', authenticateToken, authorizeRoles('admin'), getAllUsers);
router.get('/id/:id', authenticateToken, authorizeRoles('admin'), getUserById);
router.get('/email/:email', authenticateToken, authorizeRoles('admin'), getUserByEmail);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateUser);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteUser);
export default router;
