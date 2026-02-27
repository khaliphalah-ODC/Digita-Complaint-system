import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  Complaint,
  insertComplaint,
  selectComplaint,
  selectComplaintById
} from '../model/complaint.model.js';

export const CreateComplaintTable = () => {
  complaintDB.run(Complaint, (err) => {
    if (err) {
      console.error('Error creating complaint table:', err.message);
    } else {
      console.log('Complaint table created or already exists');
    }
  });
};

export const createComplaint = (req, res) => {
  const { complaint } = req.body;

  if (!complaint) {
    return sendError(res, 400, 'complaint is required');
  }

  complaintDB.run(insertComplaint, [complaint], function onCreate(err) {
    if (err) {
      return sendError(res, 500, 'Failed to create complaint', err.message);
    }

    complaintDB.get(selectComplaintById, [this.lastID], (getErr, row) => {
      if (getErr) {
        return sendError(res, 500, 'Failed to fetch complaint', getErr.message);
      }
      return sendSuccess(res, 201, 'Complaint created successfully', row);
    });
  });
};

export const getAllComplaints = (_req, res) => {
  complaintDB.all(selectComplaint, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch complaints', err.message);
    }
    return sendSuccess(res, 200, 'Complaints retrieved successfully', rows);
  });
};

export const getComplaintById = (req, res) => {
  complaintDB.get(selectComplaintById, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch complaint', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Complaint not found');
    }
    return sendSuccess(res, 200, 'Complaint retrieved successfully', row);
  });
};
