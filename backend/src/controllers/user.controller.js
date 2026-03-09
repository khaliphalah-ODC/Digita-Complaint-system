// user.controller controller: handles HTTP request/response flow for this module.
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import generateToken from '../middleware/generateToken.js';
import {
  usersQuery,
  createUserQuery,
  fetchUsersQuery,
  fetchUsersByOrganizationQuery,
  fetchUserByIdQuery,
  fetchUserByEmailQuery,
  updateUserQuery,
  updateUserRoleQuery,
  assignUserToOrganizationQuery,
  deleteUserQuery,
  createRevokedTokenQuery,
  revokedTokensQuery,
  updateOwnPasswordQuery
} from '../model/user.model.js';

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const getGoogleClientId = () =>
  process.env.GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_OAUTH_CLIENT_ID ||
  '';

const verifyGoogleCredential = async (credential) => {
  const googleClientId = getGoogleClientId();
  if (!googleClientId) {
    throw new Error('Google sign-in is not configured on the backend');
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) {
    throw new Error('Google token verification failed');
  }

  const payload = await response.json();
  if (payload.aud !== googleClientId) {
    throw new Error('Google client mismatch');
  }
  if (String(payload.email_verified) !== 'true') {
    throw new Error('Google account email is not verified');
  }

  return payload;
};

export const CreateUsersTable = () => {
  complaintDB.get("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'", [], (inspectErr, row) => {
    if (inspectErr) {
      console.error('Error checking users table schema:', inspectErr.message);
      return;
    }

    const schemaSql = row?.sql || '';
    const needsRoleMigration = schemaSql.includes("CHECK(role IN ('admin', 'user'))");

    const createAndMigrateColumns = () => {
      complaintDB.run(usersQuery, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
          return;
        }

        complaintDB.all('PRAGMA table_info(users)', [], (schemaErr, columns) => {
          if (schemaErr) {
            console.error('Error inspecting users table schema:', schemaErr.message);
            return;
          }

          const hasDepartmentId = (columns || []).some((col) => col.name === 'department_id');
          const hasMustChangePassword = (columns || []).some((col) => col.name === 'must_change_password');

          const maybeFinish = () => {
            console.log('Users table created or already exists');
          };

          if (!hasDepartmentId) {
            complaintDB.run('ALTER TABLE users ADD COLUMN department_id INTEGER', (alterErr) => {
              if (alterErr) {
                console.error('Error migrating users table (department_id):', alterErr.message);
              }
              if (!hasMustChangePassword) {
                complaintDB.run(
                  'ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0',
                  (mustErr) => {
                    if (mustErr) {
                      console.error('Error migrating users table (must_change_password):', mustErr.message);
                    }
                    maybeFinish();
                  }
                );
              } else {
                maybeFinish();
              }
            });
            return;
          }

          if (!hasMustChangePassword) {
            complaintDB.run(
              'ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0',
              (mustErr) => {
                if (mustErr) {
                  console.error('Error migrating users table (must_change_password):', mustErr.message);
                }
                maybeFinish();
              }
            );
            return;
          }

          maybeFinish();
        });
      });
    };

    if (!needsRoleMigration) {
      createAndMigrateColumns();
      return;
    }

    complaintDB.serialize(() => {
      complaintDB.run('PRAGMA foreign_keys = OFF');
      complaintDB.run('BEGIN TRANSACTION');
      complaintDB.run('ALTER TABLE users RENAME TO users_old', (renameErr) => {
        if (renameErr) {
          console.error('Error preparing users migration:', renameErr.message);
          complaintDB.run('ROLLBACK');
          complaintDB.run('PRAGMA foreign_keys = ON');
          return;
        }

        complaintDB.run(usersQuery, (createErr) => {
          if (createErr) {
            console.error('Error creating migrated users table:', createErr.message);
            complaintDB.run('ROLLBACK');
            complaintDB.run('PRAGMA foreign_keys = ON');
            return;
          }

          complaintDB.run(
            `INSERT INTO users (id, organization_id, department_id, full_name, email, password, must_change_password, status, role, created_at, updated_at)
             SELECT
               id,
               organization_id,
               department_id,
               full_name,
               email,
               password,
               COALESCE(must_change_password, 0),
               status,
               CASE WHEN role = 'admin' THEN 'super_admin' ELSE role END,
               created_at,
               updated_at
             FROM users_old`,
            (copyErr) => {
              if (copyErr) {
                console.error('Error copying users data during migration:', copyErr.message);
                complaintDB.run('ROLLBACK');
                complaintDB.run('PRAGMA foreign_keys = ON');
                return;
              }

              complaintDB.run('DROP TABLE users_old', (dropErr) => {
                if (dropErr) {
                  console.error('Error finalizing users migration:', dropErr.message);
                  complaintDB.run('ROLLBACK');
                  complaintDB.run('PRAGMA foreign_keys = ON');
                  return;
                }

                complaintDB.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    console.error('Error committing users migration:', commitErr.message);
                    complaintDB.run('ROLLBACK');
                  } else {
                    console.log('Users table migrated successfully (role + must_change_password)');
                  }
                  complaintDB.run('PRAGMA foreign_keys = ON');
                });
              });
            }
          );
        });
      });
    });
  });
};

