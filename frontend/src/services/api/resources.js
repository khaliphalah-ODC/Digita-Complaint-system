import { apiRoutes } from './config.js';
import {
  transformAnalytics,
  transformComplaint,
  transformComplaintCollection,
  transformDepartment,
  transformDepartmentCollection,
  transformEscalation,
  transformEscalationCollection,
  transformFeedback,
  transformFeedbackCollection,
  transformNotification,
  transformNotificationCollection,
  transformOrganization,
  transformOrganizationCollection,
  transformOrganizationSettings,
  transformPublicFeedbackAnalytics,
  transformPublicFeedbackForm,
  transformPublicFeedbackSubmissionList,
  transformPublicFeedbackSubmission,
  transformPublicFeedbackSubmissionCollection,
  transformUserSettings,
  transformStatusLogCollection
} from './adapters.js';
import { get, patch, post, put, remove } from './helpers.js';

const LEGACY_ASSESSMENT_KEY = ['access', 'ment_id'].join('');
const LEGACY_ASSESSMENTS_KEY = ['access', 'ments'].join('');

const withLegacyAssessmentField = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  if (!Object.prototype.hasOwnProperty.call(payload, 'assessment_id')) return payload;

  const nextPayload = { ...payload };
  nextPayload[LEGACY_ASSESSMENT_KEY] = nextPayload.assessment_id;
  delete nextPayload.assessment_id;
  return nextPayload;
};

const normalizeDeleteBlockers = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

  const nextValue = { ...value };
  if (Object.prototype.hasOwnProperty.call(nextValue, LEGACY_ASSESSMENTS_KEY) && !Object.prototype.hasOwnProperty.call(nextValue, 'assessments')) {
    nextValue.assessments = nextValue[LEGACY_ASSESSMENTS_KEY];
  }
  return nextValue;
};

export const authApi = {
  register: (payload) => post(`${apiRoutes.auth}/register`, payload, { skipAuth: true }, 'Sign up failed'),
  registerWithJoinCode: (payload) => post(`${apiRoutes.auth}/register-with-code`, payload, { skipAuth: true }, 'Sign up failed'),
  login: (payload) => post(`${apiRoutes.auth}/login`, payload, { skipAuth: true }, 'Login failed'),
  googleLogin: (credential) => post(`${apiRoutes.auth}/google-login`, { credential }, { skipAuth: true }, 'Google login failed'),
  me: () => get(`${apiRoutes.auth}/me`, undefined, 'Failed to load profile'),
  logout: () => post(`${apiRoutes.auth}/logout`, undefined, undefined, 'Logout failed'),
  changePassword: (payload) => post(`${apiRoutes.auth}/change-password`, payload, undefined, 'Password change failed'),
  changeEmail: (payload) => post(`${apiRoutes.auth}/change-email`, payload, undefined, 'Email change failed'),
  verifyEmail: (payload) => post(`${apiRoutes.auth}/verify-email`, payload, { skipAuth: true }, 'We could not verify your email.'),
  resendVerification: (payload) => post(`${apiRoutes.auth}/resend-verification`, payload, { skipAuth: true }, 'We could not resend the verification email.'),
  requestPasswordResetCode: (payload) => post(`${apiRoutes.auth}/forgot-password/request`, payload, { skipAuth: true }, 'Failed to request password reset code'),
  resetPassword: (payload) => post(`${apiRoutes.auth}/forgot-password`, payload, { skipAuth: true }, 'Password reset failed'),
  listUsers: () => get(apiRoutes.users, undefined, 'Failed to fetch users'),
  createUser: (payload) => post(apiRoutes.users, payload, undefined, 'Failed to create user'),
  getUserById: (id) => get(`${apiRoutes.users}/id/${id}`, undefined, 'Failed to fetch user'),
  updateUser: (id, payload) => put(`${apiRoutes.users}/${id}`, payload, undefined, 'Failed to update user'),
  updateUserRole: (id, payload) => patch(`${apiRoutes.users}/${id}/role`, payload, undefined, 'Failed to update role'),
  deleteUser: (id) => remove(`${apiRoutes.users}/${id}`, undefined, 'Failed to delete user'),
  assignExistingUser: (payload) => post(`${apiRoutes.users}/assign-existing`, payload, undefined, 'Failed to assign existing user')
};

