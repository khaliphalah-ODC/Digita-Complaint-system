import jwt from 'jsonwebtoken';
import complaintDB from '../model/connect.js';
import { fetchRevokedTokenQuery } from '../model/user.model.js';
import { sendError } from '../utils/response.js';

const getJwtSecret = () => process.env.JWT_SECRET_KEY || process.env.JWT_KEY || process.env.JWT_SECRET || 'evn';
const allowedWhenPasswordResetRequired = ['/api/users/change-password', '/api/users/me', '/api/users/logout'];

const getRequestToken = (req) => {
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers.authorization || '';
  const [scheme, bearerToken] = authHeader.split(' ');
  return cookieToken || (scheme === 'Bearer' ? bearerToken : null);
};

const applyDecodedToken = (req, decoded, token) => {
  req.userId = decoded.id || decoded.userId || null;
  req.role = decoded.role || null;
  req.user = decoded;
  req.token = token;
};

// Middleware: verify token from cookies or Authorization header.
const verifyToken = (req, res, next) => {
  const JWT_SECRET = getJwtSecret();
  const token = getRequestToken(req);

  if (!token) {
    return sendError(res, 401, 'Unauthorized: No token provided');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    complaintDB.get(fetchRevokedTokenQuery, [token], (dbErr, revokedRow) => {
      if (dbErr) {
        return sendError(res, 500, 'Failed to validate token', dbErr.message);
      }
      if (revokedRow) {
        return sendError(res, 401, 'Unauthorized: Token has been revoked');
      }

      applyDecodedToken(req, decoded, token);

      const mustChangePassword = Number(decoded.must_change_password || 0) === 1;
      const isAllowedRoute = allowedWhenPasswordResetRequired.some(
        (route) => req.originalUrl?.startsWith(route) || req.path?.startsWith(route)
      );
      if (mustChangePassword && !isAllowedRoute) {
        return sendError(res, 403, 'Password change required before accessing this resource');
      }

      return next();
    });
  } catch (error) {
    return sendError(res, 401, 'Unauthorized: Invalid or expired token', error.message);
  }
};

export const optionalAuthenticateToken = (req, _res, next) => {
  const JWT_SECRET = getJwtSecret();
  const token = getRequestToken(req);

  if (!token) {
    req.userId = null;
    req.role = null;
    req.user = null;
    req.token = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    complaintDB.get(fetchRevokedTokenQuery, [token], (dbErr, revokedRow) => {
      if (dbErr || revokedRow) {
        req.userId = null;
        req.role = null;
        req.user = null;
        req.token = null;
        return next();
      }

      applyDecodedToken(req, decoded, token);
      return next();
    });
  } catch (_error) {
    req.userId = null;
    req.role = null;
    req.user = null;
    req.token = null;
    return next();
  }
};

export default verifyToken;
export { verifyToken as varifyToken };
