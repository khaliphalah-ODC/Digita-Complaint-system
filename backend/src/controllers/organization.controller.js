// organization.controller controller: handles HTTP request/response flow for this module.
import bcrypt from 'bcrypt';
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
import { createUserQuery, fetchUserByEmailQuery, fetchUserByIdQuery } from '../model/user.model.js';

const DEFAULT_ORG_ADMIN_PASSWORD = process.env.ORG_ADMIN_DEFAULT_PASSWORD || 'Admin@123';

const getQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row || null);
    });
  });

const allQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows || []);
    });
  });

const getOrgAdminByOrganizationId = (organizationId, callback) => {
  complaintDB.get(
    "SELECT id, full_name, email, role, status, must_change_password, organization_id, created_at FROM users WHERE organization_id = ? AND role = 'org_admin' ORDER BY id ASC LIMIT 1",
    [organizationId],
    callback
  );
};

const authorizeOrganizationOwnership = (req, res, organizationId, onAllowed) => {
  if (req.user?.role === 'super_admin') {
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

const createOrganizationAdminAccount = (organizationId, payload, callback) => {
  const { admin_full_name, admin_email } = payload;
  const fullName = String(admin_full_name || `Admin - Org #${organizationId}`).trim();
  const email = String(admin_email || '').trim().toLowerCase();

  if (!email) {
    callback(new Error('admin_email is required for organization admin creation'));
    return;
  }

  complaintDB.get(fetchUserByEmailQuery, [email], async (findErr, existingUser) => {
    if (findErr) {
      callback(findErr);
      return;
    }
    if (existingUser) {
      callback(new Error('Organization admin email already exists'));
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(DEFAULT_ORG_ADMIN_PASSWORD, 10);
      complaintDB.run(
        createUserQuery,
        [organizationId, null, fullName, email, hashedPassword, 1, 'active', 'org_admin'],
        function onCreate(createErr) {
          if (createErr) {
            callback(createErr);
            return;
          }
          complaintDB.get(fetchUserByIdQuery, [this.lastID], callback);
        }
      );
    } catch (hashErr) {
      callback(hashErr);
    }
  });
};

export const createOrganization = (req, res) => {
  if (req.user?.role !== 'super_admin') {
    return sendError(res, 403, 'Only super_admin can create organizations');
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
  if (!req.body.admin_email) {
    return sendError(res, 400, 'admin_email is required to create an organization admin account');
  }

  complaintDB.run(
    insertOrganization,
    [name, organization_type, email, phone, address, logo, status],
    function onCreate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create organization', err.message);
      }

      const organizationId = this.lastID;
      createOrganizationAdminAccount(organizationId, req.body, (adminErr, adminRow) => {
        if (adminErr) {
          return sendError(res, 500, 'Organization created but failed to create organization admin', adminErr.message);
        }

        complaintDB.get(selectOrganizationById, [organizationId], (getErr, row) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch organization', getErr.message);
          }
          return sendSuccess(res, 201, 'Organization and organization admin created successfully', {
            organization: row,
            organization_admin: adminRow
              ? {
                  id: adminRow.id,
                  full_name: adminRow.full_name,
                  email: adminRow.email,
                  role: adminRow.role,
                  must_change_password: adminRow.must_change_password
                }
              : null,
            default_password_note: 'Organization admin must change default password on first login'
          });
        });
      });
    }
  );
};

export const createOrganizationAdmin = (req, res) => {
  if (req.user?.role !== 'super_admin') {
    return sendError(res, 403, 'Only super_admin can create organization admin accounts');
  }

  complaintDB.get(selectOrganizationById, [req.params.id], (orgErr, orgRow) => {
    if (orgErr) {
      return sendError(res, 500, 'Failed to fetch organization', orgErr.message);
    }
    if (!orgRow) {
      return sendError(res, 404, 'Organization not found');
    }

    getOrgAdminByOrganizationId(req.params.id, (adminLookupErr, existingAdmin) => {
      if (adminLookupErr) {
        return sendError(res, 500, 'Failed to check organization admin', adminLookupErr.message);
      }
      if (existingAdmin) {
        return sendError(res, 409, 'Organization already has an organization admin');
      }

      createOrganizationAdminAccount(Number(req.params.id), req.body, (createErr, adminRow) => {
        if (createErr) {
          return sendError(res, 500, 'Failed to create organization admin', createErr.message);
        }
        return sendSuccess(res, 201, 'Organization admin created successfully', {
          id: adminRow.id,
          full_name: adminRow.full_name,
          email: adminRow.email,
          role: adminRow.role,
          organization_id: adminRow.organization_id,
          must_change_password: adminRow.must_change_password
        });
      });
    });
  });
};

