import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import HomePage from '../pages/HomePage.vue';
import LoginPage from '../pages/LoginPage.vue';
import ForgotPasswordPage from '../pages/ForgotPasswordPage.vue';
import ChangePasswordPage from '../pages/ChangePasswordPage.vue';
import SubmitComplaintPage from '../pages/SubmitComplaintPage.vue';
import TrackComplaintPage from '../pages/TrackComplaintPage.vue';
import UserDashboardPage from '../pages/UserDashboardPage.vue';
import OrgAdminDashboardPage from '../pages/orgAdmin/AuthorityDashboardPage.vue';
import OrgAdminAnalyticsPage from '../pages/orgAdmin/AnalyticsPage.vue';
import SignUpPage from '../pages/SignUpPage.vue';
import SuperAdminDashboardPage from '../pages/superAdmin/AdminDashboardPage.vue';
import SuperAdminAuditLogsPage from '../pages/superAdmin/AuditLogsPage.vue';
import SuperAdminReportsPage from '../pages/superAdmin/ReportsPage.vue';
import SuperAdminSettingsPage from '../pages/superAdmin/SettingsPage.vue';
import SuperAdminTriageQueuePage from '../pages/superAdmin/TriageQueuePage.vue';
import SuperAdminUserManagementPage from '../pages/superAdmin/UserManagementPage.vue';
import ResourcePage from '../pages/ResourcePage.vue';
import OrganizationPage from '../pages/OrganizationPage.vue';
import SuperAdminOrganizationManagementPage from '../pages/superAdmin/OrganizationManagementPage.vue';
import SuperAdminOrganizationDetailPage from '../pages/superAdmin/OrganizationDetailPage.vue';
import FeedbackPage from '../pages/FeedbackPage.vue';
import OrgAdminUserManagementPage from '../pages/orgAdmin/UserManagementPage.vue';
import OrgAdminComplaintsPage from '../pages/orgAdmin/AdminComplaintsPage.vue';
import OrgAdminComplaintDetailPage from '../pages/orgAdmin/ComplaintDetailPage.vue';
import OrgAdminDepartmentManagementPage from '../pages/orgAdmin/DepartmentManagementPage.vue';
import OrgAdminAccessmentManagementPage from '../pages/orgAdmin/AccessmentManagementPage.vue';
import OrgAdminEscalationManagementPage from '../pages/orgAdmin/EscalationManagementPage.vue';
import OrgAdminNotificationManagementPage from '../pages/orgAdmin/NotificationManagementPage.vue';
import OrgAdminAuditLogsPage from '../pages/orgAdmin/AuditLogsPage.vue';
import AboutView from '../pages/AboutView.vue';
import FeaturesPage from '../pages/FeaturesView.vue';
import TestimonialPage from '../pages/TestimonialPage.vue';