export const CreateRevokedTokensTable = () => {
  complaintDB.run(revokedTokensQuery, (err) => {
    if (err) {
      console.error('Error creating revoked_tokens table:', err.message);
    } else {
      console.log('Revoked tokens table created or already exists');
    }
  });
};

export const registerUser = (req, res) => {
  const {
    organization_id = null,
    department_id = null,
    full_name,
    email,
    password,
    status = 'active'
  } = req.body;

  if (!full_name || !email || !password) {
    return sendError(res, 400, 'full_name, email, and password are required');
  }

  complaintDB.get(fetchUserByEmailQuery, [email], (findErr, existingUser) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to verify user email', findErr.message);
    }
    if (existingUser) {
      return sendError(res, 409, 'Email already registered');
    }

    complaintDB.run(
      createUserQuery,
      [organization_id, department_id, full_name, email, password, 0, status, 'user'],
      function onCreate(createErr) {
        if (createErr) {
          return sendError(res, 500, 'Failed to register user', createErr.message);
        }

        complaintDB.get(fetchUserByIdQuery, [this.lastID], async (getErr, userRow) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch registered user', getErr.message);
          }
          if (!userRow) {
            return sendError(res, 500, 'Registered user could not be loaded');
          }

          const safeUser = sanitizeUser(userRow);
          if (!safeUser?.id || !safeUser?.email) {
            return sendError(res, 500, 'Registered user payload is incomplete');
          }

          let token;
          try {
            token = await generateToken(safeUser.id);
          } catch (tokenErr) {
            return sendError(res, 500, 'Failed to generate token', tokenErr.message);
          }

          return sendSuccess(res, 201, 'User registered successfully', { user: safeUser, token });
        });
      }
    );
  });
};

export const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'email and password are required');
  }

  complaintDB.get(fetchUserByEmailQuery, [email], async (err, userRow) => {
    if (err) {
      return sendError(res, 500, 'Failed to login user', err.message);
    }
    if (!userRow) {
      return sendError(res, 401, 'Invalid email or password');
    }

    try {
      const isPasswordValid = await bcrypt.compare(password, userRow.password);
      if (!isPasswordValid) {
        return sendError(res, 401, 'Invalid email or password');
      }

      const safeUser = sanitizeUser(userRow);
      let token;
      try {
        token = await generateToken(safeUser.id);
      } catch (tokenErr) {
        return sendError(res, 500, 'Failed to generate token', tokenErr.message);
      }

      return sendSuccess(res, 200, 'Login successful', { user: safeUser, token });
    } catch (compareErr) {
      return sendError(res, 500, 'Failed to verify password', compareErr.message);
    }
  });
};