export const complaintsApi = {
  list: async () => transformComplaintCollection(await get(apiRoutes.complaints, undefined, 'Failed to fetch complaints')),
  create: async (payload) => transformComplaint(await post(apiRoutes.complaints, payload, undefined, 'Failed to create complaint')),
  getById: async (id) => transformComplaint(await get(`${apiRoutes.complaints}/${id}`, undefined, 'Failed to fetch complaint')),
  update: async (id, payload) => transformComplaint(await put(`${apiRoutes.complaints}/${id}`, payload, undefined, 'Failed to update complaint')),
  remove: (id) => remove(`${apiRoutes.complaints}/${id}`, undefined, 'Failed to delete complaint'),
  trackByCode: async (trackingCode) => transformComplaint(await get(`${apiRoutes.complaints}/track/${encodeURIComponent(trackingCode)}`, undefined, 'Failed to fetch complaint')),
  listUnassigned: async () => transformComplaintCollection(await get(`${apiRoutes.complaints}/unassigned`, undefined, 'Failed to fetch unassigned complaints')),
  assignOrganization: async (id, payload) => transformComplaint(await patch(`${apiRoutes.complaints}/${id}/assign-organization`, payload, undefined, 'Failed to assign complaint'))
};

export const organizationsApi = {
  list: async () => transformOrganizationCollection(await get(apiRoutes.organizations, undefined, 'Failed to fetch organizations')),
  create: async (payload) => transformOrganization(await post(apiRoutes.organizations, payload, undefined, 'Failed to create organization')),
  getById: async (id) => transformOrganization(await get(`${apiRoutes.organizations}/${id}`, undefined, 'Failed to fetch organization')),
  update: async (id, payload) => transformOrganization(await put(`${apiRoutes.organizations}/${id}`, payload, undefined, 'Failed to update organization')),
  remove: async (id) => {
    try {
      return await remove(`${apiRoutes.organizations}/${id}`, undefined, 'Failed to delete organization');
    } catch (error) {
      const payload = error?.response?.data;
      if (payload?.error && typeof payload.error === 'object') {
        payload.error = normalizeDeleteBlockers(payload.error);
      }
      throw error;
    }
  },
  getGlobalStats: async () => transformAnalytics(await get(`${apiRoutes.organizations}/global-stats`, undefined, 'Failed to load platform aggregate statistics')),
  getJoinCode: (id) => get(`${apiRoutes.organizations}/${id}/join-code`, undefined, 'Failed to fetch join code'),
  regenerateJoinCode: (id) => post(`${apiRoutes.organizations}/${id}/join-code/regenerate`, undefined, undefined, 'Failed to regenerate join code'),
  updateStatus: (id, payload) => patch(`${apiRoutes.organizations}/${id}/status`, payload, undefined, 'Failed to update organization status'),
  updateSelfSignup: (id, payload) => patch(`${apiRoutes.organizations}/${id}/self-signup`, payload, undefined, 'Failed to update organization settings'),
  createAdmin: (id, payload) => post(`${apiRoutes.organizations}/${id}/admin`, payload, undefined, 'Failed to create organization admin')
};

export const publicOrganizationsApi = {
  list: async () => transformOrganizationCollection(await get(apiRoutes.publicOrganizations, { skipAuth: true }, 'Failed to fetch organizations')),
  getJoinDetails: (code) => get(`${apiRoutes.publicOrganizations}/join/${encodeURIComponent(code)}`, { skipAuth: true }, 'Failed to validate join code'),
  getDepartments: (organizationId) => get(`${apiRoutes.publicOrganizations}/${organizationId}/departments`, { skipAuth: true }, 'Failed to fetch departments')
};

export const departmentsApi = {
  list: async () => transformDepartmentCollection(await get(apiRoutes.departments, undefined, 'Failed to fetch departments')),
  create: async (payload) => transformDepartment(await post(apiRoutes.departments, withLegacyAssessmentField(payload), undefined, 'Failed to save department')),
  update: async (id, payload) => transformDepartment(await put(`${apiRoutes.departments}/${id}`, withLegacyAssessmentField(payload), undefined, 'Failed to save department')),
  remove: (id) => remove(`${apiRoutes.departments}/${id}`, undefined, 'Failed to delete department')
};

