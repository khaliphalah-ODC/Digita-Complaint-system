import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api, { extractApiError, unwrapResponse } from '../services/api';

const API_ROOT = import.meta.env.VITE_API_BASE_URL || '/api';
const USERS_API_BASE = import.meta.env.VITE_API_URL || '/users';

export const useSessionStore = defineStore('session', () => {
  const token = ref(localStorage.getItem('token') || '');
  const currentUser = ref(null);
  const errorMessage = ref('');
  const loadingLogin = ref(false);
  const loadingRegister = ref(false);
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
    { text: 'New complaint filed by user123', date: '2026-03-02', tone: 'bg-amber-100 text-amber-900' },
    { text: 'Organization TechStart activated', date: '2026-03-01', tone: 'bg-blue-100 text-blue-900' },
    { text: 'Escalation moved to level_2', date: '2026-02-27', tone: 'bg-slate-100 text-slate-900' }
  ]);

  const dashboardStats = ref({
    totalOrganizations: 0,
    activeOrganizations: 0,
    suspendedOrganizations: 0,
    totalComplaints: 0,
    submittedComplaints: 0,
    inReviewComplaints: 0,
    resolvedComplaints: 0,
    closedComplaints: 0
  });

  const isLoggedIn = computed(() => Boolean(token.value));

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
    } catch (_error) {
      token.value = '';
      currentUser.value = null;
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

      token.value = data.token;
      currentUser.value = data.user;
      localStorage.setItem('token', token.value);
      loginForm.value.password = '';
    } catch (error) {
      errorMessage.value = getReadableError(error, 'Login failed');
    } finally {
      loadingLogin.value = false;
    }
  };

  const register = async (payload) => {
    errorMessage.value = '';
    loadingRegister.value = true;

    try {
      const response = await api.post(`${USERS_API_BASE}/register`, payload, { skipAuth: true });
      const data = ensureSuccess(unwrapResponse(response), 'Sign up failed');

      token.value = data.token;
      currentUser.value = data.user;
      localStorage.setItem('token', token.value);
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
      localStorage.removeItem('token');
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
      tone: 'bg-amber-100 text-amber-900',
      when: normalizeDate(row.created_at) || new Date(0)
    }));

    const statusLogItems = statusLogs.map((row) => ({
      text: `Status log for accessment #${row.accessment_id}: ${row.old_status || 'none'} -> ${row.new_status}`,
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
        status: toUiStatus(row.status),
        complaints: Number(row.complaints_count || row.complaints || 0),
        lastActive: toUiDate(row)
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
    errorMessage,
    loadingLogin,
    loadingRegister,
    loadingRecentOrganizations,
    loadingDashboard,
    recentOrganizationsError,
    dashboardError,
    loginForm,
    recentOrganizations,
    activityFeed,
    dashboardStats,
    isLoggedIn,
    userInitials,
    apiRequest,
    fetchCurrentUser,
    fetchRecentOrganizations,
    loadDashboardData,
    login,
    register,
    logout
  };
});
