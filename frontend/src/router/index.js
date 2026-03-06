import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import HomePage from '../pages/HomePage.vue';
import LoginPage from '../pages/LoginPage.vue';
import SubmitComplaintPage from '../pages/SubmitComplaintPage.vue';
import TrackComplaintPage from '../pages/TrackComplaintPage.vue';
import AuthorityDashboardPage from '../pages/AuthorityDashboardPage.vue';
import SignUpPage from '../pages/SignUpPage.vue';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.vue';
import AdminComplaintsPage from '../pages/admin/AdminComplaintsPage.vue';
import AuditLogsPage from '../pages/admin/AuditLogsPage.vue';
import ComplaintDetailPage from '../pages/admin/ComplaintDetailPage.vue';
import ReportsPage from '../pages/admin/ReportsPage.vue';
import SettingsPage from '../pages/admin/SettingsPage.vue';
import UserManagementPage from '../pages/admin/UserManagementPage.vue';
import ResourcePage from '../pages/ResourcePage.vue';
import OrganizationPage from '../pages/OrganizationPage.vue';
import OrganizationManagementPage from '../pages/admin/OrganizationManagementPage.vue';
import OrganizationDetailPage from '../pages/admin/OrganizationDetailPage.vue';
import FeedbackPage from '../pages/FeedbackPage.vue';
import DepartmentManagementPage from '../pages/admin/DepartmentManagementPage.vue';
import AccessmentManagementPage from '../pages/admin/AccessmentManagementPage.vue';
import EscalationManagementPage from '../pages/admin/EscalationManagementPage.vue';
import NotificationManagementPage from '../pages/admin/NotificationManagementPage.vue';

const readRoleFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return '';
  const parts = token.split('.');
  if (parts.length !== 3) return '';
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return payload?.role || '';
  } catch (_error) {
    return '';
  }
};

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
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
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', redirect: '/admin/dashboard' },
      { path: 'team-dashboard', name: 'team-dashboard', component: AuthorityDashboardPage },
      { path: 'authority-dashboard', name: 'authority-dashboard', component: AuthorityDashboardPage },

      { path: 'submit-complaint', name: 'submit-complaint', component: SubmitComplaintPage },
      { path: 'track-complaint', name: 'track-complaint', component: TrackComplaintPage },
      { path: 'complaints', name: 'complaints', component: SubmitComplaintPage },
      { path: 'complaint', redirect: '/complaints' },

      { path: 'admin/dashboard', name: 'admin-dashboard', component: AdminDashboardPage, meta: { requiresAdmin: true } },
      { path: 'admin/users', name: 'admin-users', component: UserManagementPage, meta: { requiresAdmin: true } },
      { path: 'admin/organizations', name: 'admin-organizations', component: OrganizationManagementPage, meta: { requiresAdmin: true } },
      { path: 'admin/organizations/:id', name: 'admin-organization-detail', component: OrganizationDetailPage, meta: { requiresAdmin: true } },
      { path: 'admin/departments', name: 'admin-departments', component: DepartmentManagementPage, meta: { requiresAdmin: true } },
      { path: 'admin/accessments', name: 'admin-accessments', component: AccessmentManagementPage, meta: { requiresAdmin: true } },
      { path: 'admin/escalations', name: 'admin-escalations', component: EscalationManagementPage, meta: { requiresAdmin: true } },
      { path: 'admin/reports', name: 'admin-reports', component: ReportsPage, meta: { requiresAdmin: true } },
      { path: 'admin/audit-logs', name: 'admin-audit-logs', component: AuditLogsPage, meta: { requiresAdmin: true } },
      { path: 'admin/settings', name: 'admin-settings', component: SettingsPage, meta: { requiresAdmin: true } },
      { path: 'admin/complaints', name: 'admin-complaints', component: AdminComplaintsPage, meta: { requiresAdmin: true } },
      { path: 'admin/complaints/:id', name: 'admin-complaint-detail', component: ComplaintDetailPage, meta: { requiresAdmin: true } },
      { path: 'admin/notifications', name: 'admin-notifications', component: NotificationManagementPage, meta: { requiresAdmin: true } },

      { path: 'users', redirect: '/admin/users' },
      { path: 'organizations', name: 'organizations', component: OrganizationPage },
      { path: 'departments', name: 'departments', component: DepartmentManagementPage, meta: { requiresAdmin: true } },
      { path: 'accessments', name: 'accessments', component: AccessmentManagementPage, meta: { requiresAdmin: true } },
      { path: 'escalations', name: 'escalations', component: EscalationManagementPage, meta: { requiresAdmin: true } },
      { path: 'status-logs', name: 'status-logs', component: ResourcePage, meta: { requiresAdmin: true }, props: { title: 'Status Logs', endpoint: '/status-logs' } },
      { path: 'feedback', name: 'feedback', component: FeedbackPage },
      { path: 'notifications', name: 'notifications', component: NotificationManagementPage, meta: { requiresAdmin: true } },
      
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to) => {
  const token = localStorage.getItem('token');
  const role = readRoleFromToken();
  const isAdminRoute = to.path.startsWith('/admin');

  if (to.meta.requiresAuth && !token) {
    return '/signin';
  }

  if ((to.meta.requiresAdmin || isAdminRoute) && role !== 'admin') {
    return '/team-dashboard';
  }

  if (to.meta.guestOnly && token) {
    return role === 'admin' ? '/dashboard' : '/team-dashboard';
  }

  return true;
});

export default router;