export const assessmentsApi = {
  list: () => get(apiRoutes.assessments, undefined, 'Failed to fetch assessments'),
  create: (payload) => post(apiRoutes.assessments, payload, undefined, 'Failed to save assessment'),
  update: (id, payload) => put(`${apiRoutes.assessments}/${id}`, payload, undefined, 'Failed to save assessment'),
  remove: (id) => remove(`${apiRoutes.assessments}/${id}`, undefined, 'Failed to delete assessment')
};

export const escalationsApi = {
  list: async () => transformEscalationCollection(await get(apiRoutes.escalations, undefined, 'Failed to fetch escalations')),
  create: async (payload) => transformEscalation(await post(apiRoutes.escalations, withLegacyAssessmentField(payload), undefined, 'Failed to save escalation')),
  update: async (id, payload) => transformEscalation(await put(`${apiRoutes.escalations}/${id}`, withLegacyAssessmentField(payload), undefined, 'Failed to save escalation')),
  updateStatus: async (id, payload) => transformEscalation(await patch(`${apiRoutes.escalations}/${id}/status`, payload, undefined, 'Failed to mark escalation resolved')),
  remove: (id) => remove(`${apiRoutes.escalations}/${id}`, undefined, 'Failed to delete escalation')
};

export const statusLogsApi = {
  list: async () => transformStatusLogCollection(await get(apiRoutes.statusLogs, undefined, 'Failed to fetch status logs'))
};

export const notificationsApi = {
  list: async () => transformNotificationCollection(await get(apiRoutes.notifications, undefined, 'Failed to fetch notifications')),
  create: async (payload) => transformNotification(await post(apiRoutes.notifications, payload, undefined, 'Failed to create notification')),
  markRead: async (id) => transformNotification(await patch(`${apiRoutes.notifications}/${id}/read`, undefined, undefined, 'Failed to mark notification as read')),
  remove: (id) => remove(`${apiRoutes.notifications}/${id}`, undefined, 'Failed to delete notification')
};

export const feedbackApi = {
  list: async () => transformFeedbackCollection(await get(apiRoutes.feedback, undefined, 'Failed to fetch feedback')),
  create: async (payload) => transformFeedback(await post(apiRoutes.feedback, payload, undefined, 'Failed to save feedback')),
  update: async (id, payload) => transformFeedback(await put(`${apiRoutes.feedback}/${id}`, payload, undefined, 'Failed to save feedback')),
  remove: (id) => remove(`${apiRoutes.feedback}/${id}`, undefined, 'Failed to delete feedback')
};

export const publicFeedbackApi = {
  getPublicForm: async (slug) => transformPublicFeedbackForm(await get(`${apiRoutes.publicFeedbackPublic}/${encodeURIComponent(slug)}`, { skipAuth: true }, 'Failed to load public feedback form')),
  submitPublicSubmission: async (slug, payload) => transformPublicFeedbackSubmission(await post(`${apiRoutes.publicFeedbackPublic}/${encodeURIComponent(slug)}/submit`, payload, { skipAuth: true }, 'Failed to submit public feedback')),
  getManagedForm: async () => transformPublicFeedbackForm(await get(`${apiRoutes.feedback}/forms/current`, undefined, 'Failed to load feedback form')),
  createManagedForm: async (payload) => transformPublicFeedbackForm(await post(`${apiRoutes.feedback}/forms/current`, payload, undefined, 'Failed to create feedback form')),
  updateManagedForm: async (payload) => transformPublicFeedbackForm(await put(`${apiRoutes.feedback}/forms/current`, payload, undefined, 'Failed to save feedback form')),
  createField: async (payload) => transformPublicFeedbackForm(await post(`${apiRoutes.feedback}/forms/current/fields`, payload, undefined, 'Failed to create feedback field')),
  updateField: async (fieldId, payload) => transformPublicFeedbackForm(await put(`${apiRoutes.feedback}/forms/current/fields/${fieldId}`, payload, undefined, 'Failed to update feedback field')),
  deleteField: async (fieldId) => transformPublicFeedbackForm(await remove(`${apiRoutes.feedback}/forms/current/fields/${fieldId}`, undefined, 'Failed to delete feedback field')),
  reorderFields: async (fieldIds) => transformPublicFeedbackForm(await put(`${apiRoutes.feedback}/forms/current/fields/reorder`, { field_ids: fieldIds }, undefined, 'Failed to reorder feedback fields')),
  getQr: (config) => get(`${apiRoutes.feedback}/forms/current/qr`, config, 'Failed to load feedback QR details'),
  listManagedSubmissions: async (params = {}) => transformPublicFeedbackSubmissionList(await get(`${apiRoutes.feedback}/submissions/current`, { params }, 'Failed to load feedback submissions')),
  getSubmissionById: async (id) => transformPublicFeedbackSubmission(await get(`${apiRoutes.feedback}/submissions/current/${id}`, undefined, 'Failed to load feedback submission')),
  getSystemAnalytics: async () => transformPublicFeedbackAnalytics(await get(`${apiRoutes.feedback}/analytics/public/system`, undefined, 'Failed to load public feedback analytics'))
};

