// statusLog.controller controller: handles HTTP request/response flow for this module.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  statusLogsQuery,
  createStatusLogQuery,
  fetchAllStatusLogsQuery,
  fetchStatusLogByIdQuery,
  fetchStatusLogsByAccessmentIdQuery,
  updateStatusLogQuery,
  deleteStatusLogByIdQuery,
  deleteStatusLogsByAccessmentIdQuery
} from '../model/statusLog.model.js';

export const CreateStatusLogsTable = () => {
  complaintDB.run(statusLogsQuery, (err) => {
    if (err) {
      console.error('Error creating status_logs table:', err.message);
    } else {
      console.log('Status logs table created or already exists');
    }
  });
};

export const createStatusLog = (req, res) => {
  const { accessment_id, changed_by, old_status = null, new_status, notes = null } = req.body;

  if (!accessment_id || !changed_by || !new_status) {
    return sendError(res, 400, 'accessment_id, changed_by, and new_status are required');
  }

  complaintDB.run(
    createStatusLogQuery,
    [accessment_id, changed_by, old_status, new_status, notes],
    function onCreate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create status log', err.message);
      }

      complaintDB.get(fetchStatusLogByIdQuery, [this.lastID], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch status log', getErr.message);
        }
        return sendSuccess(res, 201, 'Status log created successfully', row);
      });
    }
  );
};

export const getAllStatusLogs = (_req, res) => {
  complaintDB.all(fetchAllStatusLogsQuery, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch status logs', err.message);
    }
    return sendSuccess(res, 200, 'Status logs retrieved successfully', rows);
  });
};

export const getStatusLogById = (req, res) => {
  complaintDB.get(fetchStatusLogByIdQuery, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch status log', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Status log not found');
    }
    return sendSuccess(res, 200, 'Status log retrieved successfully', row);
  });
};

export const getStatusLogsByAccessmentId = (req, res) => {
  complaintDB.all(fetchStatusLogsByAccessmentIdQuery, [req.params.accessmentId], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch status logs by accessment', err.message);
    }
    return sendSuccess(res, 200, 'Status logs retrieved successfully', rows);
  });
};

export const updateStatusLog = (req, res) => {
  const { old_status = null, new_status, notes = null } = req.body;

  if (!new_status) {
    return sendError(res, 400, 'new_status is required');
  }

  complaintDB.run(updateStatusLogQuery, [old_status, new_status, notes, req.params.id], function onUpdate(err) {
    if (err) {
      return sendError(res, 500, 'Failed to update status log', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Status log not found');
    }

    complaintDB.get(fetchStatusLogByIdQuery, [req.params.id], (getErr, row) => {
      if (getErr) {
        return sendError(res, 500, 'Failed to fetch updated status log', getErr.message);
      }
      return sendSuccess(res, 200, 'Status log updated successfully', row);
    });
  });
};

export const deleteStatusLog = (req, res) => {
  complaintDB.run(deleteStatusLogByIdQuery, [req.params.id], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete status log', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Status log not found');
    }
    return sendSuccess(res, 200, 'Status log deleted successfully', { id: req.params.id });
  });
};

export const deleteStatusLogsByAccessmentId = (req, res) => {
  complaintDB.run(deleteStatusLogsByAccessmentIdQuery, [req.params.accessmentId], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete status logs', err.message);
    }
    return sendSuccess(res, 200, 'Status logs deleted successfully', {
      accessment_id: req.params.accessmentId,
      deleted_count: this.changes
    });
  });
};
