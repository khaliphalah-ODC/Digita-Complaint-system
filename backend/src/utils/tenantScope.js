import { sendError } from './response.js';

export const isSuperAdminRole = (role) => role === 'super_admin';
export const isOrgAdminRole = (role) => role === 'org_admin';
export const isAdminFamilyRole = (role) => isSuperAdminRole(role) || isOrgAdminRole(role);

export const denySuperAdminInternalAccess = (req, res, message = 'Super admin can only access aggregate organization data') => {
  if (!isSuperAdminRole(req.user?.role)) return false;
  sendError(res, 403, message);
  return true;
};