export const testimonialsApi = {
  listPublic: () => get(`${apiRoutes.testimonials}/public`, { skipAuth: true }, 'Failed to fetch testimonials'),
  list: () => get(apiRoutes.testimonials, undefined, 'Failed to fetch testimonials'),
  create: (payload) => post(apiRoutes.testimonials, payload, undefined, 'Failed to submit testimonial'),
  approve: (id) => patch(`${apiRoutes.testimonials}/${id}/approve`, undefined, undefined, 'Failed to approve testimonial'),
  reject: (id) => patch(`${apiRoutes.testimonials}/${id}/reject`, undefined, undefined, 'Failed to reject testimonial'),
  remove: (id) => remove(`${apiRoutes.testimonials}/${id}`, undefined, 'Failed to delete testimonial')
};

export const complaintMessagesApi = {
  list: (complaintId) => get(`${apiRoutes.complaintMessages}/${complaintId}`, undefined, 'Failed to fetch chat messages'),
  create: (complaintId, payload) => post(`${apiRoutes.complaintMessages}/${complaintId}`, payload, undefined, 'Failed to send message'),
  update: (complaintId, messageId, payload) => put(`${apiRoutes.complaintMessages}/${complaintId}/${messageId}`, payload, undefined, 'Failed to update message'),
  remove: (complaintId, messageId) => remove(`${apiRoutes.complaintMessages}/${complaintId}/${messageId}`, undefined, 'Failed to delete message')
};

export const platformSettingsApi = {
  get: () => get(apiRoutes.platformSettings, undefined, 'Failed to fetch platform settings'),
  update: (payload) => put(apiRoutes.platformSettings, payload, undefined, 'Failed to update platform settings')
};

export const auditLogsApi = {
  list: (config) => get(apiRoutes.auditLogs, config, 'Failed to fetch audit logs')
};

export const emailApi = {
  contact: (payload) => post(`${apiRoutes.email}/contact`, payload, { skipAuth: true }, 'Unable to send your message right now.')
};

export const joinCodesApi = {
  pending: () => get(`${apiRoutes.joinCodes}/pending`, undefined, 'Failed to fetch pending members'),
  regenerate: () => patch(`${apiRoutes.joinCodes}/regenerate`, undefined, undefined, 'Failed to regenerate join code'),
  approve: (userId) => patch(`${apiRoutes.joinCodes}/approve/${userId}`, undefined, undefined, 'Failed to approve member'),
  reject: (userId) => remove(`${apiRoutes.joinCodes}/reject/${userId}`, undefined, 'Failed to reject member')
};

export const settingsApi = {
  getOrganizationCurrent: async () => transformOrganizationSettings(await get(`${apiRoutes.settings}/organization/current`, undefined, 'Failed to load organization settings')),
  updateOrganizationCurrent: async (payload) => transformOrganizationSettings(await put(`${apiRoutes.settings}/organization/current`, payload, undefined, 'Failed to save organization settings')),
  getUserCurrent: async () => transformUserSettings(await get(`${apiRoutes.settings}/user/current`, undefined, 'Failed to load user settings')),
  updateUserCurrent: async (payload) => transformUserSettings(await put(`${apiRoutes.settings}/user/current`, payload, undefined, 'Failed to save user settings'))
};
