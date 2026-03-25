// user.controller controller: handles HTTP request/response flow for this module.
import bcrypt from 'bcrypt';
import { randomUUID, createHash, randomInt } from 'node:crypto';
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEntry, buildAuditMetadata } from '../utils/audit.js';
import generateToken from '../middleware/generateToken.js';
import { sendEmail } from '../services/email.service.js';
import { selectPlatformSettings } from '../model/platformSettings.model.js';

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
  updateOwnEmailQuery,
  updateOwnPasswordQuery,
  emailVerificationTokensQuery,
  insertEmailVerificationTokenQuery,
  selectActiveEmailVerificationTokenQuery,
  consumeEmailVerificationTokenQuery,
  invalidateEmailVerificationTokensByUserQuery,
  markUserEmailVerifiedQuery

} from '../model/user.model.js';
import { selectOrganizationByJoinCode } from '../model/organization.model.js';
import { selectDepartmentById } from '../model/department.model.js';
import {
  passwordResetTokensQuery,
  insertPasswordResetCodeQuery,
  selectActivePasswordResetCodeQuery,
  consumePasswordResetTokenQuery,
  invalidatePasswordResetTokensByUserQuery
} from '../model/passwordReset.model.js';
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const PASSWORD_RESET_TTL_MS = Number(process.env.PASSWORD_RESET_TTL_MS || 15 * 60 * 1000);const EMAIL_VERIFICATION_TTL_MS = Number(process.env.EMAIL_VERIFICATION_TTL_MS || 24 * 60 * 60 * 1000);
const EMAIL_VERIFICATION_URL = process.env.EMAIL_VERIFICATION_URL || '';
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const previewPasswordResetCodeEnabled = process.env.PASSWORD_RESET_PREVIEW === 'true';

const getPlatformSettings = () =>
  new Promise((resolve) => {
    complaintDB.get(selectPlatformSettings, [], (err, row) => {
      if (err) return resolve(null);
      return resolve(row || null);
    });
  });

const buildResetCodePayload = (code, expiresAt) => {
  const payload = { expires_at: expiresAt };
  if (previewPasswordResetCodeEnabled && code) {
    payload.reset_code_preview = code;
  }
  return payload;
};


const buildEmailVerificationLink = (token, email) => {
  if (!EMAIL_VERIFICATION_URL) {
    return '';
  }

  const separator = EMAIL_VERIFICATION_URL.includes('?') ? '&' : '?';
  return `${EMAIL_VERIFICATION_URL}${separator}token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
};

const sendVerificationEmail = async ({ email, fullName, token, expiresAt }) => {
  const verificationLink = buildEmailVerificationLink(token, email);
  const displayName = fullName || 'User';

  return sendEmail({
    to: email,
    subject: 'Verify your email address',
    text: `Hello ${displayName}, please verify your email. Verification link: ${verificationLink} This link expires at ${expiresAt}.`,
    html: `
      <h2>Verify your email address</h2>
      <p>Hello ${displayName},</p>
      <p>Please click the link below to verify your email address:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <p>This link expires at ${expiresAt}.</p>
    `,
  });
};

const generatePasswordResetCode = () => String(randomInt(0, 1000000)).padStart(6, '0');

const sendPasswordResetEmail = async ({ email, fullName, code, expiresAt }) => {
  const displayName = fullName || 'User';

  return sendEmail({
    to: email,
    subject: 'Your password reset code',
    text: `Hello ${displayName}, your password reset code is ${code}. This code expires at ${expiresAt}. If you did not request this, you can ignore this email.`,
    html: `
      <h2>Password reset code</h2>
      <p>Hello ${displayName},</p>
      <p>You requested a password reset. Use the code below to continue:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.35em; margin: 20px 0;">${code}</p>
      <p>This link expires at ${expiresAt}.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
};

//create and send email verification token, ensuring any existing tokens for the user are invalidated

const createAndSendEmailVerification = (userRow) => {
  return new Promise((resolve, reject) => {
    const rawToken = randomUUID();
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS).toISOString();

    complaintDB.serialize(() => {
      complaintDB.run(invalidateEmailVerificationTokensByUserQuery, [userRow.id], (invalidateErr) => {
        if (invalidateErr) {
          console.error('Failed to invalidate existing email verification tokens:', invalidateErr.message);
        }
      });

      complaintDB.run(insertEmailVerificationTokenQuery, [userRow.id, hashedToken, expiresAt], async (insertErr) => {
        if (insertErr) {
          reject(insertErr);
          return;
        }

        try {
          await sendVerificationEmail({
            email: userRow.email,
            fullName: userRow.full_name,
            token: rawToken,
            expiresAt,
          });

          resolve({
            expiresAt,
          });
        } catch (emailErr) {
          reject(emailErr);
        }
      });
    });
  });
};