const readAuthClaimsFromToken = () => {
  const token = localStorage.getItem('token');
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

const isSuperAdminRole = (role) => role === 'super_admin';
const isOrgAdminRole = (role) => role === 'org_admin';
const isAdminFamilyRole = (role) => isSuperAdminRole(role) || isOrgAdminRole(role);
const hasOrganizationContext = (claims = {}) => Boolean(claims?.organization_id) && !isSuperAdminRole(claims?.role || '');

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView
  },

  {
    path: '/testimonial',
    name: 'testimonial',
    component: TestimonialPage,
    meta: { requiresAuth: true }
  },

  {
    path: '/features',
    name: 'features',
    component: FeaturesPage
  },

  {
    path: '/signin',
    name: 'signin',
    component: LoginPage,
    meta: { guestOnly: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { guestOnly: true }
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignUpPage,
    meta: { guestOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordPage,
    meta: { guestOnly: true }
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: 'submit-complaint', name: 'submit-complaint', component: SubmitComplaintPage, meta: { blockAdminFamily: true } },
      { path: 'track-complaint', name: 'track-complaint', component: TrackComplaintPage },
      { path: 'complaints', name: 'complaints', component: SubmitComplaintPage, meta: { blockAdminFamily: true } },
      { path: 'complaint', redirect: '/complaints' }
    ]
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', redirect: '/admin/dashboard' },
      { path: 'user/dashboard', name: 'user-dashboard', component: UserDashboardPage, meta: { requiresUserOnly: true } },
      { path: 'org-admin/dashboard', name: 'org-admin-dashboard', component: OrgAdminDashboardPage, meta: { requiresOrgAdmin: true } },
      { path: 'team-dashboard', redirect: '/org-admin/dashboard' },
      { path: 'authority-dashboard', redirect: '/org-admin/dashboard' },
      { path: 'change-password', name: 'change-password', component: ChangePasswordPage, meta: { allowPasswordResetRequired: true } },

      { path: 'admin/dashboard', name: 'admin-dashboard', component: SuperAdminDashboardPage, meta: { requiresAdmin: true } },
      { path: 'admin/users', name: 'admin-users', component: SuperAdminUserManagementPage, meta: { requiresAdmin: true } },
      { path: 'admin/organizations', name: 'admin-organizations', component: SuperAdminOrganizationManagementPage, meta: { requiresAdmin: true } },
      { path: 'admin/triage', name: 'admin-triage', component: SuperAdminTriageQueuePage, meta: { requiresAdmin: true } },
      { path: 'admin/organizations/:id', name: 'admin-organization-detail', component: SuperAdminOrganizationDetailPage, meta: { requiresAdmin: true } },
      { path: 'admin/departments', redirect: '/admin/dashboard' },
      { path: 'admin/accessments', redirect: '/admin/dashboard' },
      { path: 'admin/escalations', redirect: '/admin/dashboard' },
      { path: 'admin/reports', name: 'admin-reports', component: SuperAdminReportsPage, meta: { requiresAdmin: true } },
      { path: 'admin/audit-logs', name: 'admin-audit-logs', component: SuperAdminAuditLogsPage, meta: { requiresAdmin: true } },
      { path: 'admin/settings', name: 'admin-settings', component: SuperAdminSettingsPage, meta: { requiresAdmin: true } },
      { path: 'admin/complaints', redirect: '/admin/dashboard' },
      { path: 'admin/complaints/:id', redirect: '/admin/dashboard' },
      { path: 'admin/notifications', redirect: '/admin/dashboard' },

      { path: 'org-admin/users', name: 'org-admin-users', component: OrgAdminUserManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/complaints', name: 'org-admin-complaints', component: OrgAdminComplaintsPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/complaints/:id', name: 'org-admin-complaint-detail', component: OrgAdminComplaintDetailPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/analytics', name: 'org-admin-analytics', component: OrgAdminAnalyticsPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/departments', name: 'org-admin-departments', component: OrgAdminDepartmentManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/accessments', name: 'org-admin-accessments', component: OrgAdminAccessmentManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/escalations', name: 'org-admin-escalations', component: OrgAdminEscalationManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/notifications', name: 'org-admin-notifications', component: OrgAdminNotificationManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/status-logs', name: 'org-admin-status-logs', component: OrgAdminAuditLogsPage, meta: { requiresOrgAdmin: true } },
      { path: 'users', redirect: '/org-admin/users' },
      { path: 'organizations', name: 'organizations', component: OrganizationPage, meta: { requiresOrganizationContext: true } },
      { path: 'departments', redirect: '/org-admin/departments' },
      { path: 'accessments', redirect: '/org-admin/accessments' },
      { path: 'escalations', redirect: '/org-admin/escalations' },
      { path: 'status-logs', redirect: '/org-admin/status-logs' },
      { path: 'feedback', name: 'feedback', component: FeedbackPage, meta: { requiresUserOnly: true } },
      { path: 'notifications', redirect: '/org-admin/notifications' },

    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to) => {
  const token = localStorage.getItem('token');
  const claims = readAuthClaimsFromToken();
  const role = claims?.role || '';
  const mustChangePassword = Number(claims?.must_change_password || 0) === 1;
  const isAdminRoute = to.path.startsWith('/admin');
  const restrictedSuperAdminPaths = new Set([
    '/admin/complaints',
    '/admin/departments',
    '/admin/accessments',
    '/admin/escalations',
    '/admin/notifications',
    '/departments',
    '/accessments',
    '/escalations',
    '/status-logs',
    '/notifications',
    '/feedback'
  ]);

  if (to.meta.requiresAuth && !token) {
    return '/signin';
  }

  if (token && mustChangePassword && !to.meta.allowPasswordResetRequired) {
    return '/change-password';
  }

  if (to.path === '/change-password') {
    if (!token) return '/signin';
    if (!mustChangePassword) {
      if (isSuperAdminRole(role)) return '/admin/dashboard';
      if (isOrgAdminRole(role)) return '/org-admin/dashboard';
      return '/user/dashboard';
    }
  }

  if (to.path === '/dashboard' && token) {
    if (mustChangePassword) return '/change-password';
    if (isSuperAdminRole(role)) return '/admin/dashboard';
    if (isOrgAdminRole(role)) return '/org-admin/dashboard';
    return '/user/dashboard';
  }

  if ((to.meta.requiresAdmin || (isAdminRoute && !to.meta.requiresAdminFamily)) && !isSuperAdminRole(role)) {
    return isOrgAdminRole(role) ? '/org-admin/dashboard' : '/submit-complaint';
  }

  if (to.meta.requiresAdminFamily && !isAdminFamilyRole(role)) {
    return '/submit-complaint';
  }

  if (to.meta.requiresOrgAdmin && !isOrgAdminRole(role)) {
    return isSuperAdminRole(role) ? '/admin/dashboard' : '/user/dashboard';
  }

  if (to.meta.requiresOrganizationContext && !hasOrganizationContext(claims)) {
    if (isSuperAdminRole(role)) return '/admin/dashboard';
    if (isOrgAdminRole(role)) return '/org-admin/dashboard';
    return '/user/dashboard';
  }

  if (to.meta.requiresUserOnly && isAdminFamilyRole(role)) {
    return isSuperAdminRole(role) ? '/admin/dashboard' : '/org-admin/dashboard';
  }

  if (to.meta.blockAdminFamily && isAdminFamilyRole(role)) {
    return isSuperAdminRole(role) ? '/admin/dashboard' : '/org-admin/dashboard';
  }

  if (
    isSuperAdminRole(role) &&
    (to.path.startsWith('/org-admin') ||
      to.path === '/team-dashboard' ||
      to.path === '/authority-dashboard')
  ) {
    return '/admin/dashboard';
  }

  if (isSuperAdminRole(role) && restrictedSuperAdminPaths.has(to.path)) {
    return '/admin/dashboard';
  }

  if (isOrgAdminRole(role) && (to.path === '/admin/dashboard' || to.path === '/admin/users' || to.path === '/admin/organizations')) {
    return '/org-admin/dashboard';
  }

  if (to.meta.guestOnly && token) {
    if (mustChangePassword) return '/change-password';
    if (isSuperAdminRole(role)) return '/admin/dashboard';
    if (isOrgAdminRole(role)) return '/org-admin/dashboard';
    return '/user/dashboard';
  }

  return true;
});

export default router;