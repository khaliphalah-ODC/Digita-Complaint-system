import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  testimonialsQuery,
  createTestimonialQuery,
  fetchApprovedTestimonialsQuery,
  fetchAllTestimonialsQuery,
  fetchTestimonialByIdQuery,
  fetchTestimonialsByOrganizationQuery,
  fetchTestimonialByIdWithOrganizationQuery,
  approveTestimonialQuery,
  rejectTestimonialQuery,
  deleteTestimonialQuery
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

const getNumericId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const getOrganizationId = (req) => {
  const id = Number.parseInt(req.user?.organization_id, 10);
  return Number.isInteger(id) ? id : null;
};

export const submitTestimonial = (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 401, 'Unauthorized. Please log in.');
  }

  const message = String(req.body?.message || '').trim();
  const rating = Number.parseInt(req.body?.rating, 10);
  const displayName = String(req.body?.display_name || 'Anonymous').trim() || 'Anonymous';
  const roleLabel = String(req.body?.role_label || 'System User').trim() || 'System User';

  if (message.length < 20) {
    return sendError(res, 400, 'Message must be at least 20 characters.');
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return sendError(res, 400, 'Rating must be between 1 and 5.');
  }

  complaintDB.run(
    createTestimonialQuery,
    [userId, displayName, roleLabel, message, rating],
    function handleInsert(err) {
      if (err) {
        return sendError(res, 500, 'Failed to submit testimonial', err.message);
      }

      return sendSuccess(
        res,
        201,
        'Testimonial submitted successfully. It will appear after admin approval.',
        { id: this.lastID }
      );
    });
};

const updateTestimonialApproval = (req, res, query, successMessage, failureMessage) => {
  const id = getNumericId(req.params.id);
  const organizationId = getOrganizationId(req);
  if (!id) {
    return sendError(res, 400, 'Invalid testimonial id');
  }

  complaintDB.get(fetchTestimonialByIdWithOrganizationQuery, [id], (findErr, row) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to find testimonial', findErr.message);
    }

    if (!row) {
      return sendError(res, 404, 'Testimonial not found');
    }

    if (Number(row.organization_id) !== organizationId) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(query, [id], (updateErr) => {
      if (updateErr) {
        return sendError(res, 500, failureMessage, updateErr.message);
      }
      return sendSuccess(res, 200, successMessage, { id });
    });
  });
};

export const getPublicTestimonials = (req, res) => {
  complaintDB.all(fetchApprovedTestimonialsQuery, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch testimonials', err.message);
    }
    return sendSuccess(res, 200, 'Testimonials retrieved successfully', rows);
  });
};

export const getAllTestimonials = (req, res) => {
  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    return sendError(res, 400, 'Organization context is required');
  }

  complaintDB.all(fetchTestimonialsByOrganizationQuery, [organizationId], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch testimonials', err.message);
    }
    return sendSuccess(res, 200, 'All testimonials retrieved successfully', rows);
  });
};

export const approveTestimonial = (req, res) =>
  updateTestimonialApproval(
    req,
    res,
    approveTestimonialQuery,
    'Testimonial approved successfully',
    'Failed to approve testimonial'
  );

export const rejectTestimonial = (req, res) =>
  updateTestimonialApproval(
    req,
    res,
    rejectTestimonialQuery,
    'Testimonial rejected successfully',
    'Failed to reject testimonial'
  );

export const deleteTestimonial = (req, res) => {
  const id = getNumericId(req.params.id);
  const organizationId = getOrganizationId(req);
  if (!id) {
    return sendError(res, 400, 'Invalid testimonial id');
  }

  complaintDB.get(fetchTestimonialByIdWithOrganizationQuery, [id], (findErr, row) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to find testimonial', findErr.message);
    }

    if (!row) {
      return sendError(res, 404, 'Testimonial not found');
    }

    if (Number(row.organization_id) !== organizationId) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(deleteTestimonialQuery, [id], (err) => {
      if (err) {
        return sendError(res, 500, 'Failed to delete testimonial', err.message);
      }
      return sendSuccess(res, 200, 'Testimonial deleted successfully', { id });
    });
  });
};
