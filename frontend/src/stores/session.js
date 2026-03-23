import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api, { extractApiError, unwrapResponse } from '../services/api';
import { useRouter } from 'vue-router';

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
  const loadingForgotPassword = ref(false);
  const loadingRequestResetToken = ref(false);
  const loadingGoogleLogin = ref(false);
  const loadingRecentOrganizations = ref(false);
  const recentOrganizationsError = ref('');
  const loadingDashboard = ref(false);
  const dashboardError = ref('');

  const loginForm = ref({
    email: '',
    password: ''
  });

  const recentOrganizations = ref([
    { name: 'Acme Corp', status: 'Active', complaints: 342, lastActive: '2026-03-01' },
    { name: 'TechStart', status: 'Active', complaints: 198, lastActive: '2026-02-28' },
    { name: 'Sunrise NGO', status: 'Inactive', complaints: 45, lastActive: '2026-02-21' }
  ]);

  const activityFeed = ref([
    { text: 'New complaint filed by user123', date: '2026-03-02', tone: 'bg-blue-100 text-blue-900' },
    { text: 'Organization TechStart activated', date: '2026-03-01', tone: 'bg-blue-100 text-blue-900' },
    { text: 'Escalation moved to level_2', date: '2026-02-27', tone: 'bg-slate-100 text-slate-900' }
  ]);

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
      const loginPaths = [`${USERS_API_BASE}/login`, '/users/login'];
      let data = null;
      let lastError = null;

      for (const path of loginPaths) {
        try {
          const response = await api.post(path, payload, { skipAuth: true });
          data = ensureSuccess(unwrapResponse(response), 'Login failed');
          break;
        } catch (requestError) {
          lastError = requestError;
        }
      }

      if (!data) {
        throw lastError || new Error('Login failed');
      }

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
      token.value = '';
      currentUser.value = null;
      currentOrganizationName.value = '';
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

  //Older version of logout button logic
  // const logout = async () => {
  //   if (!token.value) return;

  //   try {
  //     await api.post(`${USERS_API_BASE}/logout`);
  //   } finally {
  //     token.value = '';
  //     currentUser.value = null;
  //     currentOrganizationName.value = '';
  //     localStorage.removeItem('token');
  //   }
  // };


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
      window.location.href = '/';
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

  const requestPasswordResetToken = async (payload) => {
    errorMessage.value = '';
    loadingRequestResetToken.value = true;

    try {
      const response = await api.post(`${USERS_API_BASE}/forgot-password/request`, payload, { skipAuth: true });
      return ensureSuccess(unwrapResponse(response), 'Failed to request password reset token');
    } catch (error) {
      errorMessage.value = getReadableError(error, 'Failed to request password reset token');
      throw error;
    } finally {
      loadingRequestResetToken.value = false;
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

  const toUiStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const toUiDate = (row) => {
    const raw = row.updated_at || row.created_at;
    if (!raw) return 'N/A';
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString().slice(0, 10);
  };

  const normalizeDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const formatFeedDate = (date) => {
    if (!date) return 'N/A';
    return date.toISOString().slice(0, 10);
  };

  const buildActivityFeed = ({ complaints = [], statusLogs = [], escalations = [] }) => {
    const complaintItems = complaints.map((row) => ({
      text: `New complaint: ${row.title || 'Untitled'} (${row.tracking_code || 'no-tracking'})`,
      tone: 'bg-blue-100 text-blue-900',
      when: normalizeDate(row.created_at) || new Date(0)
    }));

    const statusLogItems = statusLogs.map((row) => ({
      text: `Status log for assessment #${row.accessment_id}: ${row.old_status || 'none'} -> ${row.new_status}`,
      tone: 'bg-blue-100 text-blue-900',
      when: normalizeDate(row.created_at) || new Date(0)
    }));

    const escalationItems = escalations.map((row) => ({
      text: `Escalation #${row.id}: ${row.escalation_level} (${row.status})`,
      tone: 'bg-slate-100 text-slate-900',
      when: normalizeDate(row.updated_at || row.created_at) || new Date(0)
    }));

    return [...complaintItems, ...statusLogItems, ...escalationItems]
      .sort((a, b) => b.when - a.when)
      .slice(0, 12)
      .map((item) => ({
        text: item.text,
        tone: item.tone,
        date: formatFeedDate(item.when)
      }));
  };

  const fetchRecentOrganizations = async () => {
    loadingRecentOrganizations.value = true;
    recentOrganizationsError.value = '';

    try {
      const response = await api.get('/organization');
      const rows = ensureSuccess(unwrapResponse(response), 'Failed to fetch organizations');
      recentOrganizations.value = (rows || []).slice(0, 10).map((row) => ({
        id: row.organization_id,
        name: row.name || 'Unnamed',
        email: row.email || '',
        type: row.organization_type || '',
        status: toUiStatus(row.status),
        complaints: Number(row.complaints_count || row.complaints || 0),
        lastActive: toUiDate(row),
        organization_admin: row.organization_admin || null
      }));
    } catch (error) {
      recentOrganizationsError.value = getReadableError(error, 'Failed to fetch organizations');
    } finally {
      loadingRecentOrganizations.value = false;
    }
  };

  const loadDashboardData = async () => {
    loadingDashboard.value = true;
    dashboardError.value = '';

    try {
      const activeRole = currentUser.value?.role || decodeTokenPayload(token.value)?.role || '';

      if (activeRole === 'super_admin') {
        const [orgRes, statsRes] = await Promise.all([
          api.get('/organization'),
          api.get('/organization/global-stats')
        ]);

        const organizations = ensureSuccess(unwrapResponse(orgRes), 'Failed to fetch organizations');
        const stats = ensureSuccess(unwrapResponse(statsRes), 'Failed to load platform aggregate statistics');
        const orgRows = organizations || [];

        recentOrganizations.value = orgRows.slice(0, 10).map((row) => ({
          id: row.organization_id,
          name: row.name || 'Unnamed',
          email: row.email || '',
          type: row.organization_type || '',
          status: toUiStatus(row.status),
          complaints: Number(row.complaints_count || 0),
          lastActive: toUiDate(row),
          organization_admin: row.organization_admin || null
        }));

        dashboardStats.value = {
          totalOrganizations: Number(stats.totalOrganizations || 0),
          activeOrganizations: Number(stats.activeOrganizations || 0),
          suspendedOrganizations: Number(stats.suspendedOrganizations || 0),
          unassignedAnonymousComplaints: Number(stats.unassignedAnonymousComplaints || 0),
          totalComplaints: Number(stats.totalComplaints || 0),
          submittedComplaints: Number(stats.submittedComplaints || 0),
          inReviewComplaints: Number(stats.inReviewComplaints || 0),
          resolvedComplaints: Number(stats.resolvedComplaints || 0),
          closedComplaints: Number(stats.closedComplaints || 0),
          complaintsByOrganization: (stats.complaintsByOrganization || []).map((row) => ({
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

        activityFeed.value = (stats.activityFeed || []).slice(0, 12).map((item, index) => ({
          text: item.text || `Platform activity #${index + 1}`,
          tone: index % 2 === 0 ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-900',
          date: item.date ? toUiDate({ updated_at: item.date }) : 'N/A'
        }));
        return;
      }

      const [orgRes, complaintRes, statusLogRes, escalationRes] = await Promise.all([
        api.get('/organization'),
        api.get('/complaint'),
        api.get('/status-logs'),
        api.get('/escalations')
      ]);

      const organizations = ensureSuccess(unwrapResponse(orgRes), 'Failed to fetch organizations');
      const complaints = ensureSuccess(unwrapResponse(complaintRes), 'Failed to fetch complaints');
      const statusLogs = ensureSuccess(unwrapResponse(statusLogRes), 'Failed to fetch status logs');
      const escalations = ensureSuccess(unwrapResponse(escalationRes), 'Failed to fetch escalations');

      const orgRows = organizations || [];
      const complaintRows = complaints || [];

      recentOrganizations.value = orgRows.slice(0, 10).map((row) => ({
        id: row.organization_id,
        name: row.name || 'Unnamed',
        status: toUiStatus(row.status),
        complaints: Number(row.complaints_count || row.complaints || 0),
        lastActive: toUiDate(row)
      }));

      dashboardStats.value = {
        totalOrganizations: orgRows.length,
        activeOrganizations: orgRows.filter((row) => String(row.status).toLowerCase() === 'active').length,
        suspendedOrganizations: orgRows.filter((row) => String(row.status).toLowerCase() !== 'active').length,
        unassignedAnonymousComplaints: 0,
        totalComplaints: complaintRows.length,
        submittedComplaints: complaintRows.filter((row) => row.status === 'submitted').length,
        inReviewComplaints: complaintRows.filter((row) => row.status === 'in_review').length,
        resolvedComplaints: complaintRows.filter((row) => row.status === 'resolved').length,
        closedComplaints: complaintRows.filter((row) => row.status === 'closed').length
      };

      activityFeed.value = buildActivityFeed({
        complaints: complaintRows,
        statusLogs: statusLogs || [],
        escalations: escalations || []
      });
    } catch (error) {
      dashboardError.value = getReadableError(error, 'Failed to load dashboard');
      if (!recentOrganizationsError.value) {
        recentOrganizationsError.value = dashboardError.value;
      }
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
    loadingForgotPassword,
    loadingRequestResetToken,
    loadingGoogleLogin,
    loadingRecentOrganizations,
    loadingDashboard,
    recentOrganizationsError,
    dashboardError,
    loginForm,
    recentOrganizations,
    activityFeed,
    dashboardStats,
    isSuperAdmin,
    isOrgAdmin,
    isAdminFamily,
    isLoggedIn,
    mustChangePassword,
    userInitials,
    apiRequest,
    fetchCurrentUser,
    fetchRecentOrganizations,
    loadDashboardData,
    login,
    register,
    googleLogin,
    forgotPassword,
    completePasswordReset,
    requestPasswordResetToken,
    changePassword,
    logout
  };
});
