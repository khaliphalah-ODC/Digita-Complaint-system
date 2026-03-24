// joinCode.controller.js controller: handles HTTP request/response flow for join code feature.

import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import generateToken from '../middleware/generateToken.js';
import { passwordEncryption } from '../middleware/passwordEncryption.js';
import {
  selectOrganizationByJoinCode,
  updateOrganizationJoinCode,
  selectPendingUsersByOrganization,
  approvePendingUser,
  rejectPendingUser,
  selectOrganizationById,
} from '../model/organization.model.js';
import {
  createUserQuery,
  fetchUserByEmailQuery,
  fetchUserByIdQuery,
} from '../model/user.model.js';

// ── Utility: generate a unique join code ──────────────────
const generateJoinCode = (organizationName) => {
  const prefix = organizationName
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X');
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `${prefix}-${year}-${random}`;
};

// ── Utility: join code expiry (90 days from now) ──────────
const getJoinCodeExpiry = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 90);
  return expiry.toISOString();
};

// ── POST /api/join/register ───────────────────────────────
// Public — anyone can register using a valid join code
// Status is set to 'pending' until org admin approves
export const joinWithCode = (req, res) => {
  const { join_code, full_name, email, password } = req.body;

  if (!join_code || !full_name || !email || !password) {
    return sendError(res, 400, 'join_code, full_name, email, and password are required');
  }

  complaintDB.get(selectOrganizationByJoinCode, [join_code.trim().toUpperCase()], (findErr, org) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to validate join code', findErr.message);
    }
    if (!org) {
      return sendError(res, 404, 'Invalid join code. Please check and try again.');
    }

    // Check if join code has expired
    if (org.join_code_expires_at && new Date(org.join_code_expires_at) < new Date()) {
      return sendError(res, 400, 'This join code has expired. Please contact your organization admin for a new code.');
    }

    // Check if org is active
    if (org.status !== 'active') {
      return sendError(res, 403, 'This organization is not currently active.');
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if email already exists
    complaintDB.get(fetchUserByEmailQuery, [normalizedEmail], (emailErr, existingUser) => {
      if (emailErr) {
        return sendError(res, 500, 'Failed to verify email', emailErr.message);
      }
      if (existingUser) {
        return sendError(res, 409, 'An account with this email already exists.');
      }

      // Create the user with status = 'pending' so org admin must approve
      complaintDB.run(
        createUserQuery,
        [
          org.organization_id, // organization_id
          req.body.department_id ? Number(req.body.department_id) : null,
          full_name.trim(),
          normalizedEmail,
          password,            // already hashed by passwordEncryption middleware
          0,                   // must_change_password
          'pending',           // status — pending until approved
          'user'               // role
        ],
        function onCreate(createErr) {
          if (createErr) {
            return sendError(res, 500, 'Failed to register. Please try again.', createErr.message);
          }

          complaintDB.get(fetchUserByIdQuery, [this.lastID], (getErr, newUser) => {
            if (getErr) {
              return sendError(res, 500, 'Registered but failed to load user', getErr.message);
            }

            const { password: _pw, ...safeUser } = newUser;
            return sendSuccess(res, 201,
              `Registration successful! Your account is pending approval from ${org.name}. You will be able to log in once approved.`,
              {
                user: safeUser,
                organization: org.name,
              }
            );
          });
        }
      );
    });
  });
};

// ── GET /api/join/pending ─────────────────────────────────
// Org admin only — get all pending members for their organization
export const getPendingMembers = (req, res) => {
  const organization_id = req.user?.organization_id;

  if (!organization_id) {
    return sendError(res, 400, 'No organization associated with this admin account.');
  }

  complaintDB.all(selectPendingUsersByOrganization, [organization_id], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch pending members', err.message);
    }
    return sendSuccess(res, 200, 'Pending members retrieved successfully', rows);
  });
};

// ── PATCH /api/join/approve/:userId ──────────────────────
// Org admin only — approve a pending member
export const approveMember = (req, res) => {
  const organization_id = req.user?.organization_id;
  const { userId } = req.params;

  if (!organization_id) {
    return sendError(res, 400, 'No organization associated with this admin account.');
  }

  complaintDB.run(approvePendingUser, [userId, organization_id], function (err) {
    if (err) {
      return sendError(res, 500, 'Failed to approve member', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Pending member not found or already approved.');
    }
    return sendSuccess(res, 200, 'Member approved successfully. They can now log in.');
  });
};

// ── DELETE /api/join/reject/:userId ──────────────────────
// Org admin only — reject and remove a pending member
export const rejectMember = (req, res) => {
  const organization_id = req.user?.organization_id;
  const { userId } = req.params;

  if (!organization_id) {
    return sendError(res, 400, 'No organization associated with this admin account.');
  }

  complaintDB.run(rejectPendingUser, [userId, organization_id], function (err) {
    if (err) {
      return sendError(res, 500, 'Failed to reject member', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'Pending member not found.');
    }
    return sendSuccess(res, 200, 'Member rejected and removed successfully.');
  });
};

// ── PATCH /api/join/regenerate ────────────────────────────
// Org admin only — regenerate their organization join code
export const regenerateJoinCode = (req, res) => {
  const organization_id = req.user?.organization_id;

  if (!organization_id) {
    return sendError(res, 400, 'No organization associated with this admin account.');
  }

  complaintDB.get(selectOrganizationById, [organization_id], (findErr, org) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to find organization', findErr.message);
    }
    if (!org) {
      return sendError(res, 404, 'Organization not found.');
    }

    const newCode = generateJoinCode(org.name);
    const expiry = getJoinCodeExpiry();

    complaintDB.run(updateOrganizationJoinCode, [newCode, expiry, organization_id], function (err) {
      if (err) {
        return sendError(res, 500, 'Failed to regenerate join code', err.message);
      }
      return sendSuccess(res, 200, 'Join code regenerated successfully.', {
        join_code: newCode,
        expires_at: expiry,
      });
    });
  });
};

export const validateJoinCode = (req, res) => {
  const { join_code } = req.body;
  if (!join_code) return sendError(res, 400, 'join_code is required');
  complaintDB.get(selectOrganizationByJoinCode, [join_code.trim().toUpperCase()], (err, org) => {
    if (err) return sendError(res, 500, 'Failed to validate code', err.message);
    if (!org) return sendError(res, 404, 'Invalid join code. Please check and try again.');
    if (org.join_code_expires_at && new Date(org.join_code_expires_at) < new Date()) {
      return sendError(res, 400, 'This join code has expired. Contact your organization admin.');
    }
    if (org.status !== 'active') return sendError(res, 403, 'This organization is not currently active.');
    return sendSuccess(res, 200, 'Valid join code', {
      organization: {
        organization_id: org.organization_id,
        name: org.name,
        organization_type: org.organization_type,
      }
    });
  });
};

// ── Export helper so organization.controller can use it ──
export { generateJoinCode, getJoinCodeExpiry };
