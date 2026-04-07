import express from 'express';
import { allowRoles } from '../middleware/roleAccess.js';
import {
  getCurrentOrganizationSettings,
  getCurrentUserSettings,
  updateCurrentOrganizationSettings,
  updateCurrentUserSettings
} from '../controllers/settings.controller.js';

const router = express.Router();

router.get('/organization/current', allowRoles('org_admin'), getCurrentOrganizationSettings);
router.put('/organization/current', allowRoles('org_admin'), updateCurrentOrganizationSettings);
router.get('/user/current', allowRoles('user', 'org_admin', 'super_admin'), getCurrentUserSettings);
router.put('/user/current', allowRoles('user', 'org_admin', 'super_admin'), updateCurrentUserSettings);

export default router;
