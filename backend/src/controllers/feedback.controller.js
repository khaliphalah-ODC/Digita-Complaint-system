import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  Feedback,
  createFeedbackQuery,
  fetchAllFeedbackQuery,
  fetchFeedbackByIdQuery,
  fetchFeedbackByComplaintIdQuery,
  updateFeedbackQuery,
  deleteFeedbackByComplaintIdQuery,
  deleteFeedbackByIdQuery
} from '../model/feedback.model.js';

export const CreateFeedbackTable = () => {
  complaintDB.run(Feedback, (err) => {
    if (err) {
      console.error('Error creating feedback table:', err.message);
    } else {
      console.log('Feedback table created or already exists');
    }
  });
};

export const createFeedback = (req, res) => {
  const { complaint_id, user_id, rating, comment = null } = req.body;

  if (!complaint_id || !user_id || !rating) {
    return sendError(res, 400, 'complaint_id, user_id, and rating are required');
  }
  if (rating < 1 || rating > 5) {
    return sendError(res, 400, 'rating must be between 1 and 5');
  }

  complaintDB.run(
    createFeedbackQuery,
    [complaint_id, user_id, rating, comment],
    function onCreate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create feedback', err.message);
      }
      complaintDB.get(fetchFeedbackByIdQuery, [this.lastID], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch feedback', getErr.message);
        }
        return sendSuccess(res, 201, 'Feedback created successfully', row);
      });
    }
  );
};

export const getAllFeedback = (_req, res) => {
  complaintDB.all(fetchAllFeedbackQuery, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch feedback', err.message);
    }
    return sendSuccess(res, 200, 'Feedback retrieved successfully', rows);
  });
};

export const getFeedbackById = (req, res) => {
  complaintDB.get(fetchFeedbackByIdQuery, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch feedback', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Feedback not found');
    }
    return sendSuccess(res, 200, 'Feedback retrieved successfully', row);
  });
};

export const getFeedbackByComplaintId = (req, res) => {
  complaintDB.all(fetchFeedbackByComplaintIdQuery, [req.params.complaintId], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch feedback by complaint', err.message);
    }
    return sendSuccess(res, 200, 'Feedback retrieved successfully', rows);
  });
};

export const updateFeedback = (req, res) => {
  const { rating, comment = null } = req.body;

  if (!rating) {
    return sendError(res, 400, 'rating is required');
  }
  if (rating < 1 || rating > 5) {
    return sendError(res, 400, 'rating must be between 1 and 5');
  }

  complaintDB.run(updateFeedbackQuery, [rating, comment, req.params.id], function onUpdate(err) {
    if (err) {
      return sendError(res, 500, 'Failed to update feedback', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Feedback not found');
    }

    complaintDB.get(fetchFeedbackByIdQuery, [req.params.id], (getErr, row) => {
      if (getErr) {
        return sendError(res, 500, 'Failed to fetch updated feedback', getErr.message);
      }
      return sendSuccess(res, 200, 'Feedback updated successfully', row);
    });
  });
};

export const deleteFeedback = (req, res) => {
  complaintDB.run(deleteFeedbackByIdQuery, [req.params.id], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete feedback', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Feedback not found');
    }
    return sendSuccess(res, 200, 'Feedback deleted successfully', { id: req.params.id });
  });
};

export const deleteFeedbackByComplaintId = (req, res) => {
  complaintDB.run(deleteFeedbackByComplaintIdQuery, [req.params.complaintId], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete feedback', err.message);
    }
    return sendSuccess(res, 200, 'Feedback deleted successfully', {
      complaint_id: req.params.complaintId,
      deleted_count: this.changes
    });
  });
};
