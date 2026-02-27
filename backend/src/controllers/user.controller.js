import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  usersQuery,
  createUserQuery,
  fetchUsersQuery,
  fetchUserByIdQuery,
  fetchUserByEmailQuery,
  updateUserQuery,
  deleteUserQuery
} from '../model/user.model.js';

export const CreateUsersTable = () => {
  complaintDB.run(usersQuery, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table created or already exists');
    }
  });
};

export const createUser = (req, res) => {
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

  complaintDB.run(
    createUserQuery,
    [organization_id, full_name, email, password, status, role],
    function onCreate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create user', err.message);
      }

      complaintDB.get(fetchUserByIdQuery, [this.lastID], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch user', getErr.message);
        }
        return sendSuccess(res, 201, 'User created successfully', row);
      });
    }
  );
};

export const getAllUsers = (_req, res) => {
  complaintDB.all(fetchUsersQuery, [], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch users', err.message);
    }
    return sendSuccess(res, 200, 'Users retrieved successfully', rows);
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
    return sendSuccess(res, 200, 'User retrieved successfully', row);
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
    return sendSuccess(res, 200, 'User retrieved successfully', row);
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

  complaintDB.run(
    updateUserQuery,
    [organization_id, full_name, email, password, status, role, req.params.id],
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
        return sendSuccess(res, 200, 'User updated successfully', row);
      });
    }
  );
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
