// organization.route routes: maps API endpoints to controller handlers.
import express from 'express';
import {
  createOrganizationAdmin,
  createOrganization,
  deleteOrganization,
  getAllOrganizations,
  getGlobalOrganizationStats,
  getOrganizationById,
  updateOrganization
} from '../controllers/organization.controller.js';

const router = express.Router();

router.post('/', createOrganization);
router.get('/global-stats', getGlobalOrganizationStats);
router.get('/', getAllOrganizations);
router.post('/:id/admin', createOrganizationAdmin);
router.get('/:id', getOrganizationById);
router.put('/:id', updateOrganization);
router.delete('/:id', deleteOrganization);

export default router;
