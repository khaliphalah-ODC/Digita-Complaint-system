import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  VALID_ESCALATION_LEVELS,
  VALID_ESCALATION_STATUSES,
  createEscalationQuery,
  deleteEscalationQuery,
  escalationsQuery,
  fetchEscalationByIdQuery,
  fetchEscalationsByAccessmentIdQuery,
  fetchEscalationsByStatusQuery,
  fetchEscalationsQuery,
  updateEscalationQuery,
  updateEscalationStatusQuery
} from '../model/escalation.model.js';

export const CreateEscalationsTable = () => {
  complaintDB.run(escalationsQuery, (err) => {
    if (err) {
      console.error('Error creating escalations table:', err.message);
    } else {
      console.log('Escalations table created or already exists');
    }
  });
};

export const createEscalation = (req, res) => {
  const {
    accessment_id,
    escalated_by,
    assigned_to = null,
    escalation_level = 'level_1',
    reason,
    notes = null,
    status = 'pending'
  } = req.body;

  if (!accessment_id || !escalated_by || !reason) {
    return sendError(res, 400, 'accessment_id, escalated_by, and reason are required');
  }
  if (!VALID_ESCALATION_LEVELS.includes(escalation_level)) {
    return sendError(res, 400, `escalation_level must be one of: ${VALID_ESCALATION_LEVELS.join(', ')}`);
  }
  if (!VALID_ESCALATION_STATUSES.includes(status)) {
    return sendError(res, 400, `status must be one of: ${VALID_ESCALATION_STATUSES.join(', ')}`);
  }

  complaintDB.run(
    createEscalationQuery,
    [accessment_id, escalated_by, assigned_to, escalation_level, reason, notes, status],
    function onCreate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create escalation', err.message);
      }
      complaintDB.get(fetchEscalationByIdQuery, [this.lastID], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch escalation', getErr.message);
        }
        return sendSuccess(res, 201, 'Escalation created successfully', row);
      });
    }
  );
};

export const getAllEscalations = (_req, res) => {
  complaintDB.all(fetchEscalationsQuery, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch escalations', err.message);
    }
    return sendSuccess(res, 200, 'Escalations retrieved successfully', rows);
  });
};

export const getEscalationById = (req, res) => {
  complaintDB.get(fetchEscalationByIdQuery, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch escalation', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Escalation not found');
    }
    return sendSuccess(res, 200, 'Escalation retrieved successfully', row);
  });
};

export const getEscalationsByAccessmentId = (req, res) => {
  complaintDB.all(fetchEscalationsByAccessmentIdQuery, [req.params.accessmentId], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch escalations by accessment', err.message);
    }
    return sendSuccess(res, 200, 'Escalations retrieved successfully', rows);
  });
};

export const getEscalationsByStatus = (req, res) => {
  const { status } = req.params;
  if (!VALID_ESCALATION_STATUSES.includes(status)) {
    return sendError(res, 400, `status must be one of: ${VALID_ESCALATION_STATUSES.join(', ')}`);
  }

  complaintDB.all(fetchEscalationsByStatusQuery, [status], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch escalations by status', err.message);
    }
    return sendSuccess(res, 200, 'Escalations retrieved successfully', rows);
  });
};

export const updateEscalation = (req, res) => {
  const {
    assigned_to = null,
    escalation_level,
    reason,
    notes = null,
    status,
    resolved_at = null
  } = req.body;

  if (!escalation_level || !reason || !status) {
    return sendError(res, 400, 'escalation_level, reason, and status are required');
  }
  if (!VALID_ESCALATION_LEVELS.includes(escalation_level)) {
    return sendError(res, 400, `escalation_level must be one of: ${VALID_ESCALATION_LEVELS.join(', ')}`);
  }
  if (!VALID_ESCALATION_STATUSES.includes(status)) {
    return sendError(res, 400, `status must be one of: ${VALID_ESCALATION_STATUSES.join(', ')}`);
  }

  complaintDB.run(
    updateEscalationQuery,
    [assigned_to, escalation_level, reason, notes, status, resolved_at, req.params.id],
    function onUpdate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to update escalation', err.message);
      }
      if (this.changes === 0) {
        return sendError(res, 404, 'Escalation not found');
      }

      complaintDB.get(fetchEscalationByIdQuery, [req.params.id], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch updated escalation', getErr.message);
        }
        return sendSuccess(res, 200, 'Escalation updated successfully', row);
      });
    }
  );
};

export const updateEscalationStatus = (req, res) => {
  const { status, resolved_at = null } = req.body;

  if (!status) {
    return sendError(res, 400, 'status is required');
  }
  if (!VALID_ESCALATION_STATUSES.includes(status)) {
    return sendError(res, 400, `status must be one of: ${VALID_ESCALATION_STATUSES.join(', ')}`);
  }

  complaintDB.run(updateEscalationStatusQuery, [status, resolved_at, req.params.id], function onUpdate(err) {
    if (err) {
      return sendError(res, 500, 'Failed to update escalation status', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Escalation not found');
    }

    complaintDB.get(fetchEscalationByIdQuery, [req.params.id], (getErr, row) => {
      if (getErr) {
        return sendError(res, 500, 'Failed to fetch updated escalation', getErr.message);
      }
      return sendSuccess(res, 200, 'Escalation status updated successfully', row);
    });
  });
};

export const deleteEscalation = (req, res) => {
  complaintDB.run(deleteEscalationQuery, [req.params.id], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete escalation', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Escalation not found');
    }
    return sendSuccess(res, 200, 'Escalation deleted successfully', { id: req.params.id });
  });
};
