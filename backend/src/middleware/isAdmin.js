import { sendError } from '../utils/response.js';

// Middleware: Check if authenticated user is a super admin.
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  if (req.user.role !== 'super_admin') {
    return sendError(res, 403, 'Forbidden: Super Admins only');
  }

  return next();
};

export default isAdmin;