export const forgotPassword = (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const { new_password } = req.body;

  if (!email || !new_password) {
    return sendError(res, 400, 'email and new_password are required');
  }

  complaintDB.get(fetchUserByEmailQuery, [email], (err, userRow) => {
    if (err) {
      return sendError(res, 500, 'Failed to process forgot password request', err.message);
    }
    if (!userRow) {
      return sendError(res, 404, 'No account found for that email address');
    }

    complaintDB.run(updateOwnPasswordQuery, [new_password, userRow.id], async function onUpdate(updateErr) {
      if (updateErr) {
        return sendError(res, 500, 'Failed to reset password', updateErr.message);
      }

      complaintDB.get(fetchUserByIdQuery, [userRow.id], async (getErr, updatedUser) => {
        if (getErr) {
          return sendError(res, 500, 'Password reset but failed to load user', getErr.message);
        }
        if (!updatedUser) {
          return sendError(res, 404, 'Password reset but user not found');
        }

        try {
          const token = await generateToken(updatedUser.id);
          return sendSuccess(res, 200, 'Password reset successfully', {
            user: sanitizeUser(updatedUser),
            token
          });
        } catch (tokenErr) {
          return sendError(res, 500, 'Password reset but failed to generate token', tokenErr.message);
        }
      });
    });
  });
};

export const loginWithGoogle = async (req, res) => {
  const credential = String(req.body?.credential || '').trim();

  if (!credential) {
    return sendError(res, 400, 'credential is required');
  }

  let googleProfile;
  try {
    googleProfile = await verifyGoogleCredential(credential);
  } catch (error) {
    return sendError(res, 401, 'Google sign-in failed', error.message);
  }

  const email = String(googleProfile.email || '').trim().toLowerCase();
  const fullName = String(googleProfile.name || email.split('@')[0] || 'Google User').trim();

  complaintDB.get(fetchUserByEmailQuery, [email], async (findErr, existingUser) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to check Google account', findErr.message);
    }

    const finalizeLogin = async (userRow) => {
      if (!userRow) {
        return sendError(res, 404, 'User not found after Google sign-in');
      }
      if (String(userRow.status || '').toLowerCase() !== 'active') {
        return sendError(res, 403, 'This account is inactive');
      }

      try {
        const token = await generateToken(userRow.id);
        return sendSuccess(res, 200, 'Google login successful', {
          user: sanitizeUser(userRow),
          token
        });
      } catch (tokenErr) {
        return sendError(res, 500, 'Failed to generate token', tokenErr.message);
      }
    };

    if (existingUser) {
      return finalizeLogin(existingUser);
    }

    let placeholderPassword;
    try {
      placeholderPassword = await bcrypt.hash(randomUUID(), 10);
    } catch (hashErr) {
      return sendError(res, 500, 'Failed to prepare Google account', hashErr.message);
    }

    complaintDB.run(
      createUserQuery,
      [null, null, fullName, email, placeholderPassword, 0, 'active', 'user'],
      function onCreate(createErr) {
        if (createErr) {
          return sendError(res, 500, 'Failed to create Google user', createErr.message);
        }

        complaintDB.get(fetchUserByIdQuery, [this.lastID], async (getErr, userRow) => {
          if (getErr) {
            return sendError(res, 500, 'Google user created but failed to reload user', getErr.message);
          }
          return finalizeLogin(userRow);
        });
      }
    );
  });
};

export const logoutUser = (req, res) => {
  const token = req.token;
  if (!token) {
    return sendError(res, 400, 'No token provided');
  }

  complaintDB.run(createRevokedTokenQuery, [token], (err) => {
    if (err) {
      return sendError(res, 500, 'Failed to logout user', err.message);
    }
    return sendSuccess(res, 200, 'Logout successful');
  });
};

export const getCurrentUser = (req, res) => {
  complaintDB.get(fetchUserByIdQuery, [req.user.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch current user', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Current user not found');
    }
    return sendSuccess(res, 200, 'Current user retrieved successfully', sanitizeUser(row));
  });
};

