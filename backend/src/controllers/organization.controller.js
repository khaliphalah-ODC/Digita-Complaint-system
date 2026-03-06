// organization.controller controller: handles HTTP request/response flow for this module.
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
import { fetchUserByIdQuery } from '../model/user.model.js';

const authorizeOrganizationOwnership = (req, res, organizationId, onAllowed) => {
  if (req.user?.role === 'admin') {
    onAllowed();
    return;
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], (userErr, userRow) => {
    if (userErr) {
      return sendError(res, 500, 'Failed to fetch user organization', userErr.message);
    }
    if (!userRow?.organization_id) {
      return sendError(res, 403, 'Access denied');
    }
    if (String(userRow.organization_id) !== String(organizationId)) {
      return sendError(res, 403, 'Access denied');
    }
    return onAllowed();
  });
};

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

      const organizationId = this.lastID;
      const shouldBindToCreator = req.user && req.user.role !== 'admin';

      const finishResponse = () => {
        complaintDB.get(selectOrganizationById, [organizationId], (getErr, row) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch organization', getErr.message);
          }
          return sendSuccess(res, 201, 'Organization created successfully', row);
        });
      };

      if (!shouldBindToCreator) {
        return finishResponse();
      }

      complaintDB.run(
        'UPDATE users SET organization_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [organizationId, req.user.id],
        (bindErr) => {
          if (bindErr) {
            return sendError(res, 500, 'Organization created but failed to link user', bindErr.message);
          }
          return finishResponse();
        }
      );
    }
  );
};

export const getAllOrganizations = (req, res) => {
  if (req.user?.role === 'admin') {
    complaintDB.all(selectOrganizations, [], (err, rows) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch organizations', err.message);
      }
      return sendSuccess(res, 200, 'Organizations retrieved successfully', rows);
    });
    return;
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], (userErr, userRow) => {
    if (userErr) {
      return sendError(res, 500, 'Failed to fetch user organization', userErr.message);
    }
    if (!userRow?.organization_id) {
      return sendSuccess(res, 200, 'Organizations retrieved successfully', []);
    }

    complaintDB.get(selectOrganizationById, [userRow.organization_id], (orgErr, row) => {
      if (orgErr) {
        return sendError(res, 500, 'Failed to fetch organizations', orgErr.message);
      }
      return sendSuccess(res, 200, 'Organizations retrieved successfully', row ? [row] : []);
    });
  });
};

export const getOrganizationById = (req, res) => {
  if (req.user?.role === 'admin') {
    complaintDB.get(selectOrganizationById, [req.params.id], (err, row) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch organization', err.message);
      }
      if (!row) {
        return sendError(res, 404, 'Organization not found');
      }
      return sendSuccess(res, 200, 'Organization retrieved successfully', row);
    });
    return;
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], (userErr, userRow) => {
    if (userErr) {
      return sendError(res, 500, 'Failed to fetch user organization', userErr.message);
    }
    if (!userRow?.organization_id) {
      return sendError(res, 403, 'Access denied');
    }
    if (String(userRow.organization_id) !== String(req.params.id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.get(selectOrganizationById, [req.params.id], (err, row) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch organization', err.message);
      }
      if (!row) {
        return sendError(res, 404, 'Organization not found');
      }
      return sendSuccess(res, 200, 'Organization retrieved successfully', row);
    });
  });
};

export const updateOrganization = (req, res) => {
  if (req.user?.role !== 'admin' && req.body.status !== undefined) {
    return sendError(res, 403, 'Only admin can change organization status');
  }

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

  authorizeOrganizationOwnership(req, res, req.params.id, () => {
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
  });
};

export const deleteOrganization = (req, res) => {
  authorizeOrganizationOwnership(req, res, req.params.id, () => {
    complaintDB.run(deleteOrganizationById, [req.params.id], function onDelete(err) {
      if (err) {
        return sendError(res, 500, 'Failed to delete organization', err.message);
      }
      if (this.changes === 0) {
        return sendError(res, 404, 'Organization not found');
      }
      return sendSuccess(res, 200, 'Organization deleted successfully', { id: req.params.id });
    });
  });
};