const buildRequestMetadata = (req, organizationId = null) => {
  const headers = req.headers || {};
  const forwardedFor = headers['x-forwarded-for'];
  return {
    organization_id: organizationId,
    request_path: req.originalUrl || '',
    request_method: req.method || 'POST',
    request_ip: forwardedFor?.split(',')[0]?.trim() || req.ip || null,
    request_user_agent: headers['user-agent'] || null,
    requested_at: new Date().toISOString()
  };
};

const isDuplicateUserEmailError = (error) =>
  String(error?.message || '').includes('SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email');

const PANEL_ASSIGNABLE_ROLES = ['org_admin', 'user'];

const getGoogleClientId = () =>
  process.env.GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_OAUTH_CLIENT_ID ||
  '';

const isAdminFamilyRole = (role) => role === 'super_admin' || role === 'org_admin';

const normalizePanelRole = (role) => {
  const normalizedRole = String(role || 'user').trim();
  return PANEL_ASSIGNABLE_ROLES.includes(normalizedRole) ? normalizedRole : null;
};

const canAccessUserRecord = (requesterRow, targetRow) => {
  if (!requesterRow || !targetRow || !isAdminFamilyRole(requesterRow.role)) {
    return false;
  }

  if (requesterRow.role === 'super_admin') {
    return true;
  }

  return String(requesterRow.organization_id) === String(targetRow.organization_id);
};

const canManageUserRecord = (requesterRow, targetRow) => {
  if (!canAccessUserRecord(requesterRow, targetRow)) {
    return false;
  }

  if (!PANEL_ASSIGNABLE_ROLES.includes(targetRow.role)) {
    return false;
  }

  return true;
};

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
          const hasEmailVerified = (columns || []).some((col) => col.name === 'email_verified');
          const hasEmailVerifiedAt = (columns || []).some((col) => col.name === 'email_verified_at');
          const hasMustChangePassword = (columns || []).some((col) => col.name === 'must_change_password');

          const columnSteps = [];
          if (!hasDepartmentId) {
            columnSteps.push({
              sql: 'ALTER TABLE users ADD COLUMN department_id INTEGER',
              errorMessage: 'Error migrating users table (department_id):'
            });
          }
          if (!hasEmailVerified) {
            columnSteps.push({
              sql: 'ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0',
              errorMessage: 'Error migrating users table (email_verified):'
            });
          }
          if (!hasEmailVerifiedAt) {
            columnSteps.push({
              sql: 'ALTER TABLE users ADD COLUMN email_verified_at DATETIME DEFAULT NULL',
              errorMessage: 'Error migrating users table (email_verified_at):'
            });
          }
          if (!hasMustChangePassword) {
            columnSteps.push({
              sql: 'ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0',
              errorMessage: 'Error migrating users table (must_change_password):'
            });
          }


          // const hasDepartmentId = (columns || []).some((col) => col.name === 'department_id');
          // const hasMustChangePassword = (columns || []).some((col) => col.name === 'must_change_password');

          // const columnSteps = [];
          // if (!hasDepartmentId) {
          //   columnSteps.push({
          //     sql: 'ALTER TABLE users ADD COLUMN department_id INTEGER',
          //     errorMessage: 'Error migrating users table (department_id):'
          //   });
          // }
          // if (!hasMustChangePassword) {
          //   columnSteps.push({
          //     sql: 'ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0',
          //     errorMessage: 'Error migrating users table (must_change_password):'
          //   });
          // }


          const runStep = (index) => {
            if (index >= columnSteps.length) {
              console.log('Users table created or already exists');
              return;
            }

            const { sql: stepSql, errorMessage } = columnSteps[index];
            complaintDB.run(stepSql, (alterErr) => {
              if (alterErr) {
                console.error(errorMessage, alterErr.message);
              }
              runStep(index + 1);
            });
          };

          runStep(0);
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

