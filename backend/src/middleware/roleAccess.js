import { sendError } from '../utils/response.js';

export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }
  if (!roles.includes(req.user.role)) {
    return sendError(res, 403, 'Access denied');
  }
  return next();
};
