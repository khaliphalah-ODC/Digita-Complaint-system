import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  Organization,
  deleteOrganizationById,
  insertOrganization,
  selectOrganizations,
  selectOrganizationById,
  updateOrganizationById
} from '../model/organization.model.js';

export const CreateOrganizationTable = () => {
  complaintDB.run(Organization, (err) => {
    if (err) {
      console.error('Error creating organization table:', err.message);
    } else {
      console.log('Organization table created or already exists');
    }
  });
};

export const createOrganization = (req, res) => {
  const {
    name,
    organization_type,
    email,
    phone = null,
    address,
    logo = null,
    status = 'active'
  } = req.body;

  if (!name || !organization_type || !email || !address) {
    return sendError(res, 400, 'name, organization_type, email, and address are required');
  }

  complaintDB.run(
    insertOrganization,
    [name, organization_type, email, phone, address, logo, status],
    function onCreate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create organization', err.message);
      }

      complaintDB.get(selectOrganizationById, [this.lastID], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch organization', getErr.message);
        }
        return sendSuccess(res, 201, 'Organization created successfully', row);
      });
    }
  );
};

export const getAllOrganizations = (_req, res) => {
  complaintDB.all(selectOrganizations, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch organizations', err.message);
    }
    return sendSuccess(res, 200, 'Organizations retrieved successfully', rows);
  });
};

export const getOrganizationById = (req, res) => {
  complaintDB.get(selectOrganizationById, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch organization', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Organization not found');
    }
    return sendSuccess(res, 200, 'Organization retrieved successfully', row);
  });
};

export const updateOrganization = (req, res) => {
  const {
    name,
    organization_type,
    email,
    phone = null,
    address,
    logo = null,
    status = 'active'
  } = req.body;

  if (!name || !organization_type || !email || !address) {
    return sendError(res, 400, 'name, organization_type, email, and address are required');
  }

  complaintDB.run(
    updateOrganizationById,
    [name, organization_type, email, phone, address, logo, status, req.params.id],
    function onUpdate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to update organization', err.message);
      }
      if (this.changes === 0) {
        return sendError(res, 404, 'Organization not found');
      }

      complaintDB.get(selectOrganizationById, [req.params.id], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch updated organization', getErr.message);
        }
        return sendSuccess(res, 200, 'Organization updated successfully', row);
      });
    }
  );
};

export const deleteOrganization = (req, res) => {
  complaintDB.run(deleteOrganizationById, [req.params.id], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete organization', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Organization not found');
    }
    return sendSuccess(res, 200, 'Organization deleted successfully', { id: req.params.id });
  });
};