export const CreatePasswordResetTokensTable = () => {
  complaintDB.run(passwordResetTokensQuery, (err) => {
    if (err) {
      console.error('Error creating password_reset_tokens table:', err.message);
      return;
    }

    complaintDB.all('PRAGMA table_info(password_reset_tokens)', [], (schemaErr, columns) => {
      if (schemaErr) {
        console.error('Error inspecting password_reset_tokens table:', schemaErr.message);
        return;
      }

      const hasTokenColumn = (columns || []).some((col) => col.name === 'token');
      const hasCodeColumn = (columns || []).some((col) => col.name === 'code');

      const alterStatements = [];
      if (!hasTokenColumn) {
        alterStatements.push('ALTER TABLE password_reset_tokens ADD COLUMN token TEXT DEFAULT NULL');
      }
      if (!hasCodeColumn) {
        alterStatements.push('ALTER TABLE password_reset_tokens ADD COLUMN code TEXT DEFAULT NULL');
      }

      const runNext = (index = 0) => {
        if (index >= alterStatements.length) {
          console.log('Password reset tokens table ready');
          return;
        }

        complaintDB.run(alterStatements[index], (alterErr) => {
          if (alterErr) {
            console.error('Error updating password_reset_tokens table:', alterErr.message);
            return;
          }
          runNext(index + 1);
        });
      };

      runNext();
    });
  });
};


export const requestPasswordReset = (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    return sendError(res, 400, 'email is required');
  }

  complaintDB.get(fetchUserByEmailQuery, [email], (findErr, userRow) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to process password reset request', findErr.message);
    }
    if (!userRow) {
      return sendSuccess(res, 200, 'Password reset instructions will be sent if the account exists');
    }

    const rawCode = generatePasswordResetCode();
    const hashedCode = hashToken(rawCode);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();

    complaintDB.serialize(() => {
      complaintDB.run(invalidatePasswordResetTokensByUserQuery, [userRow.id], (invalidateErr) => {
        if (invalidateErr) {
          console.error('Failed to invalidate existing reset codes:', invalidateErr.message);
        }
      });
      complaintDB.run(insertPasswordResetCodeQuery, [userRow.id, hashedCode, expiresAt], (insertErr) => {
        if (insertErr) {
          return sendError(res, 500, 'Failed to generate password reset code', insertErr.message);
        }

        void sendPasswordResetEmail({
          email: userRow.email,
          fullName: userRow.full_name,
          code: rawCode,
          expiresAt,
        });

        if (previewPasswordResetCodeEnabled) {
          console.log(`Password reset code for ${email}: ${rawCode}`);
        }

        return sendSuccess(res, 200, 'Password reset code sent', buildResetCodePayload(rawCode, expiresAt));
      });
    });
  });
};

export const CreateEmailVerificationTokensTable = () => {
  complaintDB.run(emailVerificationTokensQuery, (err) => {
    if (err) {
      console.error('Error creating email_verification_tokens table:', err.message);
    } else {
      console.log('Email verification tokens table created or already exists');
    }
  });
};

export const resetPasswordWithCode = (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || req.body?.token || '').trim();
  const newPassword = req.body?.new_password;

  if (!email || !code || !newPassword) {
    return sendError(res, 400, 'email, code, and new_password are required');
  }

  const hashedCode = hashToken(code);
  const now = new Date().toISOString();

  complaintDB.get(selectActivePasswordResetCodeQuery, [hashedCode, now], (tokenErr, tokenRow) => {
    if (tokenErr) {
      return sendError(res, 500, 'Failed to verify reset code', tokenErr.message);
    }
    if (!tokenRow) {
      return sendError(res, 400, 'Invalid or expired reset code');
    }

    complaintDB.get(fetchUserByIdQuery, [tokenRow.user_id], (userErr, userRow) => {
      if (userErr) {
        return sendError(res, 500, 'Failed to load user for password reset', userErr.message);
      }
      if (!userRow || String(userRow.email).toLowerCase() !== email) {
        return sendError(res, 403, 'Invalid reset details');
      }
      if (!Number(userRow.email_verified)) {
        return sendError(res, 403, 'Email must be verified before resetting password');
      }

      complaintDB.run(updateOwnPasswordQuery, [newPassword, userRow.id], (updateErr) => {
        if (updateErr) {
          return sendError(res, 500, 'Failed to update password', updateErr.message);
        }

        complaintDB.run(consumePasswordResetTokenQuery, [tokenRow.id], (consumeErr) => {
          if (consumeErr) {
            console.error('Failed to mark reset code as consumed:', consumeErr.message);
          }

          const finalize = async () => {
            const safeUser = sanitizeUser(userRow);
            const authToken = await generateToken(userRow.id);
            return sendSuccess(res, 200, 'Password reset successfully', { user: safeUser, token: authToken });
          };

          finalize().catch((finalErr) =>
            sendError(res, 500, 'Password reset but failed to generate token', finalErr.message)
          );
        });
      });
    });
  });
};