export const createUser = (req, res) => {
  const {
    organization_id = null,
    department_id = null,
    full_name,
    email,
    password,
    status = 'active',
    role = 'user'
  } = req.body;

  if (!full_name || !email || !password) {
    return sendError(res, 400, 'full_name, email, and password are required');
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], (requesterErr, requesterRow) => {
    if (requesterErr) {
      return sendError(res, 500, 'Failed to fetch requester', requesterErr.message);
    }
    if (!requesterRow) {
      return sendError(res, 404, 'Requester not found');
    }

    const isOrgAdmin = requesterRow.role === 'org_admin';

    if (!isOrgAdmin) {
      return sendError(res, 403, 'Only org_admin can create users');
    }

    const finalOrganizationId = requesterRow.organization_id;
    const finalRole = 'user';

    if (!finalOrganizationId) {
      return sendError(res, 400, 'organization_id is required');
    }

    complaintDB.run(
      createUserQuery,
      [finalOrganizationId, department_id, full_name, email, password, 0, status, finalRole],
      function onCreate(err) {
        if (err) {
          return sendError(res, 500, 'Failed to create user', err.message);
        }

        complaintDB.get(fetchUserByIdQuery, [this.lastID], (getErr, row) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch user', getErr.message);
          }
          return sendSuccess(res, 201, 'User created successfully', sanitizeUser(row));
        });
      }
    );
  });
};

export const getAllUsers = (req, res) => {
  complaintDB.get(fetchUserByIdQuery, [req.user.id], (requesterErr, requesterRow) => {
    if (requesterErr) {
      return sendError(res, 500, 'Failed to fetch requester', requesterErr.message);
    }
    if (!requesterRow) {
      return sendError(res, 404, 'Requester not found');
    }

    if (requesterRow.role === 'org_admin') {
      complaintDB.all(fetchUsersByOrganizationQuery, [requesterRow.organization_id], (err, rows) => {
        if (err) {
          return sendError(res, 500, 'Failed to fetch users', err.message);
        }
        return sendSuccess(res, 200, 'Users retrieved successfully', rows.map(sanitizeUser));
      });
      return;
    }

    return sendError(res, 403, 'Access denied');
  });
};

export const getUserById = (req, res) => {
  complaintDB.get(fetchUserByIdQuery, [req.user.id], (requesterErr, requesterRow) => {
    if (requesterErr) {
      return sendError(res, 500, 'Failed to fetch requester', requesterErr.message);
    }
    if (!requesterRow) {
      return sendError(res, 404, 'Requester not found');
    }

    complaintDB.get(fetchUserByIdQuery, [req.params.id], (err, row) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch user', err.message);
      }
      if (!row) {
        return sendError(res, 404, 'User not found');
      }
      if (requesterRow.role !== 'org_admin') {
        return sendError(res, 403, 'Access denied');
      }
      if (String(requesterRow.organization_id) !== String(row.organization_id)) {
        return sendError(res, 403, 'Access denied');
      }
      return sendSuccess(res, 200, 'User retrieved successfully', sanitizeUser(row));
    });
  });
};

export const getUserByEmail = (req, res) => {
  complaintDB.get(fetchUserByIdQuery, [req.user.id], (requesterErr, requesterRow) => {
    if (requesterErr) {
      return sendError(res, 500, 'Failed to fetch requester', requesterErr.message);
    }
    if (!requesterRow) {
      return sendError(res, 404, 'Requester not found');
    }

    complaintDB.get(fetchUserByEmailQuery, [req.params.email], (err, row) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch user by email', err.message);
      }
      if (!row) {
        return sendError(res, 404, 'User not found');
      }
      if (requesterRow.role !== 'org_admin') {
        return sendError(res, 403, 'Access denied');
      }
      if (String(requesterRow.organization_id) !== String(row.organization_id)) {
        return sendError(res, 403, 'Access denied');
      }
      return sendSuccess(res, 200, 'User retrieved successfully', sanitizeUser(row));
    });
  });
};

