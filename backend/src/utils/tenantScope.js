import complaintDB from '../model/connect.js';
import { sendError } from './response.js';

export const isSuperAdminRole = (role) => role === 'super_admin';
export const isOrgAdminRole = (role) => role === 'org_admin';
export const isAdminFamilyRole = (role) => isSuperAdminRole(role) || isOrgAdminRole(role);

export const getRequesterOrganizationId = (req) => {
  const parsed = Number(req.user?.organization_id);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row || null);
    });
  });

export const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows || []);
    });
  });

export const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });

export const denySuperAdminInternalAccess = (req, res, message = 'Super admin can only access aggregate organization data') => {
  if (!isSuperAdminRole(req.user?.role)) return false;
  sendError(res, 403, message);
  return true;
};

export const ensureOrgAdmin = (req, res, message = 'Only org_admin can access this resource') => {
  if (!isOrgAdminRole(req.user?.role)) {
    sendError(res, 403, message);
    return false;
  }
  return true;
};

export const ensureSameOrganization = (req, res, organizationId, message = 'Access denied') => {
  if (!isOrgAdminRole(req.user?.role)) {
    sendError(res, 403, message);
    return false;
  }

  if (String(getRequesterOrganizationId(req)) !== String(organizationId)) {
    sendError(res, 403, message);
    return false;
  }

  return true;
};
