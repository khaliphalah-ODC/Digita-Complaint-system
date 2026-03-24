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

// ── Super admin only ───────────────────────────────────────
router.get('/', verifyToken, allowRoles('super_admin'), getAllTestimonials);
router.patch('/:id/approve', verifyToken, allowRoles('super_admin'), approveTestimonial);
router.patch('/:id/reject', verifyToken, allowRoles('super_admin'), rejectTestimonial);
router.delete('/:id', verifyToken, allowRoles('super_admin'), deleteTestimonial);

export default router;