export const updateUser = (req, res) => {
  const {
    organization_id = null,
    department_id = null,
    full_name,
    email,
    password,
    status = 'active',
    role = 'user'
  } = req.body;

  if (!full_name || !email || !password) {
    return sendError(res, 400, 'full_name, email, and password are required');
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], (requesterErr, requesterRow) => {
    if (requesterErr) {
      return sendError(res, 500, 'Failed to fetch requester', requesterErr.message);
    }
    if (!requesterRow) {
      return sendError(res, 404, 'Requester not found');
    }

    complaintDB.get(fetchUserByIdQuery, [req.params.id], (targetErr, targetRow) => {
      if (targetErr) {
        return sendError(res, 500, 'Failed to fetch target user', targetErr.message);
      }
      if (!targetRow) {
        return sendError(res, 404, 'User not found');
      }

      const isOrgAdmin = requesterRow.role === 'org_admin';
      if (!isOrgAdmin) {
        return sendError(res, 403, 'Access denied');
      }
      if (String(requesterRow.organization_id) !== String(targetRow.organization_id)) {
        return sendError(res, 403, 'Access denied');
      }
      if (targetRow.role !== 'user') {
        return sendError(res, 403, 'org_admin can only update users with role "user"');
      }

      const finalRole = 'user';
      const finalOrganizationId = requesterRow.organization_id;

      complaintDB.run(
        updateUserQuery,
        [finalOrganizationId, department_id, full_name, email, password, 0, status, finalRole, req.params.id],
        function onUpdate(err) {
          if (err) {
            return sendError(res, 500, 'Failed to update user', err.message);
          }

          if (this.changes === 0) {
            return sendError(res, 404, 'User not found');
          }

          complaintDB.get(fetchUserByIdQuery, [req.params.id], (getErr, row) => {
            if (getErr) {
              return sendError(res, 500, 'Failed to fetch updated user', getErr.message);
            }
            return sendSuccess(res, 200, 'User updated successfully', sanitizeUser(row));
          });
        }
      );
    });
  });
};

export const deleteUser = (req, res) => {
  complaintDB.get(fetchUserByIdQuery, [req.user.id], (requesterErr, requesterRow) => {
    if (requesterErr) {
      return sendError(res, 500, 'Failed to fetch requester', requesterErr.message);
    }
    if (!requesterRow) {
      return sendError(res, 404, 'Requester not found');
    }
    if (requesterRow.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can delete users');
    }

    complaintDB.get(fetchUserByIdQuery, [req.params.id], (targetErr, targetRow) => {
      if (targetErr) {
        return sendError(res, 500, 'Failed to fetch user', targetErr.message);
      }
      if (!targetRow) {
        return sendError(res, 404, 'User not found');
      }
      if (String(targetRow.organization_id) !== String(requesterRow.organization_id)) {
        return sendError(res, 403, 'Access denied');
      }
      if (targetRow.role !== 'user') {
        return sendError(res, 403, 'org_admin can only delete users with role "user"');
      }

      complaintDB.run(deleteUserQuery, [req.params.id], function onDelete(err) {
        if (err) {
          return sendError(res, 500, 'Failed to delete user', err.message);
        }

        return sendSuccess(res, 200, 'User deleted successfully', { id: req.params.id });
      });
    });
  });
};

export const updateUserRole = (req, res) => {
  if (req.user?.role === 'super_admin') {
    return sendError(res, 403, 'Super admin cannot manage user roles directly');
  }

  const { role } = req.body;

  if (!role) {
    return sendError(res, 400, 'role is required');
  }
  if (!['super_admin', 'org_admin', 'user'].includes(role)) {
    return sendError(res, 400, 'role must be super_admin, org_admin, or user');
  }

  complaintDB.run(updateUserRoleQuery, [role, req.params.id], function onUpdate(err) {
    if (err) {
      return sendError(res, 500, 'Failed to update user role', err.message);
    }
    if (this.changes === 0) {
      return sendError(res, 404, 'User not found');
    }

    complaintDB.get(fetchUserByIdQuery, [req.params.id], (getErr, row) => {
      if (getErr) {
        return sendError(res, 500, 'Failed to fetch updated user', getErr.message);
      }
      return sendSuccess(res, 200, 'User role updated successfully', sanitizeUser(row));
    });
  });
};

