// joinCode.route.js routes: maps API endpoints to controller handlers.

import express from 'express';
import {
  joinWithCode,
  getPendingMembers,
  approveMember,
  rejectMember,
  regenerateJoinCode,
  validateJoinCode
} from '../controllers/joinCode.controller.js';
import verifyToken from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/roleAccess.js';
import { passwordEncryption } from '../middleware/passwordEncryption.js';
//import { validate, passwordOnlySchema } from '../utils/middleware/passwordValidation.js';
import { validate, joinRegisterSchema } from '../utils/middleware/passwordValidation.js';
const router = express.Router();

// ── Public — anyone can join with a valid code ─────────────
//router.post('/register', validate(passwordOnlySchema), passwordEncryption, joinWithCode);

router.post('/register', validate(joinRegisterSchema), passwordEncryption, joinWithCode);

router.post('/validate-code', validateJoinCode);

// ── Org admin only ─────────────────────────────────────────
router.get('/pending', verifyToken, allowRoles('org_admin'), getPendingMembers);
router.patch('/approve/:userId', verifyToken, allowRoles('org_admin'), approveMember);
router.delete('/reject/:userId', verifyToken, allowRoles('org_admin'), rejectMember);
router.patch('/regenerate', verifyToken, allowRoles('org_admin'), regenerateJoinCode);

export default router;
