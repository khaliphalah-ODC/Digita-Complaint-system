// testimonial.controller.js controller: handles HTTP request/response flow for this module.

import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
    testimonialsQuery,
    createTestimonialQuery,
    fetchApprovedTestimonialsQuery,
    fetchAllTestimonialsQuery,
    fetchTestimonialByIdQuery,
    approveTestimonialQuery,
    rejectTestimonialQuery,
    deleteTestimonialQuery,
} from '../model/testimonial.model.js';

export const CreateTestimonialsTable = () => {
    complaintDB.run(testimonialsQuery, (err) => {
        if (err) {
            console.error('Error creating testimonials table:', err.message);
        } else {
            console.log('Testimonials table created or already exists');
        }
    });
};

// ── POST /api/testimonials ─────────────────────────────────
// Logged-in user submits a public testimonial
export const submitTestimonial = (req, res) => {
    const user_id = req.user?.id;

    if (!user_id) {
        return sendError(res, 401, 'Unauthorized. Please log in.');
    }

    const { display_name, role_label, message, rating } = req.body;

    if (!message || String(message).trim().length < 20) {
        return sendError(res, 400, 'Message must be at least 20 characters.');
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
        return sendError(res, 400, 'Rating must be between 1 and 5.');
    }

    const params = [
        user_id,
        String(display_name || 'Anonymous').trim(),
        String(role_label || 'System User').trim(),
        String(message).trim(),
        parseInt(rating),
    ];

    complaintDB.run(createTestimonialQuery, params, function (err) {
        if (err) {
            return sendError(res, 500, 'Failed to submit testimonial', err.message);
        }
        return sendSuccess(res, 201, 'Testimonial submitted successfully. It will appear after admin approval.', {
            id: this.lastID,
        });
    });
};

// ── GET /api/testimonials/public ──────────────────────────
// Public — no auth required — returns only approved testimonials
export const getPublicTestimonials = (req, res) => {
    complaintDB.all(fetchApprovedTestimonialsQuery, [], (err, rows) => {
        if (err) {
            return sendError(res, 500, 'Failed to fetch testimonials', err.message);
        }
        return sendSuccess(res, 200, 'Testimonials retrieved successfully', rows);
    });
};

// ── GET /api/testimonials ─────────────────────────────────
// Super admin only — returns all testimonials including unapproved
export const getAllTestimonials = (req, res) => {
    complaintDB.all(fetchAllTestimonialsQuery, [], (err, rows) => {
        if (err) {
            return sendError(res, 500, 'Failed to fetch testimonials', err.message);
        }
        return sendSuccess(res, 200, 'All testimonials retrieved successfully', rows);
    });
};

// ── PATCH /api/testimonials/:id/approve ───────────────────
// Super admin only — approve a testimonial to show publicly
export const approveTestimonial = (req, res) => {
    const { id } = req.params;

    complaintDB.get(fetchTestimonialByIdQuery, [id], (findErr, row) => {
        if (findErr) {
            return sendError(res, 500, 'Failed to find testimonial', findErr.message);
        }
        if (!row) {
            return sendError(res, 404, 'Testimonial not found');
        }

        complaintDB.run(approveTestimonialQuery, [id], function (err) {
            if (err) {
                return sendError(res, 500, 'Failed to approve testimonial', err.message);
            }
            return sendSuccess(res, 200, 'Testimonial approved successfully');
        });
    });
};

// ── PATCH /api/testimonials/:id/reject ────────────────────
// Super admin only — reject / unpublish a testimonial
export const rejectTestimonial = (req, res) => {
    const { id } = req.params;

    complaintDB.get(fetchTestimonialByIdQuery, [id], (findErr, row) => {
        if (findErr) {
            return sendError(res, 500, 'Failed to find testimonial', findErr.message);
        }
        if (!row) {
            return sendError(res, 404, 'Testimonial not found');
        }

        complaintDB.run(rejectTestimonialQuery, [id], function (err) {
            if (err) {
                return sendError(res, 500, 'Failed to reject testimonial', err.message);
            }
            return sendSuccess(res, 200, 'Testimonial rejected successfully');
        });
    });
};

// ── DELETE /api/testimonials/:id ──────────────────────────
// Super admin only — permanently delete a testimonial
export const deleteTestimonial = (req, res) => {
    const { id } = req.params;

    complaintDB.get(fetchTestimonialByIdQuery, [id], (findErr, row) => {
        if (findErr) {
            return sendError(res, 500, 'Failed to find testimonial', findErr.message);
        }
        if (!row) {
            return sendError(res, 404, 'Testimonial not found');
        }

        complaintDB.run(deleteTestimonialQuery, [id], function (err) {
            if (err) {
                return sendError(res, 500, 'Failed to delete testimonial', err.message);
            }
            return sendSuccess(res, 200, 'Testimonial deleted successfully', { id });
        });
    });
};