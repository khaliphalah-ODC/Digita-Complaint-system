// testimonial.route.js routes: maps API endpoints to controller handlers.

import express from 'express';
import {
    submitTestimonial,
    getPublicTestimonials,
    getAllTestimonials,
    approveTestimonial,
    rejectTestimonial,
    deleteTestimonial,
} from '../controllers/testimonial.controller.js';
import verifyToken from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/roleAccess.js';

const router = express.Router();

// ── Public — no auth required ──────────────────────────────
router.get('/public', getPublicTestimonials);

// ── Authenticated user ─────────────────────────────────────
router.post('/', verifyToken, submitTestimonial);

// ── Organization admin only ────────────────────────────────
router.get('/', verifyToken, allowRoles('org_admin'), getAllTestimonials);
router.patch('/:id/approve', verifyToken, allowRoles('org_admin'), approveTestimonial);
router.patch('/:id/reject', verifyToken, allowRoles('org_admin'), rejectTestimonial);
router.delete('/:id', verifyToken, allowRoles('org_admin'), deleteTestimonial);

export default router;
