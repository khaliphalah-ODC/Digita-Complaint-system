// user.route routes: maps API endpoints to controller handlers.
import express from 'express';
import {
  assignExistingUserToOrganization,
  changeOwnPassword,
  createUser,
  deleteUser,
  forgotPassword,
  getCurrentUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  loginUser,
  loginWithGoogle,
  logoutUser,
  registerUser,
  updateUser,
  updateUserRole
} from '../controllers/user.controller.js';
import verifyToken from '../middleware/verifyToken.js';
import isAdmin from '../middleware/isAdmin.js';
import { allowRoles } from '../middleware/roleAccess.js';
import { passwordEncryption } from '../middleware/passwordEncryption.js';

const router = express.Router();

router.post('/register', passwordEncryption, registerUser);
router.post('/login', loginUser);
router.post('/google-login', loginWithGoogle);
router.post('/forgot-password', passwordEncryption, forgotPassword);
router.get('/me', verifyToken, getCurrentUser);
router.post('/logout', verifyToken, logoutUser);
router.post('/change-password', verifyToken, passwordEncryption, changeOwnPassword);

router.post('/assign-existing', verifyToken, allowRoles('org_admin'), assignExistingUserToOrganization);
router.post('/', verifyToken, allowRoles('org_admin'), passwordEncryption, createUser);
router.get('/', verifyToken, allowRoles('org_admin'), getAllUsers);
router.get('/id/:id', verifyToken, allowRoles('org_admin'), getUserById);
router.get('/email/:email', verifyToken, allowRoles('org_admin'), getUserByEmail);
router.put('/:id', verifyToken, allowRoles('org_admin'), passwordEncryption, updateUser);
router.patch('/:id/role', verifyToken, isAdmin, updateUserRole);
router.delete('/:id', verifyToken, allowRoles('org_admin'), deleteUser);

export default router;
