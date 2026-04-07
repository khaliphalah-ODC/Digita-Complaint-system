import { createRouter, createWebHistory } from 'vue-router';
import PublicLayout from '../layouts/PublicLayout.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import { readAuthClaimsFromToken, resolveAuthNavigation } from './auth.js';

const HomePage = () => import('../pages/HomePage.vue');
const LoginPage = () => import('../pages/LoginPage.vue');
const ForgotPasswordPage = () => import('../pages/ForgotPasswordPage.vue');
const ChangePasswordPage = () => import('../pages/ChangePasswordPage.vue');
const SubmitComplaintPage = () => import('../pages/SubmitComplaintPage.vue');
const TrackComplaintPage = () => import('../pages/TrackComplaintPage.vue');
const UserDashboardPage = () => import('../pages/user/DashboardPage.vue');
const UserNotificationPage = () => import('../pages/user/NotificationPage.vue');
const OrgAdminDashboardPage = () => import('../pages/orgAdmin/DashboardPage.vue');
const OrgAdminAnalyticsPage = () => import('../pages/orgAdmin/AnalyticsPage.vue');
const SignUpPage = () => import('../pages/SignUpPage.vue');
const VerifyEmailPage = () => import('../pages/VerifyEmailPage.vue');
const SuperAdminDashboardPage = () => import('../pages/superAdmin/DashboardPage.vue');
const SuperAdminReportsPage = () => import('../pages/superAdmin/ReportsPage.vue');
const SuperAdminSettingsPage = () => import('../pages/superAdmin/SettingsPage.vue');
const SuperAdminTriageQueuePage = () => import('../pages/superAdmin/TriageQueuePage.vue');
const OrganizationPage = () => import('../pages/user/OrganizationPage.vue');
const SuperAdminOrganizationManagementPage = () => import('../pages/superAdmin/OrganizationManagementPage.vue');
const SuperAdminOrganizationDetailPage = () => import('../pages/superAdmin/OrganizationDetailPage.vue');
const FeedbackPage = () => import('../pages/user/FeedbackPage.vue');
const OrgAdminUserManagementPage = () => import('../pages/orgAdmin/UserManagementPage.vue');
const OrgAdminComplaintsPage = () => import('../pages/orgAdmin/ComplaintsPage.vue');
const OrgAdminComplaintDetailPage = () => import('../pages/orgAdmin/ComplaintDetailPage.vue');
const OrgAdminDepartmentManagementPage = () => import('../pages/orgAdmin/DepartmentManagementPage.vue');
const OrgAdminAssessmentManagementPage = () => import('../pages/orgAdmin/AssessmentManagementPage.vue');
const OrgAdminEscalationManagementPage = () => import('../pages/orgAdmin/EscalationManagementPage.vue');
const OrgAdminNotificationManagementPage = () => import('../pages/orgAdmin/NotificationManagementPage.vue');
const OrgAdminTestimonialManagementPage = () => import('../pages/orgAdmin/TestimonialManagementPage.vue');
const SharedAuditLogsPage = () => import('../pages/admin/shared/AuditLogsPage.vue');
const AboutView = () => import('../pages/AboutView.vue');
const FeaturesPage = () => import('../pages/FeaturesView.vue');
const ServicesPage = () => import('../pages/ServicesPage.vue');
const ContactPage = () => import('../pages/ContactPage.vue');
const TestimonialPage = () => import('../pages/user/TestimonialPage.vue');
const PublicOrganizationFeedbackPage = () => import('../pages/PublicOrganizationFeedbackPage.vue');
const OrgAdminPublicFeedbackManagementPage = () => import('../pages/orgAdmin/PublicFeedbackManagementPage.vue');
const OrgAdminPublicFeedbackSubmissionDetailPage = () => import('../pages/orgAdmin/PublicFeedbackSubmissionDetailPage.vue');
const OrgAdminSettingsPage = () => import('../pages/orgAdmin/SettingsPage.vue');
const UserSettingsPage = () => import('../pages/user/SettingsPage.vue');

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomePage
      },
      {
        path: 'about',
        name: 'about',
        component: AboutView
      },
      {
        path: 'features',
        name: 'features',
        component: FeaturesPage
      },
      {
        path: 'services',
        name: 'services',
        component: ServicesPage
      },
      {
        path: 'contact',
        name: 'contact',
        component: ContactPage
      },
      {
        path: 'public-feedback/:slug',
        name: 'public-feedback',
        component: PublicOrganizationFeedbackPage
      },
      {
        path: 'signin',
        name: 'signin',
        component: LoginPage,
        meta: { guestOnly: true }
      },
      {
        path: 'login',
        name: 'login',
        component: LoginPage,
        meta: { guestOnly: true }
      },
      {
        path: 'signup',
        name: 'signup',
        component: SignUpPage,
        meta: { guestOnly: true }
      },
      {
        path: 'verify-email',
        name: 'verify-email',
        component: VerifyEmailPage,
        meta: { guestOnly: true }
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: ForgotPasswordPage,
        meta: { guestOnly: true }
      }
    ]
  },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: 'submit-complaint', name: 'submit-complaint', component: SubmitComplaintPage, meta: { requiresAuth: true, requiresUserOnly: true } },
      { path: 'track-complaint', name: 'track-complaint', component: TrackComplaintPage, meta: { requiresAuth: true, requiresUserOnly: true } },
      { path: 'complaints', name: 'complaints', component: SubmitComplaintPage, meta: { requiresAuth: true, requiresUserOnly: true } },
      { path: 'complaint', redirect: '/complaints' }
    ]
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', redirect: '/admin/dashboard' },
      { path: 'user/dashboard', name: 'user-dashboard', component: UserDashboardPage, meta: { requiresUserOnly: true } },
      { path: 'org-admin/dashboard', name: 'org-admin-dashboard', component: OrgAdminDashboardPage, meta: { requiresOrgAdmin: true } },
      { path: 'team-dashboard', redirect: '/org-admin/dashboard' },
      { path: 'authority-dashboard', redirect: '/org-admin/dashboard' },
      { path: 'change-password', name: 'change-password', component: ChangePasswordPage, meta: { allowPasswordResetRequired: true } },

      { path: 'admin/dashboard', name: 'admin-dashboard', component: SuperAdminDashboardPage, meta: { requiresAdmin: true } },
      { path: 'admin/users', redirect: '/admin/dashboard' },
      { path: 'admin/organizations', name: 'admin-organizations', component: SuperAdminOrganizationManagementPage, meta: { requiresAdmin: true } },
      { path: 'admin/triage', name: 'admin-triage', component: SuperAdminTriageQueuePage, meta: { requiresAdmin: true } },
      { path: 'admin/organizations/:id', name: 'admin-organization-detail', component: SuperAdminOrganizationDetailPage, meta: { requiresAdmin: true } },
      { path: 'admin/departments', redirect: '/admin/dashboard' },
      { path: 'admin/assessments', redirect: '/admin/dashboard' },
      { path: 'admin/escalations', redirect: '/admin/dashboard' },
      { path: 'admin/reports', name: 'admin-reports', component: SuperAdminReportsPage, meta: { requiresAdmin: true } },
      { path: 'admin/testimonials', name: 'admin-testimonials', component: OrgAdminTestimonialManagementPage, meta: { requiresAdmin: true } },
      { path: 'admin/audit-logs', name: 'admin-audit-logs', component: SharedAuditLogsPage, meta: { requiresAdmin: true } },
      { path: 'admin/settings', name: 'admin-settings', component: SuperAdminSettingsPage, meta: { requiresAdmin: true } },
      { path: 'admin/complaints', redirect: '/admin/dashboard' },
      { path: 'admin/complaints/:id', redirect: '/admin/dashboard' },
      { path: 'admin/notifications', redirect: '/admin/dashboard' },

      { path: 'org-admin/users', name: 'org-admin-users', component: OrgAdminUserManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/complaints', name: 'org-admin-complaints', component: OrgAdminComplaintsPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/complaints/:id', name: 'org-admin-complaint-detail', component: OrgAdminComplaintDetailPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/analytics', name: 'org-admin-analytics', component: OrgAdminAnalyticsPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/departments', name: 'org-admin-departments', component: OrgAdminDepartmentManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/assessments', name: 'org-admin-assessments', component: OrgAdminAssessmentManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/escalations', name: 'org-admin-escalations', component: OrgAdminEscalationManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/testimonials', redirect: '/admin/testimonials' },
      { path: 'org-admin/notifications', name: 'org-admin-notifications', component: OrgAdminNotificationManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/public-feedback', name: 'org-admin-public-feedback', component: OrgAdminPublicFeedbackManagementPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/public-feedback/submissions/:id', name: 'org-admin-public-feedback-submission-detail', component: OrgAdminPublicFeedbackSubmissionDetailPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/settings', name: 'org-admin-settings', component: OrgAdminSettingsPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/status-logs', name: 'org-admin-status-logs', component: SharedAuditLogsPage, meta: { requiresOrgAdmin: true } },
      { path: 'org-admin/organization', name: 'org-admin-organization', component: OrganizationPage, meta: { requiresOrgAdmin: true } },
      { path: 'users', redirect: '/org-admin/users' },
      { path: 'organizations', name: 'organizations', component: OrganizationPage, meta: { requiresOrganizationContext: true } },
      { path: 'organization', redirect: '/org-admin/organization' },
      { path: 'departments', redirect: '/org-admin/departments' },
      { path: 'assessments', redirect: '/org-admin/assessments' },
      { path: 'escalations', redirect: '/org-admin/escalations' },
      { path: 'status-logs', redirect: '/org-admin/status-logs' },
      { path: 'feedback', name: 'feedback', component: FeedbackPage, meta: { requiresUserOnly: true } },
      { path: 'testimonial', name: 'testimonial', component: TestimonialPage, meta: { requiresUserOnly: true } },
      { path: 'notifications', name: 'notifications', component: UserNotificationPage, meta: { requiresUserOnly: true } },
      { path: 'user/settings', name: 'user-settings', component: UserSettingsPage, meta: { requiresUserOnly: true } },
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
  return resolveAuthNavigation(to, { token, claims });
});

export default router;