export const resetPasswordWithToken = resetPasswordWithCode;


export const registerUser = (req, res) => {
  const {
    organization_id = null,
    department_id = null,
    full_name,
    email,
    password,
    status = 'active'
  } = req.body;

  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!full_name || !normalizedEmail || !password) {
    return sendError(res, 400, 'full_name, email, and password are required');
  }

  complaintDB.get(fetchUserByEmailQuery, [normalizedEmail], (findErr, existingUser) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to verify user email', findErr.message);
    }
    if (existingUser) {
      return sendError(res, 409, 'Email already registered');
    }

    getPlatformSettings()
      .then((settings) => {
        const requireEmailVerification = Number(settings?.require_email_verification ?? 1) === 1;
        const emailVerifiedValue = requireEmailVerification ? 0 : 1;
        const emailVerifiedAt = requireEmailVerification ? null : new Date().toISOString();

        complaintDB.run(
          `INSERT INTO users (
            organization_id,
            department_id,
            full_name,
            email,
            password,
            email_verified,
            email_verified_at,
            must_change_password,
            status,
            role
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            organization_id,
            department_id,
            full_name,
            normalizedEmail,
            password,
            emailVerifiedValue,
            emailVerifiedAt,
            0,
            status,
            'user'
          ],
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

              if (requireEmailVerification) {
                try {
                  await createAndSendEmailVerification(userRow);
                } catch (verificationErr) {
                  return sendError(res, 500, 'User created but failed to send verification email', verificationErr.message);
                }
              }

              return sendSuccess(
                res,
                201,
                requireEmailVerification
                  ? 'User registered successfully. Please verify your email before logging in.'
                  : 'User registered successfully.',
                {
                  user: sanitizeUser(userRow),
                }
              );
            });
          }
        );
      })
      .catch((settingsErr) => sendError(res, 500, 'Failed to load platform settings', settingsErr.message));
  });
};

export const registerUserWithJoinCode = (req, res) => {
  const {
    join_code,
    department_id = null,
    full_name,
    email,
    password,
    status = 'active'
  } = req.body;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedJoinCode = String(join_code || '').trim().toUpperCase();
  const normalizedDepartmentId =
    department_id === null || department_id === undefined || department_id === ''
      ? null
      : Number(department_id);

  if (!full_name || !normalizedEmail || !password || !normalizedJoinCode) {
    return sendError(res, 400, 'full_name, email, password, and join_code are required');
  }
  if (normalizedDepartmentId !== null && (!Number.isInteger(normalizedDepartmentId) || normalizedDepartmentId <= 0)) {
    return sendError(res, 400, 'department_id must be a valid department id when provided');
  }

  complaintDB.get(fetchUserByEmailQuery, [normalizedEmail], (findErr, existingUser) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to verify user email', findErr.message);
    }
    if (existingUser) {
      return sendError(res, 409, 'Email already registered');
    }

    complaintDB.get(selectOrganizationByJoinCode, [normalizedJoinCode], (orgErr, organizationRow) => {
      if (orgErr) {
        return sendError(res, 500, 'Failed to validate join code', orgErr.message);
      }
      if (!organizationRow) {
        return sendError(res, 404, 'Invalid join code');
      }
      if (!Number(organizationRow.self_signup_enabled ?? 1)) {
        return sendError(res, 403, 'Self-signup is disabled for this organization');
      }

      const createJoinedUser = async (resolvedDepartmentId = null) => {
        try {
          const settings = await getPlatformSettings();
          const requireEmailVerification = Number(settings?.require_email_verification ?? 1) === 1;
          const emailVerifiedValue = requireEmailVerification ? 0 : 1;
          const emailVerifiedAt = requireEmailVerification ? null : new Date().toISOString();

          complaintDB.run(
            `INSERT INTO users (
              organization_id,
              department_id,
              full_name,
              email,
              password,
              email_verified,
              email_verified_at,
              must_change_password,
              status,
              role
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              organizationRow.organization_id,
              resolvedDepartmentId,
              full_name,
              normalizedEmail,
              password,
              emailVerifiedValue,
              emailVerifiedAt,
              0,
              status,
              'user'
            ],
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

                if (requireEmailVerification) {
                  try {
                    await createAndSendEmailVerification(userRow);
                  } catch (verificationErr) {
                    return sendError(res, 500, 'User created but failed to send verification email', verificationErr.message);
                  }
                }

                return sendSuccess(
                  res,
                  201,
                  requireEmailVerification
                    ? 'User registered successfully. Please verify your email before logging in.'
                    : 'User registered successfully.',
                  {
                    user: sanitizeUser(userRow),
                    organization: {
                      organization_id: organizationRow.organization_id,
                      name: organizationRow.name
                    }
                  }
                );
              });
            }
          );
        } catch (settingsErr) {
          return sendError(res, 500, 'Failed to load platform settings', settingsErr.message);
        }
      };

      if (normalizedDepartmentId === null) {
        return createJoinedUser(null);
      }

      complaintDB.get(selectDepartmentById, [normalizedDepartmentId], (departmentErr, departmentRow) => {
        if (departmentErr) {
          return sendError(res, 500, 'Failed to validate department', departmentErr.message);
        }
        if (!departmentRow) {
          return sendError(res, 404, 'Selected department not found');
        }
        if (String(departmentRow.organization_id) !== String(organizationRow.organization_id)) {
          return sendError(res, 400, 'Selected department does not belong to this organization');
        }

        return createJoinedUser(normalizedDepartmentId);
      });
    });
  });
};



