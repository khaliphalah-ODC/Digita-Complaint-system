import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  API_BASE_URL,
  authApi,
  extractApiError,
  organizationsApi,
  transformAnalytics,
  request
} from '../services/api';

const API_ROOT = API_BASE_URL;
const emptyDashboardStats = () => ({
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

export const useSessionStore = defineStore('session', () => {
  const token = ref(localStorage.getItem('token') || '');
  const currentUser = ref(null);
  const currentOrganizationName = ref('');
  const currentOrganizationLogo = ref('');
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

  const dashboardStats = ref(emptyDashboardStats());

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
    currentOrganizationLogo.value = '';

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

  const apiRequest = async (path, options = {}, requiresAuth = true) => {
    return request({
      url: path,
      method: options.method || 'GET',
      data: options.data ?? toRequestData(options.body),
      headers: options.headers || {},
      skipAuth: !requiresAuth
    }, 'Request failed');
  };

  const getReadableError = (error, fallbackMessage) => {
    return extractApiError(error, fallbackMessage);
  };

  const fetchCurrentUser = async () => {
    if (!token.value) return;

    try {
      currentUser.value = await authApi.me();

      if (currentUser.value?.organization_id) {
        try {
          const organizations = await organizationsApi.list();
          const activeOrganization = (organizations || []).find(
            (row) => Number(row.organization_id) === Number(currentUser.value?.organization_id)
          );
          currentOrganizationName.value = activeOrganization?.name || '';
          currentOrganizationLogo.value = activeOrganization?.logo || '';
        } catch (_orgError) {
          currentOrganizationName.value = '';
          currentOrganizationLogo.value = '';
        }
      } else {
        currentOrganizationName.value = '';
        currentOrganizationLogo.value = '';
      }
    } catch (_error) {
      token.value = '';
      currentUser.value = null;
      currentOrganizationName.value = '';
      currentOrganizationLogo.value = '';
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
      const data = await authApi.login(payload);

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
      const data = await authApi.register(normalizedPayload);
      token.value = '';
      currentUser.value = null;
      currentOrganizationName.value = '';
      currentOrganizationLogo.value = '';
      localStorage.removeItem('token');
      pendingVerificationEmail.value = normalizedPayload.email;
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
      const data = await authApi.registerWithJoinCode(normalizedPayload);
      token.value = '';
      currentUser.value = null;
      currentOrganizationName.value = '';
      currentOrganizationLogo.value = '';
      localStorage.removeItem('token');
      pendingVerificationEmail.value = normalizedPayload.email;
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
      await authApi.logout();
    } finally {
      token.value = '';
      currentUser.value = null;
      currentOrganizationName.value = '';
      currentOrganizationLogo.value = '';
      pendingVerificationEmail.value = '';
      localStorage.removeItem('token');
    }
  };

  const changePassword = async (payload) => {
    errorMessage.value = '';
    loadingPasswordChange.value = true;

    try {
      const data = await authApi.changePassword(payload);
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
      const data = await authApi.changeEmail(payload);
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
      return await authApi.requestPasswordResetCode(payload);
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
      const data = await authApi.resetPassword(payload);
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
      const data = await authApi.googleLogin(credential);
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
        dashboardStats.value = emptyDashboardStats();
        return;
      }

      const [organizations, stats] = await Promise.all([
        organizationsApi.list(),
        organizationsApi.getGlobalStats()
      ]);

      const orgRows = organizations || [];
      dashboardStats.value = {
        ...emptyDashboardStats(),
        ...transformAnalytics({
          ...stats,
          totalOrganizations: Number(stats.totalOrganizations || orgRows.length || 0)
        })
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
    currentOrganizationLogo,
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
