import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api, { extractApiError, unwrapResponse } from '../services/api';

const API_ROOT = import.meta.env.VITE_API_BASE_URL || '/api';
const USERS_API_BASE = import.meta.env.VITE_API_URL || '/users';

export const useSessionStore = defineStore('session', () => {
  const token = ref(localStorage.getItem('token') || '');
  const currentUser = ref(null);
  const currentOrganizationName = ref('');
  const errorMessage = ref('');
  const pendingVerificationEmail = ref('');
  const loadingLogin = ref(false);
  const loadingRegister = ref(false);
  const loadingPasswordChange = ref(false);
  const loadingEmailChange = ref(false);
  const loadingForgotPassword = ref(false);
  const loadingRequestResetCode = ref(false);
  const loadingGoogleLogin = ref(false);
  const loadingDashboard = ref(false);
  const dashboardError = ref('');

  const loginForm = ref({
    email: '',
    password: ''
  });

  const dashboardStats = ref({
    totalOrganizations: 0,
    activeOrganizations: 0,
    suspendedOrganizations: 0,
    unassignedAnonymousComplaints: 0,
    totalComplaints: 0,
    submittedComplaints: 0,
    inReviewComplaints: 0,
    resolvedComplaints: 0,
    closedComplaints: 0,
    complaintsByOrganization: [],
    escalationStatusCounts: {
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0
    },
    feedbackSummary: {
      total: 0,
      average: 0,
      byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    complaintMonthlyTrend: [],
    assessmentMonthlyTrend: []
  });

  const decodeTokenPayload = (rawToken) => {
    if (!rawToken) return null;
    const parts = String(rawToken).split('.');
    if (parts.length !== 3) return null;

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch (_error) {
      return null;
    }
  };

  const applyAuthPayload = (data) => {
    token.value = data?.token || '';
    currentUser.value = data?.user || null;
    currentOrganizationName.value = '';

    if (token.value) {
      localStorage.setItem('token', token.value);
    } else {
      localStorage.removeItem('token');
    }
  };

  const isLoggedIn = computed(() => Boolean(token.value));
  const isSuperAdmin = computed(() => currentUser.value?.role === 'super_admin');
  const isOrgAdmin = computed(() => currentUser.value?.role === 'org_admin');
  const isAdminFamily = computed(() => isSuperAdmin.value || isOrgAdmin.value);
  const mustChangePassword = computed(() => Number(currentUser.value?.must_change_password ?? decodeTokenPayload(token.value)?.must_change_password ?? 0) === 1);

  const userInitials = computed(() => {
    if (!currentUser.value?.full_name) return 'U';
    return currentUser.value.full_name
      .split(' ')
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase() || '')
      .join('');
  });

  const toRequestData = (body) => {
    if (!body) return undefined;
    if (typeof body !== 'string') return body;
    try {
      return JSON.parse(body);
    } catch (_error) {
      return body;
    }
  };

  const ensureSuccess = (payload, fallbackMessage) => {
    if (!payload?.success) {
      throw new Error(payload?.message || fallbackMessage);
    }
    return payload.data;
  };

  const apiRequest = async (path, options = {}, requiresAuth = true) => {
    const response = await api.request({
      url: path,
      method: options.method || 'GET',
      data: options.data ?? toRequestData(options.body),
      headers: options.headers || {},
      skipAuth: !requiresAuth
    });

    return ensureSuccess(unwrapResponse(response), 'Request failed');
  };

  const getReadableError = (error, fallbackMessage) => {
    return extractApiError(error, fallbackMessage);
  };

  const fetchCurrentUser = async () => {
    if (!token.value) return;

    try {
      const response = await api.get(`${USERS_API_BASE}/me`);
      currentUser.value = ensureSuccess(unwrapResponse(response), 'Failed to load profile');

      if (currentUser.value?.organization_id) {
        try {
          const orgResponse = await api.get('/organization');
          const organizations = ensureSuccess(unwrapResponse(orgResponse), 'Failed to load organization');
          const activeOrganization = (organizations || []).find(
            (row) => Number(row.organization_id) === Number(currentUser.value?.organization_id)
          );
          currentOrganizationName.value = activeOrganization?.name || '';
        } catch (_orgError) {
          currentOrganizationName.value = '';
        }
      } else {
        currentOrganizationName.value = '';
      }
    } catch (_error) {
      token.value = '';
      currentUser.value = null;
      currentOrganizationName.value = '';
      localStorage.removeItem('token');
    }
  };

  const login = async () => {
    errorMessage.value = '';
    loadingLogin.value = true;

    try {
      const payload = {
        email: String(loginForm.value.email || '').trim().toLowerCase(),
        password: String(loginForm.value.password || '').trim()
      };
      const response = await api.post(`${USERS_API_BASE}/login`, payload, { skipAuth: true });
      const data = ensureSuccess(unwrapResponse(response), 'Login failed');

      applyAuthPayload(data);
      pendingVerificationEmail.value = '';
      loginForm.value.password = '';
    } catch (error) {
      errorMessage.value = getReadableError(error, 'Login failed');
      if (/verify your email/i.test(errorMessage.value)) {
        pendingVerificationEmail.value = String(loginForm.value.email || '').trim().toLowerCase();
      }
    } finally {
      loadingLogin.value = false;
    }
  };

  const register = async (payload) => {
    errorMessage.value = '';
    loadingRegister.value = true;

    try {
      const normalizedPayload = {
        ...payload,
        email: String(payload?.email || '').trim().toLowerCase()
      };
      const response = await api.post(`${USERS_API_BASE}/register`, normalizedPayload, { skipAuth: true });
      const data = ensureSuccess(unwrapResponse(response), 'Sign up failed');
      if (data?.token) {
        applyAuthPayload(data);
        pendingVerificationEmail.value = '';
      } else {
        token.value = '';
        currentUser.value = null;
        currentOrganizationName.value = '';
        localStorage.removeItem('token');
        pendingVerificationEmail.value = normalizedPayload.email;
      }
      return data;
    } catch (error) {
      errorMessage.value = getReadableError(error, 'Sign up failed');
      throw error;
    } finally {
      loadingRegister.value = false;
    }
  };

  const registerWithJoinCode = async (payload) => {
    errorMessage.value = '';
    loadingRegister.value = true;

    try {
      const normalizedPayload = {
        ...payload,
        email: String(payload?.email || '').trim().toLowerCase(),
        join_code: String(payload?.join_code || '').trim().toUpperCase()
      };
      const response = await api.post(`${USERS_API_BASE}/register-with-code`, normalizedPayload, { skipAuth: true });
      const data = ensureSuccess(unwrapResponse(response), 'Sign up failed');
      if (data?.token) {
        applyAuthPayload(data);
        pendingVerificationEmail.value = '';
      } else {
        token.value = '';
        currentUser.value = null;
        currentOrganizationName.value = '';
        localStorage.removeItem('token');
        pendingVerificationEmail.value = normalizedPayload.email;
      }
      return data;
    } catch (error) {
      errorMessage.value = getReadableError(error, 'Sign up failed');
      throw error;
    } finally {
      loadingRegister.value = false;
    }
  };

  const logout = async () => {
    if (!token.value) return;

    try {
      await api.post(`${USERS_API_BASE}/logout`);
    } finally {
      token.value = '';
      currentUser.value = null;
      currentOrganizationName.value = '';
      pendingVerificationEmail.value = '';
      localStorage.removeItem('token');
    }
  };

  const changePassword = async (payload) => {
    errorMessage.value = '';
    loadingPasswordChange.value = true;

    try {
      const response = await api.post(`${USERS_API_BASE}/change-password`, payload);
      const data = ensureSuccess(unwrapResponse(response), 'Password change failed');
      applyAuthPayload(data);
      return data;
    } catch (error) {
      errorMessage.value = getReadableError(error, 'Password change failed');
      throw error;
    } finally {
      loadingPasswordChange.value = false;
    }
  };

  const changeEmail = async (payload) => {
    errorMessage.value = '';
    loadingEmailChange.value = true;

    try {
      const response = await api.post(`${USERS_API_BASE}/change-email`, payload);
      const data = ensureSuccess(unwrapResponse(response), 'Email change failed');
      currentUser.value = data?.user || currentUser.value;
      if (payload?.new_email) {
        pendingVerificationEmail.value = String(payload.new_email || '').trim().toLowerCase();
      }
      return data;
    } catch (error) {
      errorMessage.value = getReadableError(error, 'Email change failed');
      throw error;
    } finally {
      loadingEmailChange.value = false;
    }
  };

  const requestPasswordResetCode = async (payload) => {
    errorMessage.value = '';
    loadingRequestResetCode.value = true;

    try {
      const response = await api.post(`${USERS_API_BASE}/forgot-password/request`, payload, { skipAuth: true });
      return ensureSuccess(unwrapResponse(response), 'Failed to request password reset code');
    } catch (error) {
      errorMessage.value = getReadableError(error, 'Failed to request password reset code');
      throw error;
    } finally {
      loadingRequestResetCode.value = false;
    }
  };

  const completePasswordReset = async (payload) => {
    errorMessage.value = '';
    loadingForgotPassword.value = true;

    try {
      const response = await api.post(`${USERS_API_BASE}/forgot-password`, payload, { skipAuth: true });
      const data = ensureSuccess(unwrapResponse(response), 'Password reset failed');
      applyAuthPayload(data);
      return data;
    } catch (error) {
      errorMessage.value = getReadableError(error, 'Password reset failed');
      throw error;
    } finally {
      loadingForgotPassword.value = false;
    }
  };

  const forgotPassword = completePasswordReset;
  const requestPasswordResetToken = requestPasswordResetCode;

  const googleLogin = async (credential) => {
    errorMessage.value = '';
    loadingGoogleLogin.value = true;

    try {
      const response = await api.post(`${USERS_API_BASE}/google-login`, { credential }, { skipAuth: true });
      const data = ensureSuccess(unwrapResponse(response), 'Google login failed');
      applyAuthPayload(data);
      pendingVerificationEmail.value = '';
      return data;
    } catch (error) {
      errorMessage.value = getReadableError(error, 'Google login failed');
      throw error;
    } finally {
      loadingGoogleLogin.value = false;
    }
  };

  const loadDashboardData = async () => {
    loadingDashboard.value = true;
    dashboardError.value = '';

    try {
      const activeRole = currentUser.value?.role || decodeTokenPayload(token.value)?.role || '';

      if (activeRole !== 'super_admin') {
        dashboardStats.value = {
          totalOrganizations: 0,
          activeOrganizations: 0,
          suspendedOrganizations: 0,
          unassignedAnonymousComplaints: 0,
          totalComplaints: 0,
          submittedComplaints: 0,
          inReviewComplaints: 0,
          resolvedComplaints: 0,
          closedComplaints: 0,
          complaintsByOrganization: [],
          escalationStatusCounts: {
            pending: 0,
            in_progress: 0,
            resolved: 0,
            rejected: 0
          },
          feedbackSummary: {
            total: 0,
            average: 0,
            byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          complaintMonthlyTrend: [],
          assessmentMonthlyTrend: []
        };
        return;
      }

      const [orgRes, statsRes] = await Promise.all([
        api.get('/organization'),
        api.get('/organization/global-stats')
      ]);

      const organizations = ensureSuccess(unwrapResponse(orgRes), 'Failed to fetch organizations');
      const stats = ensureSuccess(unwrapResponse(statsRes), 'Failed to load platform aggregate statistics');

      const orgRows = organizations || [];

      dashboardStats.value = {
        totalOrganizations: Number(stats.totalOrganizations || orgRows.length || 0),
        activeOrganizations: Number(stats.activeOrganizations || 0),
        suspendedOrganizations: Number(stats.suspendedOrganizations || 0),
        unassignedAnonymousComplaints: Number(stats.unassignedAnonymousComplaints || 0),
        totalComplaints: Number(stats.totalComplaints || 0),
        submittedComplaints: Number(stats.submittedComplaints || 0),
        inReviewComplaints: Number(stats.inReviewComplaints || 0),
        resolvedComplaints: Number(stats.resolvedComplaints || 0),
        closedComplaints: Number(stats.closedComplaints || 0),
        complaintsByOrganization: (stats.complaintsByOrganization || []).map((row) => ({
          organization_id: row.organization_id,
          label: row.name || 'Unnamed',
          value: Number(row.complaints || 0)
        })),
        escalationStatusCounts: stats.escalationStatusCounts || {
          pending: 0,
          in_progress: 0,
          resolved: 0,
          rejected: 0
        },
        feedbackSummary: stats.feedbackSummary || {
          total: 0,
          average: 0,
          byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        },
        complaintMonthlyTrend: (stats.complaintMonthlyTrend || []).map((row) => ({
          label: row.month || '',
          value: Number(row.value || 0)
        })),
        assessmentMonthlyTrend: (stats.assessmentMonthlyTrend || []).map((row) => ({
          label: row.month || '',
          value: Number(row.value || 0)
        }))
      };
    } catch (error) {
      dashboardError.value = getReadableError(error, 'Failed to load dashboard');
    } finally {
      loadingDashboard.value = false;
    }
  };

  return {
    API_ROOT,
    token,
    currentUser,
    currentOrganizationName,
    errorMessage,
    pendingVerificationEmail,
    loadingLogin,
    loadingRegister,
    loadingPasswordChange,
    loadingEmailChange,
    loadingForgotPassword,
    loadingRequestResetCode,
    loadingGoogleLogin,
    loadingDashboard,
    dashboardError,
    loginForm,
    dashboardStats,
    isSuperAdmin,
    isOrgAdmin,
    isAdminFamily,
    isLoggedIn,
    mustChangePassword,
    userInitials,
    apiRequest,
    fetchCurrentUser,
    loadDashboardData,
    login,
    register,
    registerWithJoinCode,
    googleLogin,
    forgotPassword,
    completePasswordReset,
    requestPasswordResetCode,
    requestPasswordResetToken,
    changePassword,
    changeEmail,
    logout
  };
});