// export const registerUser = (req, res) => {
//   const {
//     organization_id = null,
//     department_id = null,
//     full_name,
//     email,
//     password,
//     status = 'active'
//   } = req.body;

//   if (!full_name || !email || !password) {
//     return sendError(res, 400, 'full_name, email, and password are required');
//   }

//   complaintDB.get(fetchUserByEmailQuery, [email], (findErr, existingUser) => {
//     if (findErr) {
//       return sendError(res, 500, 'Failed to verify user email', findErr.message);
//     }
//     if (existingUser) {
//       return sendError(res, 409, 'Email already registered');
//     }

//     complaintDB.run(
//       createUserQuery,
//       [organization_id, department_id, full_name, email, password, 0, status, 'user'],
//       function onCreate(createErr) {
//         if (createErr) {
//           return sendError(res, 500, 'Failed to register user', createErr.message);
//         }

//         complaintDB.get(fetchUserByIdQuery, [this.lastID], async (getErr, userRow) => {
//           if (getErr) {
//             return sendError(res, 500, 'Failed to fetch registered user', getErr.message);
//           }
//           if (!userRow) {
//             return sendError(res, 500, 'Registered user could not be loaded');
//           }

//           const safeUser = sanitizeUser(userRow);
//           if (!safeUser?.id || !safeUser?.email) {
//             return sendError(res, 500, 'Registered user payload is incomplete');
//           }

//           let token;
//           try {
//             token = await generateToken(safeUser.id);
//           } catch (tokenErr) {
//             return sendError(res, 500, 'Failed to generate token', tokenErr.message);
//           }

//           return sendSuccess(res, 201, 'User registered successfully', { user: safeUser, token });
//         });
//       }
//     );
//   });
// };


export const verifyEmail = (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const token = String(req.body?.token || '').trim();

  if (!email || !token) {
    return sendError(res, 400, 'email and token are required');
  }

  const hashedToken = hashToken(token);
  const now = new Date().toISOString();

  complaintDB.get(selectActiveEmailVerificationTokenQuery, [hashedToken, now], (tokenErr, tokenRow) => {
    if (tokenErr) {
      return sendError(res, 500, 'Failed to verify email token', tokenErr.message);
    }
    if (!tokenRow) {
      return sendError(res, 400, 'Invalid or expired verification token');
    }

    complaintDB.get(fetchUserByIdQuery, [tokenRow.user_id], (userErr, userRow) => {
      if (userErr) {
        return sendError(res, 500, 'Failed to load user for email verification', userErr.message);
      }
      if (!userRow || String(userRow.email).toLowerCase() !== email) {
        return sendError(res, 403, 'Invalid verification details');
      }

      complaintDB.run(markUserEmailVerifiedQuery, [userRow.id], (verifyErr) => {
        if (verifyErr) {
          return sendError(res, 500, 'Failed to mark email as verified', verifyErr.message);
        }

        complaintDB.run(consumeEmailVerificationTokenQuery, [tokenRow.id], (consumeErr) => {
          if (consumeErr) {
            console.error('Failed to mark verification token as consumed:', consumeErr.message);
          }

          return sendSuccess(res, 200, 'Email verified successfully');
        });
      });
    });
  });
};