export const getAllOrganizations = (req, res) => {
  if (req.user?.role === 'super_admin') {
    complaintDB.all(selectOrganizations, [], (err, rows) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch organizations', err.message);
      }

      const tasks = rows.map(
        (row) =>
          new Promise((resolve) => {
            getOrgAdminByOrganizationId(row.organization_id, (_adminErr, adminRow) => {
              resolve({
                ...row,
                organization_admin: adminRow
                  ? {
                      id: adminRow.id,
                      full_name: adminRow.full_name,
                      email: adminRow.email,
                      status: adminRow.status
                    }
                  : null
              });
            });
          })
      );

      Promise.all(tasks)
        .then((payload) => sendSuccess(res, 200, 'Organizations retrieved successfully', payload))
        .catch((promiseErr) => sendError(res, 500, 'Failed to fetch organization admins', promiseErr.message));
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
      if (!row) {
        return sendSuccess(res, 200, 'Organizations retrieved successfully', []);
      }

      getOrgAdminByOrganizationId(userRow.organization_id, (adminErr, adminRow) => {
        if (adminErr) {
          return sendError(res, 500, 'Failed to fetch organization admin', adminErr.message);
        }
        return sendSuccess(res, 200, 'Organizations retrieved successfully', [
          {
            ...row,
            organization_admin: adminRow
              ? {
                  id: adminRow.id,
                  full_name: adminRow.full_name,
                  email: adminRow.email,
                  status: adminRow.status
                }
              : null
          }
        ]);
      });
    });
  });
};

export const getOrganizationById = (req, res) => {
  authorizeOrganizationOwnership(req, res, req.params.id, () => {
    complaintDB.get(selectOrganizationById, [req.params.id], (err, row) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch organization', err.message);
      }
      if (!row) {
        return sendError(res, 404, 'Organization not found');
      }

      getOrgAdminByOrganizationId(req.params.id, (adminErr, adminRow) => {
        if (adminErr) {
          return sendError(res, 500, 'Failed to fetch organization admin', adminErr.message);
        }
        Promise.all([
          getQuery('SELECT COUNT(*) AS users_count FROM users WHERE organization_id = ?', [req.params.id]),
          getQuery('SELECT COUNT(*) AS departments_count FROM department WHERE organization_id = ?', [req.params.id]),
          getQuery(
            `
            SELECT
              COUNT(*) AS total_complaints,
              SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submitted_complaints,
              SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) AS in_review_complaints,
              SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_complaints,
              SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_complaints
            FROM complaint
            WHERE organization_id = ?
            `,
            [req.params.id]
          )
        ])
          .then(([usersCountRow, departmentsCountRow, complaintSummaryRow]) =>
            sendSuccess(res, 200, 'Organization retrieved successfully', {
              ...row,
              users_count: Number(usersCountRow?.users_count || 0),
              departments_count: Number(departmentsCountRow?.departments_count || 0),
              total_complaints: Number(complaintSummaryRow?.total_complaints || 0),
              submitted_complaints: Number(complaintSummaryRow?.submitted_complaints || 0),
              in_review_complaints: Number(complaintSummaryRow?.in_review_complaints || 0),
              resolved_complaints: Number(complaintSummaryRow?.resolved_complaints || 0),
              closed_complaints: Number(complaintSummaryRow?.closed_complaints || 0),
              organization_admin: adminRow
                ? {
                    id: adminRow.id,
                    full_name: adminRow.full_name,
                    email: adminRow.email,
                    status: adminRow.status
                  }
                : null
            })
          )
          .catch((summaryErr) => sendError(res, 500, 'Failed to fetch organization summary', summaryErr.message));
      });
    });
  });
};

