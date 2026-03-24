// platformSettings.route: maps API endpoints to controller handlers.
import express from 'express';
import {
  getPlatformSettings,
  updatePlatformSettingsHandler
} from '../controllers/platformSettings.controller.js';

const router = express.Router();

router.get('/', getPlatformSettings);
router.put('/', updatePlatformSettingsHandler);

export default router;