export const assignExistingUserToOrganization = (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();

  if (!email) {
    return sendError(res, 400, 'email is required');
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], (requesterErr, requesterRow) => {
    if (requesterErr) {
      return sendError(res, 500, 'Failed to fetch requester', requesterErr.message);
    }
    if (!requesterRow) {
      return sendError(res, 404, 'Requester not found');
    }
    if (requesterRow.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can assign existing users');
    }
    if (!requesterRow.organization_id) {
      return sendError(res, 400, 'Requester organization is required');
    }

    complaintDB.get(fetchUserByEmailQuery, [email], (findErr, targetRow) => {
      if (findErr) {
        return sendError(res, 500, 'Failed to find existing user', findErr.message);
      }
      if (!targetRow) {
        return sendError(res, 404, 'User with that email was not found');
      }
      if (targetRow.role !== 'user') {
        return sendError(res, 403, 'Only users with role "user" can be assigned to an organization');
      }
      if (Number(targetRow.id) === Number(req.user.id)) {
        return sendError(res, 400, 'You cannot assign yourself through this flow');
      }
      if (targetRow.organization_id && Number(targetRow.organization_id) === Number(requesterRow.organization_id)) {
        return sendError(res, 409, 'User already belongs to your organization');
      }
      if (targetRow.organization_id && Number(targetRow.organization_id) !== Number(requesterRow.organization_id)) {
        return sendError(res, 403, 'User already belongs to another organization');
      }

      complaintDB.run(
        assignUserToOrganizationQuery,
        [requesterRow.organization_id, targetRow.id],
        function onAssign(assignErr) {
          if (assignErr) {
            return sendError(res, 500, 'Failed to assign user to organization', assignErr.message);
          }

          complaintDB.get(fetchUserByIdQuery, [targetRow.id], (getErr, updatedRow) => {
            if (getErr) {
              return sendError(res, 500, 'User assigned but failed to reload user', getErr.message);
            }
            return sendSuccess(res, 200, 'Existing user assigned to organization successfully', sanitizeUser(updatedRow));
          });
        }
      );
    });
  });
};

export const changeOwnPassword = (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return sendError(res, 400, 'current_password and new_password are required');
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], async (err, userRow) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch user', err.message);
    }
    if (!userRow) {
      return sendError(res, 404, 'User not found');
    }

    try {
      const isPasswordValid = await bcrypt.compare(current_password, userRow.password);
      if (!isPasswordValid) {
        return sendError(res, 401, 'Current password is invalid');
      }
    } catch (compareErr) {
      return sendError(res, 500, 'Failed to verify password', compareErr.message);
    }

    complaintDB.run(updateOwnPasswordQuery, [new_password, req.user.id], async function onUpdate(updateErr) {
      if (updateErr) {
        return sendError(res, 500, 'Failed to update password', updateErr.message);
      }

      complaintDB.get(fetchUserByIdQuery, [req.user.id], async (getErr, updatedUser) => {
        if (getErr) {
          return sendError(res, 500, 'Password updated but failed to load user', getErr.message);
        }
        if (!updatedUser) {
          return sendError(res, 404, 'Password updated but user not found');
        }

        try {
          const token = await generateToken(updatedUser.id);
          return sendSuccess(res, 200, 'Password updated successfully', {
            user: sanitizeUser(updatedUser),
            token
          });
        } catch (tokenErr) {
          return sendError(res, 500, 'Password updated but failed to generate token', tokenErr.message);
        }
      });
    });
  });
};
