// auth.middleware middleware: request pipeline checks shared across routes.
import jwt from 'jsonwebtoken';
import complaintDB from '../model/connect.js';
import { fetchRevokedTokenQuery } from '../model/user.model.js';
import { sendError } from '../utils/response.js';

const JWT_KEY = process.env.JWT_KEY || process.env.JWT_SECRET || 'evn';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return sendError(res, 401, 'Authorization token is required');
  }

  jwt.verify(token, JWT_KEY, (verifyErr, payload) => {
    if (verifyErr) {
      return sendError(res, 401, 'Invalid or expired token');
    }

    complaintDB.get(fetchRevokedTokenQuery, [token], (dbErr, row) => {
      if (dbErr) {
        return sendError(res, 500, 'Failed to validate token', dbErr.message);
      }
      if (row) {
        return sendError(res, 401, 'Token has been revoked');
      }

      req.user = payload;
      req.token = token;
      return next();
    });
  });
};

export const optionalAuthenticateToken = (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    req.user = null;
    req.token = null;
    return next();
  }

  jwt.verify(token, JWT_KEY, (verifyErr, payload) => {
    if (verifyErr) {
      req.user = null;
      req.token = null;
      return next();
    }

    complaintDB.get(fetchRevokedTokenQuery, [token], (dbErr, row) => {
      if (dbErr || row) {
        req.user = null;
        req.token = null;
        return next();
      }

      req.user = payload;
      req.token = token;
      return next();
    });
  });
};

export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }
  if (!roles.includes(req.user.role)) {
    return sendError(res, 403, 'Access denied');
  }
  return next();
};
