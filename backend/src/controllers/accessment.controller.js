import complainDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  accessmentQuery,
  createAccessmentQuery,
  fetchAccessmentsQuery,
  fetchAccessmentByIdQuery,
  fetchAccessmentsByUserIdQuery,
  updateAccessmentAdminResponseQuery,
  deleteAccessmentQuery,
  VALID_ACCESSMENT_TYPES,
  VALID_ACCESSMENT_PRIORITIES
} from '../model/accessment.model.js';

export const CreateAccessmentsTable = () => {
  complainDB.run(accessmentQuery, (err) => {
    if (err) {
      console.error('Error creating accessments table:', err.message);
    } else {
      console.log('Accessments table created or already exists');
    }
  });
};

export const createAccessment = (req, res) => {
  const {
    user_id,
    is_anonymous = 0,
    title,
    accessment_type,
    priority,
    tracking_code
  } = req.body;

  if (!user_id || !title || !accessment_type || !priority || !tracking_code) {
    return sendError(
      res,
      400,
      'user_id, title, accessment_type, priority, and tracking_code are required'
    );
  }
  if (!VALID_ACCESSMENT_TYPES.includes(accessment_type)) {
    return sendError(
      res,
      400,
      `accessment_type must be one of: ${VALID_ACCESSMENT_TYPES.join(', ')}`
    );
  }
  if (!VALID_ACCESSMENT_PRIORITIES.includes(priority)) {
    return sendError(
      res,
      400,
      `priority must be one of: ${VALID_ACCESSMENT_PRIORITIES.join(', ')}`
    );
  }

  complainDB.run(
    createAccessmentQuery,
    [user_id, is_anonymous ? 1 : 0, title, accessment_type, priority, tracking_code],
    function onCreate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create accessment', err.message);
      }

      complainDB.get(fetchAccessmentByIdQuery, [this.lastID], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch accessment', getErr.message);
        }
        return sendSuccess(res, 201, 'Accessment created successfully', row);
      });
    }
  );
};

export const getAllAccessments = (_req, res) => {
  complainDB.all(fetchAccessmentsQuery, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch accessments', err.message);
    }
    return sendSuccess(res, 200, 'Accessments retrieved successfully', rows);
  });
};

export const getAccessmentById = (req, res) => {
  complainDB.get(fetchAccessmentByIdQuery, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch accessment', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Accessment not found');
    }
    return sendSuccess(res, 200, 'Accessment retrieved successfully', row);
  });
};

export const getAccessmentsByUserId = (req, res) => {
  complainDB.all(fetchAccessmentsByUserIdQuery, [req.params.userId], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch accessments by user', err.message);
    }
    return sendSuccess(res, 200, 'Accessments retrieved successfully', rows);
  });
};

export const updateAccessmentAdminResponse = (req, res) => {
  const { admin_response } = req.body;

  if (!admin_response) {
    return sendError(res, 400, 'admin_response is required');
  }

  complainDB.run(updateAccessmentAdminResponseQuery, [admin_response, req.params.id], function onUpdate(err) {
    if (err) {
      return sendError(res, 500, 'Failed to update accessment', err.message);
    }

    if (this.changes === 0) {
      return sendError(res, 404, 'Accessment not found');
    }

    complainDB.get(fetchAccessmentByIdQuery, [req.params.id], (getErr, row) => {
      if (getErr) {
        return sendError(res, 500, 'Failed to fetch updated accessment', getErr.message);
      }
      return sendSuccess(res, 200, 'Accessment updated successfully', row);
    });
  });
};

export const deleteAccessment = (req, res) => {
  complainDB.run(deleteAccessmentQuery, [req.params.id], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete accessment', err.message);
    }

    if (this.changes === 0) {
      return sendError(res, 404, 'Accessment not found');
    }

    return sendSuccess(res, 200, 'Accessment deleted successfully', { id: req.params.id });
  });
};

export const getAccessments = getAllAccessments;
