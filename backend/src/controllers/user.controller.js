// user.controller controller: handles HTTP request/response flow for this module.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { encryptPassword } from '../utils/middleware/encryptpassword.js';
import {
  usersQuery,
  createUserQuery,
  fetchUsersQuery,
  fetchUserByIdQuery,
  fetchUserByEmailQuery,
  updateUserQuery,
  deleteUserQuery,
  createRevokedTokenQuery,
  revokedTokensQuery
} from '../model/user.model.js';

<<<<<<< HEAD

=======
const JWT_KEY = process.env.JWT_KEY || process.env.JWT_SECRET || 'evn';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};
>>>>>>> standby

export const CreateUsersTable = () => {
  complaintDB.run(usersQuery, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table created or already exists');
    }
  });
};

<<<<<<< HEAD
export const createUser = async (req, res) => {
=======
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
    full_name,
    email,
    password,
    role = 'user',
    status = 'active'
  } = req.body;

  if (!full_name || !email || !password) {
    return sendError(res, 400, 'full_name, email, and password are required');
  }

  complaintDB.get(fetchUserByEmailQuery, [email], async (findErr, existingUser) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to verify user email', findErr.message);
    }
    if (existingUser) {
      return sendError(res, 409, 'Email already registered');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      complaintDB.run(
        createUserQuery,
        [organization_id, full_name, email, hashedPassword, status, role],
        function onCreate(createErr) {
          if (createErr) {
            return sendError(res, 500, 'Failed to register user', createErr.message);
          }

          complaintDB.get(fetchUserByIdQuery, [this.lastID], (getErr, userRow) => {
            if (getErr) {
              return sendError(res, 500, 'Failed to fetch registered user', getErr.message);
            }

            const safeUser = sanitizeUser(userRow);
            const token = jwt.sign(
              { id: safeUser.id, email: safeUser.email, role: safeUser.role, status: safeUser.status },
              JWT_KEY,
              { expiresIn: JWT_EXPIRES_IN }
            );

            return sendSuccess(res, 201, 'User registered successfully', { user: safeUser, token });
          });
        }
      );
    } catch (hashErr) {
      return sendError(res, 500, 'Failed to process password', hashErr.message);
    }
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
      const token = jwt.sign(
        { id: safeUser.id, email: safeUser.email, role: safeUser.role, status: safeUser.status },
        JWT_KEY,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return sendSuccess(res, 200, 'Login successful', { user: safeUser, token });
    } catch (compareErr) {
      return sendError(res, 500, 'Failed to verify password', compareErr.message);
    }
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
  return sendSuccess(res, 200, 'Current user retrieved successfully', req.user);
};

export const createUser = (req, res) => {
>>>>>>> standby
  const {
    organization_id = null,
    full_name,
    email,
    password,
    status = 'active',
    role = 'user'
  } = req.body;
  const { password: hashedPassword } = await encryptPassword(password);

  if (!full_name || !email || !password) {
    return sendError(res, 400, 'full_name, email, and password are required');
  }

<<<<<<< HEAD
  complaintDB.run(
    createUserQuery,
    [organization_id, full_name, email, hashedPassword, status, role],
    function onCreate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create user', err.message);
      }

      complaintDB.get(fetchUserByIdQuery, [this.lastID], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch user', getErr.message);
=======
  bcrypt.hash(password, 10).then((hashedPassword) => {
    complaintDB.run(
      createUserQuery,
      [organization_id, full_name, email, hashedPassword, status, role],
      function onCreate(err) {
        if (err) {
          return sendError(res, 500, 'Failed to create user', err.message);
>>>>>>> standby
        }

        complaintDB.get(fetchUserByIdQuery, [this.lastID], (getErr, row) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch user', getErr.message);
          }
          return sendSuccess(res, 201, 'User created successfully', sanitizeUser(row));
        });
      }
    );
  }).catch((hashErr) => sendError(res, 500, 'Failed to process password', hashErr.message));
};

export const getAllUsers = (_req, res) => {
  complaintDB.all(fetchUsersQuery, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch users', err.message);
    }
    return sendSuccess(res, 200, 'Users retrieved successfully', rows.map(sanitizeUser));
  });
};

export const getUserById = (req, res) => {
  complaintDB.get(fetchUserByIdQuery, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch user', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'User not found');
    }
    return sendSuccess(res, 200, 'User retrieved successfully', sanitizeUser(row));
  });
};

export const getUserByEmail = (req, res) => {
  complaintDB.get(fetchUserByEmailQuery, [req.params.email], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch user by email', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'User not found');
    }
    return sendSuccess(res, 200, 'User retrieved successfully', sanitizeUser(row));
  });
};

export const updateUser = (req, res) => {
  const {
    organization_id = null,
    full_name,
    email,
    password,
    status = 'active',
    role = 'user'
  } = req.body;

  if (!full_name || !email || !password) {
    return sendError(res, 400, 'full_name, email, and password are required');
  }

  bcrypt.hash(password, 10).then((hashedPassword) => {
    complaintDB.run(
      updateUserQuery,
      [organization_id, full_name, email, hashedPassword, status, role, req.params.id],
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
  }).catch((hashErr) => sendError(res, 500, 'Failed to process password', hashErr.message));
};

export const deleteUser = (req, res) => {
  complaintDB.run(deleteUserQuery, [req.params.id], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete user', err.message);
    }

    if (this.changes === 0) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User deleted successfully', { id: req.params.id });
  });
};