export const resendVerificationEmail = (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();

  if (!email) {
    return sendError(res, 400, 'email is required');
  }

  complaintDB.get(fetchUserByEmailQuery, [email], async (findErr, userRow) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to process resend verification request', findErr.message);
    }

    if (!userRow) {
      return sendSuccess(res, 200, 'If the account exists and is not yet verified, a verification email will be sent');
    }

    if (Number(userRow.email_verified)) {
      return sendSuccess(res, 200, 'If the account exists and is not yet verified, a verification email will be sent');
    }

    try {
      await createAndSendEmailVerification(userRow);
      return sendSuccess(res, 200, 'If the account exists and is not yet verified, a verification email will be sent');
    } catch (verificationErr) {
      return sendError(res, 500, 'Failed to resend verification email', verificationErr.message);
    }
  });
};


//loginuser
export const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'email and password are required');
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();

  complaintDB.get(fetchUserByEmailQuery, [normalizedEmail], async (err, userRow) => {
    if (err) {
      return sendError(res, 500, 'Failed to login user', err.message);
    }

    if (!userRow) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const settings = await getPlatformSettings();
    const requireEmailVerification = Number(settings?.require_email_verification ?? 1) === 1;
    if (requireEmailVerification && !Number(userRow.email_verified)) {
      return sendError(res, 403, 'Please verify your email before logging in');
    }

    try {
      const isPasswordValid = await bcrypt.compare(password, userRow.password);
      if (!isPasswordValid) {
        return sendError(res, 401, 'Invalid email or password');
      }

      // Block pending users from logging in
      if (userRow.status === 'pending') {
        return sendError(res, 403, 'Your account is pending approval from your organization admin. Please wait for approval before logging in.');
      }

      // Block inactive users
      if (userRow.status === 'inactive') {
        return sendError(res, 403, 'Your account is inactive. Please contact your organization admin.');
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
      const settings = await getPlatformSettings();
      const requireEmailVerification = Number(settings?.require_email_verification ?? 1) === 1;
      if (requireEmailVerification && !Number(userRow.email_verified)) {
        return sendError(res, 403, 'Please verify your email before logging in');
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
      [null, null, fullName, email, placeholderPassword, 1, 0, 'active', 'user'],
      function onCreate(createErr) {
        if (createErr) {
          return sendError(res, 500, 'Failed to create Google user', createErr.message);
        }

        complaintDB.get(fetchUserByIdQuery, [this.lastID], async (getErr, userRow) => {
          if (getErr) {
            return sendError(res, 500, 'Google user created but failed to reload user', getErr.message);
          }
          complaintDB.run(markUserEmailVerifiedQuery, [userRow.id], (verifyErr) => {
            if (verifyErr) {
              console.error('Failed to mark Google user email verified:', verifyErr.message);
            }
          });
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
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!full_name || !normalizedEmail || !password) {
    return sendError(res, 400, 'full_name, email, and password are required');
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], (requesterErr, requesterRow) => {
    if (requesterErr) {
      return sendError(res, 500, 'Failed to fetch requester', requesterErr.message);
    }
    if (!requesterRow) {
      return sendError(res, 404, 'Requester not found');
    }

    if (!isAdminFamilyRole(requesterRow.role)) {
      return sendError(res, 403, 'Only admins can create users');
    }

    const finalRole = normalizePanelRole(role);
    if (!finalRole) {
      return sendError(res, 400, 'role must be org_admin or user');
    }

    const finalOrganizationId =
      requesterRow.role === 'super_admin'
        ? (organization_id === null || organization_id === '' ? null : Number(organization_id))
        : requesterRow.organization_id;

    if (!finalOrganizationId) {
      return sendError(res, 400, 'organization_id is required');
    }

    complaintDB.get(fetchUserByEmailQuery, [normalizedEmail], (emailErr, existingUser) => {
      if (emailErr) {
        return sendError(res, 500, 'Failed to verify user email', emailErr.message);
      }
      if (existingUser) {
        return sendError(res, 409, 'Email already exists');
      }

      const mustChangePassword = requesterRow.role === 'org_admin' ? 1 : 0;

      complaintDB.run(
        createUserQuery,
        [finalOrganizationId, department_id, full_name, normalizedEmail, password, mustChangePassword, status, finalRole],
        function onCreate(err) {
          if (err) {
            if (isDuplicateUserEmailError(err)) {
              return sendError(res, 409, 'Email already exists');
            }
            return sendError(res, 500, 'Failed to create user', err.message);
          }

          complaintDB.get(fetchUserByIdQuery, [this.lastID], (getErr, row) => {
            if (getErr) {
              return sendError(res, 500, 'Failed to fetch user', getErr.message);
            }
            const auditMeta = buildAuditMetadata(req);
            auditMeta.target_email = row.email;
            auditMeta.assigned_role = row.role;
            auditMeta.organization_id = row.organization_id;
            void logAuditEntry(req, {
              action: 'create_user',
              targetTable: 'users',
              targetId: row.id,
              metadata: auditMeta
            }).catch((_) => {
              console.error('Failed to record audit log for user creation');
            });
            return sendSuccess(res, 201, 'User created successfully', sanitizeUser(row));
          });
        }
      );
    });
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

    if (requesterRow.role === 'super_admin') {
      complaintDB.all(fetchUsersQuery, [], (err, rows) => {
        if (err) {
          return sendError(res, 500, 'Failed to fetch users', err.message);
        }
        return sendSuccess(res, 200, 'Users retrieved successfully', rows.map(sanitizeUser));
      });
      return;
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
      if (!canAccessUserRecord(requesterRow, row)) {
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
      if (!canAccessUserRecord(requesterRow, row)) {
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
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!full_name || !normalizedEmail || !password) {
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

      if (!isAdminFamilyRole(requesterRow.role)) {
        return sendError(res, 403, 'Access denied');
      }
      if (!canManageUserRecord(requesterRow, targetRow)) {
        return sendError(res, 403, 'Access denied');
      }

      const finalRole = normalizePanelRole(role);
      if (!finalRole) {
        return sendError(res, 400, 'role must be org_admin or user');
      }

      const finalOrganizationId =
        requesterRow.role === 'super_admin'
          ? (organization_id === null || organization_id === '' ? targetRow.organization_id : Number(organization_id))
          : requesterRow.organization_id;

      if (!finalOrganizationId) {
        return sendError(res, 400, 'organization_id is required');
      }

      complaintDB.get(fetchUserByEmailQuery, [normalizedEmail], (emailErr, existingUser) => {
        if (emailErr) {
          return sendError(res, 500, 'Failed to verify user email', emailErr.message);
        }
        if (existingUser && Number(existingUser.id) !== Number(req.params.id)) {
          return sendError(res, 409, 'Email already exists');
        }

        complaintDB.run(
          updateUserQuery,
          [finalOrganizationId, department_id, full_name, normalizedEmail, password, 0, status, finalRole, req.params.id],
          function onUpdate(err) {
            if (err) {
              if (isDuplicateUserEmailError(err)) {
                return sendError(res, 409, 'Email already exists');
              }
              return sendError(res, 500, 'Failed to update user', err.message);
            }

            if (this.changes === 0) {
              return sendError(res, 404, 'User not found');
            }

            complaintDB.get(fetchUserByIdQuery, [req.params.id], (getErr, row) => {
              if (getErr) {
                return sendError(res, 500, 'Failed to fetch updated user', getErr.message);
              }
              const auditMeta = buildAuditMetadata(req);
              auditMeta.target_email = row.email;
              auditMeta.assigned_role = row.role;
              auditMeta.organization_id = row.organization_id;
              void logAuditEntry(req, {
                action: 'update_user',
                targetTable: 'users',
                targetId: row.id,
                metadata: auditMeta
              }).catch((_) => {
                console.error('Failed to record audit log for user update');
              });
              return sendSuccess(res, 200, 'User updated successfully', sanitizeUser(row));
            });
          }
        );
      });
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
    if (!isAdminFamilyRole(requesterRow.role)) {
      return sendError(res, 403, 'Only admins can delete users');
    }

    complaintDB.get(fetchUserByIdQuery, [req.params.id], (targetErr, targetRow) => {
      if (targetErr) {
        return sendError(res, 500, 'Failed to fetch user', targetErr.message);
      }
      if (!targetRow) {
        return sendError(res, 404, 'User not found');
      }
      if (!canManageUserRecord(requesterRow, targetRow)) {
        return sendError(res, 403, 'Access denied');
      }

      complaintDB.run(deleteUserQuery, [req.params.id], function onDelete(err) {
        if (err) {
          return sendError(res, 500, 'Failed to delete user', err.message);
        }

        const auditMeta = buildAuditMetadata(req);
        auditMeta.target_id = req.params.id;
        void logAuditEntry(req, {
          action: 'delete_user',
          targetTable: 'users',
          targetId: Number(req.params.id),
          metadata: auditMeta
        }).catch((_) => {
          console.error('Failed to record audit log for user deletion');
        });
        return sendSuccess(res, 200, 'User deleted successfully', { id: req.params.id });
      });
    });
  });
};

export const updateUserRole = (req, res) => {
  const { role } = req.body;
  if (!role) {
    return sendError(res, 400, 'role is required');
  }
  const normalizedRole = normalizePanelRole(role);

  if (!normalizedRole) {
    return sendError(res, 400, 'role must be org_admin or user');
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], (requesterErr, requesterRow) => {
    if (requesterErr) {
      return sendError(res, 500, 'Failed to fetch requester', requesterErr.message);
    }
    if (!requesterRow) {
      return sendError(res, 404, 'Requester not found');
    }
    if (!isAdminFamilyRole(requesterRow.role)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.get(fetchUserByIdQuery, [req.params.id], (targetErr, targetRow) => {
      if (targetErr) {
        return sendError(res, 500, 'Failed to fetch target user', targetErr.message);
      }
      if (!targetRow) {
        return sendError(res, 404, 'User not found');
      }
      if (!canManageUserRecord(requesterRow, targetRow)) {
        return sendError(res, 403, 'Access denied');
      }

      complaintDB.run(updateUserRoleQuery, [normalizedRole, req.params.id], function onUpdate(err) {
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
            const auditMeta = buildAuditMetadata(req);
            auditMeta.target_email = updatedRow.email;
            auditMeta.organization_id = updatedRow.organization_id;
            void logAuditEntry(req, {
              action: 'assign_user_to_organization',
              targetTable: 'users',
              targetId: updatedRow.id,
              metadata: auditMeta
            }).catch((_) => {
              console.error('Failed to record audit log for user assignment');
            });
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

export const changeOwnEmail = (req, res) => {
  const newEmail = String(req.body?.new_email || '').trim().toLowerCase();
  const currentPassword = String(req.body?.current_password || '').trim();

  if (!newEmail || !currentPassword) {
    return sendError(res, 400, 'new_email and current_password are required');
  }

  complaintDB.get(fetchUserByIdQuery, [req.user.id], async (err, userRow) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch user', err.message);
    }
    if (!userRow) {
      return sendError(res, 404, 'User not found');
    }

    try {
      const isPasswordValid = await bcrypt.compare(currentPassword, userRow.password);
      if (!isPasswordValid) {
        return sendError(res, 401, 'Current password is invalid');
      }
    } catch (compareErr) {
      return sendError(res, 500, 'Failed to verify password', compareErr.message);
    }

    complaintDB.get(fetchUserByEmailQuery, [newEmail], (emailErr, existingUser) => {
      if (emailErr) {
        return sendError(res, 500, 'Failed to verify email', emailErr.message);
      }
      if (existingUser && Number(existingUser.id) !== Number(req.user.id)) {
        return sendError(res, 409, 'Email already registered');
      }

      getPlatformSettings()
        .then((settings) => {
          const requireEmailVerification = Number(settings?.require_email_verification ?? 1) === 1;
          const emailVerifiedValue = requireEmailVerification ? 0 : 1;
          const emailVerifiedAt = requireEmailVerification
            ? null
            : new Date().toISOString().slice(0, 19).replace('T', ' ');

          complaintDB.run(
            updateOwnEmailQuery,
            [newEmail, emailVerifiedValue, emailVerifiedAt, req.user.id],
            function onUpdate(updateErr) {
              if (updateErr) {
                return sendError(res, 500, 'Failed to update email', updateErr.message);
              }

              complaintDB.get(fetchUserByIdQuery, [req.user.id], async (getErr, updatedUser) => {
                if (getErr) {
                  return sendError(res, 500, 'Email updated but failed to load user', getErr.message);
                }
                if (!updatedUser) {
                  return sendError(res, 404, 'Email updated but user not found');
                }

                const auditMeta = buildAuditMetadata(req);
                auditMeta.new_email = updatedUser.email;
                void logAuditEntry(req, {
                  action: 'change_own_email',
                  targetTable: 'users',
                  targetId: updatedUser.id,
                  metadata: auditMeta
                }).catch(() => {
                  console.error('Failed to record audit log for email change');
                });

                if (!requireEmailVerification) {
                  return sendSuccess(res, 200, 'Email updated successfully', {
                    user: sanitizeUser(updatedUser)
                  });
                }

                try {
                  await createAndSendEmailVerification(updatedUser);
                  return sendSuccess(
                    res,
                    200,
                    'Email updated. Please verify your new email before logging in.',
                    { user: sanitizeUser(updatedUser) }
                  );
                } catch (verificationErr) {
                  return sendError(res, 500, 'Email updated but failed to send verification email', verificationErr.message);
                }
              });
            }
          );
        })
        .catch((settingsErr) => {
          return sendError(res, 500, 'Failed to load platform settings', settingsErr.message);
        });
    });
  });
};
