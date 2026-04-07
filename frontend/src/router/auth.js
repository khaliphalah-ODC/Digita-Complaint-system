export const readAuthClaimsFromToken = (storage = localStorage) => {
  const token = storage.getItem('token');
  if (!token) return {};
  const parts = token.split('.');
  if (parts.length !== 3) return {};
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) || {};
  } catch (_error) {
    return {};
  }
};

export const roleUtils = {
  isSuperAdmin: (role) => role === 'super_admin',
  isOrgAdmin: (role) => role === 'org_admin',
  isAdminFamily(role) {
    return this.isSuperAdmin(role) || this.isOrgAdmin(role);
  },
  hasOrganizationContext(claims = {}) {
    return Boolean(claims?.organization_id) && !this.isSuperAdmin(claims?.role || '');
  }
};

export const getDefaultRouteForRole = (role) => {
  if (roleUtils.isSuperAdmin(role)) return '/admin/dashboard';
  if (roleUtils.isOrgAdmin(role)) return '/org-admin/dashboard';
  return '/user/dashboard';
};

const restrictedSuperAdminPaths = new Set([
  '/admin/complaints',
  '/admin/departments',
  '/admin/assessments',
  '/admin/escalations',
  '/admin/notifications',
  '/departments',
  '/assessments',
  '/escalations',
  '/status-logs',
  '/feedback'
]);

export const resolveAuthNavigation = (to, { token, claims }) => {
  const role = claims?.role || '';
  const mustChangePassword = Number(claims?.must_change_password || 0) === 1;
  const isAdminRoute = to.path.startsWith('/admin');

  if (to.meta.requiresAuth && !token) return '/signin';
  if (token && mustChangePassword && !to.meta.allowPasswordResetRequired) return '/change-password';

  if (to.path === '/change-password') {
    if (!token) return '/signin';
    if (!mustChangePassword) return getDefaultRouteForRole(role);
  }

  if (to.path === '/dashboard' && token) {
    if (mustChangePassword) return '/change-password';
    return getDefaultRouteForRole(role);
  }

  if ((to.meta.requiresAdmin || (isAdminRoute && !to.meta.requiresAdminFamily)) && !roleUtils.isSuperAdmin(role)) {
    return roleUtils.isOrgAdmin(role) ? '/org-admin/dashboard' : '/signin';
  }

  if (to.meta.requiresAdminFamily && !roleUtils.isAdminFamily(role)) return '/signin';
  if (to.meta.requiresOrgAdmin && !roleUtils.isOrgAdmin(role)) return roleUtils.isSuperAdmin(role) ? '/admin/dashboard' : '/user/dashboard';
  if (to.meta.requiresOrganizationContext && !roleUtils.hasOrganizationContext(claims)) return getDefaultRouteForRole(role);
  if (to.meta.requiresUserOnly && roleUtils.isAdminFamily(role)) return getDefaultRouteForRole(role);
  if (to.meta.blockAdminFamily && roleUtils.isAdminFamily(role)) return getDefaultRouteForRole(role);

  if (roleUtils.isSuperAdmin(role) && (to.path.startsWith('/org-admin') || to.path === '/team-dashboard' || to.path === '/authority-dashboard')) {
    return '/admin/dashboard';
  }

  if (roleUtils.isSuperAdmin(role) && restrictedSuperAdminPaths.has(to.path)) return '/admin/dashboard';
  if (roleUtils.isOrgAdmin(role) && (to.path === '/admin/dashboard' || to.path === '/admin/organizations')) return '/org-admin/dashboard';

  if (to.meta.guestOnly && token) {
    if (mustChangePassword) return '/change-password';
    return getDefaultRouteForRole(role);
  }

  return true;
};
