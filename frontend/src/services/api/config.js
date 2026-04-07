export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const USERS_API_BASE = import.meta.env.VITE_API_URL || '/users';

// Frontend-normalized resource map. Values point to the backend's current paths.
export const apiRoutes = {
  auth: USERS_API_BASE,
  users: USERS_API_BASE,
  complaints: '/complaint',
  organizations: '/organization',
  departments: '/department',
  assessments: '/assessments',
  escalations: '/escalations',
  statusLogs: '/status-logs',
  notifications: '/notification',
  feedback: '/feedback',
  publicFeedbackPublic: '/public/feedback',
  testimonials: '/testimonials',
  complaintMessages: '/complaint-messages',
  platformSettings: '/platform-settings',
  auditLogs: '/audit-logs',
  publicOrganizations: '/public/organizations',
  email: '/email',
  joinCodes: '/join',
  settings: '/settings'
};
