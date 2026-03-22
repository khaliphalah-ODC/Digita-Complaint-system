// user.route routes: maps API endpoints to controller handlers.
import express from 'express';
import {
  assignExistingUserToOrganization,
  changeOwnPassword,
  createUser,
  deleteUser,
  getCurrentUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  loginUser,
  loginWithGoogle,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  verifyEmail,
  resendVerificationEmail,
  updateUser,
  updateUserRole
} from '../controllers/user.controller.js';
import verifyToken from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/roleAccess.js';
import { passwordEncryption } from '../middleware/passwordEncryption.js';
import {
  validate,
  passwordOnlySchema,
  emailVerificationSchema,
  emailOnlySchema,
  resetPasswordSchema,
  changePasswordSchema,
  userCreateSchema
} from '../utils/middleware/passwordValidation.js';

const router = express.Router();

//router.post('/register', validate(passwordOnlySchema), passwordEncryption, registerUser);
router.post('/register', validate(userCreateSchema), passwordEncryption, registerUser);
// router.post('/verify-email', verifyEmail);
// router.post('/resend-verification', resendVerificationEmail);
router.post('/verify-email', validate(emailVerificationSchema), verifyEmail);
router.post('/resend-verification', validate(emailOnlySchema), resendVerificationEmail);
router.post('/forgot-password/request', validate(emailOnlySchema), requestPasswordReset);

router.post('/login', loginUser);
router.post('/google-login', loginWithGoogle);
//router.post('/forgot-password/request', requestPasswordReset);
router.post('/forgot-password', validate(resetPasswordSchema), passwordEncryption, resetPasswordWithToken);
router.get('/me', verifyToken, getCurrentUser);
router.post('/logout', verifyToken, logoutUser);
router.post('/change-password', verifyToken, validate(changePasswordSchema), passwordEncryption, changeOwnPassword);

router.post('/assign-existing', verifyToken, allowRoles('org_admin'), assignExistingUserToOrganization);
router.post('/', verifyToken, allowRoles('super_admin', 'org_admin'), validate(userCreateSchema), passwordEncryption, createUser);
router.get('/', verifyToken, allowRoles('super_admin', 'org_admin'), getAllUsers);
router.get('/id/:id', verifyToken, allowRoles('super_admin', 'org_admin'), getUserById);
router.get('/email/:email', verifyToken, allowRoles('super_admin', 'org_admin'), getUserByEmail);
router.put('/:id', verifyToken, allowRoles('super_admin', 'org_admin'), passwordEncryption, updateUser);
router.patch('/:id/role', verifyToken, allowRoles('super_admin', 'org_admin'), updateUserRole);
router.delete('/:id', verifyToken, allowRoles('super_admin', 'org_admin'), deleteUser);

export default router;