export const getGlobalOrganizationStats = async (req, res) => {
  if (req.user?.role !== 'super_admin') {
    return sendError(res, 403, 'Only super_admin can access platform aggregate statistics');
  }

  try {
    const [organizationStats, complaintStats, escalationStats, feedbackStats, recentOrganizations] = await Promise.all([
      getQuery(
        `
        SELECT
          COUNT(*) AS total_organizations,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_organizations,
          SUM(CASE WHEN status != 'active' THEN 1 ELSE 0 END) AS suspended_organizations
        FROM organization
        `
      ),
      getQuery(
        `
        SELECT
          COUNT(*) AS total_complaints,
          SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submitted_complaints,
          SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) AS in_review_complaints,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_complaints,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_complaints,
          SUM(CASE WHEN is_anonymous = 1 AND organization_id IS NULL THEN 1 ELSE 0 END) AS unassigned_anonymous_complaints
        FROM complaint
        `
      ),
      getQuery(
        `
        SELECT
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
        FROM escalations
        `
      ),
      allQuery(
        `
        SELECT rating, COUNT(*) AS count
        FROM feedback
        GROUP BY rating
        ORDER BY rating ASC
        `
      ),
      allQuery(
        `
        SELECT organization_id, name, status, created_at, updated_at
        FROM organization
        ORDER BY updated_at DESC, organization_id DESC
        LIMIT 8
        `
      )
    ]);

    const feedbackByRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let feedbackTotal = 0;
    let feedbackWeightedTotal = 0;
    for (const row of feedbackStats) {
      const rating = Number(row.rating);
      const count = Number(row.count || 0);
      if (!Number.isFinite(rating) || !feedbackByRating[rating]) continue;
      feedbackByRating[rating] = count;
      feedbackTotal += count;
      feedbackWeightedTotal += rating * count;
    }

    return sendSuccess(res, 200, 'Platform aggregate statistics retrieved successfully', {
      totalOrganizations: Number(organizationStats?.total_organizations || 0),
      activeOrganizations: Number(organizationStats?.active_organizations || 0),
      suspendedOrganizations: Number(organizationStats?.suspended_organizations || 0),
      totalComplaints: Number(complaintStats?.total_complaints || 0),
      submittedComplaints: Number(complaintStats?.submitted_complaints || 0),
      inReviewComplaints: Number(complaintStats?.in_review_complaints || 0),
      resolvedComplaints: Number(complaintStats?.resolved_complaints || 0),
      closedComplaints: Number(complaintStats?.closed_complaints || 0),
      unassignedAnonymousComplaints: Number(
        complaintStats?.unassigned_anonymous_complaints || 0
      ),
      escalationStatusCounts: {
        pending: Number(escalationStats?.pending_count || 0),
        in_progress: Number(escalationStats?.in_progress_count || 0),
        resolved: Number(escalationStats?.resolved_count || 0),
        rejected: Number(escalationStats?.rejected_count || 0)
      },
      feedbackSummary: {
        total: feedbackTotal,
        average: feedbackTotal > 0 ? Number((feedbackWeightedTotal / feedbackTotal).toFixed(2)) : 0,
        byRating: feedbackByRating
      },
      activityFeed: recentOrganizations.map((row) => ({
        text: `Organization ${row.name} is ${row.status}`,
        date: row.updated_at || row.created_at || null
      }))
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to load platform aggregate statistics', error.message);
  }
};

export const updateOrganization = (req, res) => {
  if (req.user?.role !== 'super_admin' && req.body.status !== undefined) {
    return sendError(res, 403, 'Only super_admin can change organization status');
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
  if (req.user?.role !== 'super_admin') {
    return sendError(res, 403, 'Only super_admin can delete organizations');
  }

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

export const getPublicOrganizationOptions = (req, res) => {
  complaintDB.all(
    `
    SELECT organization_id, name, organization_type
    FROM organization
    WHERE status = 'active'
    ORDER BY name ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch public organizations', err.message);
      }
      return sendSuccess(res, 200, 'Public organizations retrieved successfully', rows || []);
    }
  );
};
