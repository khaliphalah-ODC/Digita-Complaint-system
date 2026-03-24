<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import api, { extractApiError, unwrapResponse } from '../../services/api.js';
import { useSessionStore } from '../../stores/session.js';

const loading = ref(false);
const saving = ref(false);
const error = ref('');
const success = ref('');
const accountError = ref('');
const accountSuccess = ref('');
const orgLoading = ref(false);
const orgError = ref('');
const organizations = ref([]);
const orgActionId = ref(null);
const session = useSessionStore();

const form = reactive({
  system_name: '',
  maintenance_mode: false,
  default_org_status: 'active',
  password_min_length: 8,
  session_ttl_minutes: 1440,
  require_email_verification: true,
  enforce_status_sequence: false,
  require_admin_response_on_resolve: false,
  escalation_threshold_hours: 72,
  enforce_escalation_threshold: false,
  response_sla_hours: 48,
  notifications_enabled: true,
  notify_on_complaint_created: true,
  notify_on_status_change: true,
  notify_on_response: true,
  notify_on_escalation: true,
  notify_on_chat_message: true,
  notify_on_assignment: true
});

const accountForm = reactive({
  email: '',
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const auditLoading = ref(false);
const auditError = ref('');
const auditRows = ref([]);
const auditTotal = ref(0);
const auditFilters = reactive({
  search: '',
  actor_role: '',
  action: '',
  target_table: ''
});
const auditPagination = reactive({
  limit: 50,
  offset: 0
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const fetchPlatformSettings = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    const response = await api.get('/platform-settings');
    const data = ensureSuccess(unwrapResponse(response), 'Failed to fetch platform settings');
    form.system_name = String(data?.system_name || '').trim();
    form.maintenance_mode = Number(data?.maintenance_mode || 0) === 1;
    form.default_org_status = String(data?.default_org_status || 'active');
    form.password_min_length = Number(data?.password_min_length || 8);
    form.session_ttl_minutes = Number(data?.session_ttl_minutes || 1440);
    form.require_email_verification = Number(data?.require_email_verification || 0) === 1;
    form.enforce_status_sequence = Number(data?.enforce_status_sequence || 0) === 1;
    form.require_admin_response_on_resolve = Number(data?.require_admin_response_on_resolve || 0) === 1;
    form.escalation_threshold_hours = Number(data?.escalation_threshold_hours || 72);
    form.enforce_escalation_threshold = Number(data?.enforce_escalation_threshold || 0) === 1;
    form.response_sla_hours = Number(data?.response_sla_hours || 48);
    form.notifications_enabled = Number(data?.notifications_enabled || 0) === 1;
    form.notify_on_complaint_created = Number(data?.notify_on_complaint_created || 0) === 1;
    form.notify_on_status_change = Number(data?.notify_on_status_change || 0) === 1;
    form.notify_on_response = Number(data?.notify_on_response || 0) === 1;
    form.notify_on_escalation = Number(data?.notify_on_escalation || 0) === 1;
    form.notify_on_chat_message = Number(data?.notify_on_chat_message || 0) === 1;
    form.notify_on_assignment = Number(data?.notify_on_assignment || 0) === 1;
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch platform settings');
  } finally {
    loading.value = false;
  }
};

const savePlatformSettings = async () => {
  if (!form.system_name.trim()) {
    error.value = 'System name is required.';
    return;
  }
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    const response = await api.put('/platform-settings', {
      system_name: form.system_name.trim(),
      maintenance_mode: form.maintenance_mode ? 1 : 0,
      default_org_status: form.default_org_status,
      password_min_length: Number(form.password_min_length),
      session_ttl_minutes: Number(form.session_ttl_minutes),
      require_email_verification: form.require_email_verification ? 1 : 0,
      enforce_status_sequence: form.enforce_status_sequence ? 1 : 0,
      require_admin_response_on_resolve: form.require_admin_response_on_resolve ? 1 : 0,
      escalation_threshold_hours: Number(form.escalation_threshold_hours),
      enforce_escalation_threshold: form.enforce_escalation_threshold ? 1 : 0,
      response_sla_hours: Number(form.response_sla_hours),
      notifications_enabled: form.notifications_enabled ? 1 : 0,
      notify_on_complaint_created: form.notify_on_complaint_created ? 1 : 0,
      notify_on_status_change: form.notify_on_status_change ? 1 : 0,
      notify_on_response: form.notify_on_response ? 1 : 0,
      notify_on_escalation: form.notify_on_escalation ? 1 : 0,
      notify_on_chat_message: form.notify_on_chat_message ? 1 : 0,
      notify_on_assignment: form.notify_on_assignment ? 1 : 0
    });
    const data = ensureSuccess(unwrapResponse(response), 'Failed to update platform settings');
    form.system_name = String(data?.system_name || '').trim();
    form.maintenance_mode = Number(data?.maintenance_mode || 0) === 1;
    form.default_org_status = String(data?.default_org_status || 'active');
    form.password_min_length = Number(data?.password_min_length || 8);
    form.session_ttl_minutes = Number(data?.session_ttl_minutes || 1440);
    form.require_email_verification = Number(data?.require_email_verification || 0) === 1;
    form.enforce_status_sequence = Number(data?.enforce_status_sequence || 0) === 1;
    form.require_admin_response_on_resolve = Number(data?.require_admin_response_on_resolve || 0) === 1;
    form.escalation_threshold_hours = Number(data?.escalation_threshold_hours || 72);
    form.enforce_escalation_threshold = Number(data?.enforce_escalation_threshold || 0) === 1;
    form.response_sla_hours = Number(data?.response_sla_hours || 48);
    form.notifications_enabled = Number(data?.notifications_enabled || 0) === 1;
    form.notify_on_complaint_created = Number(data?.notify_on_complaint_created || 0) === 1;
    form.notify_on_status_change = Number(data?.notify_on_status_change || 0) === 1;
    form.notify_on_response = Number(data?.notify_on_response || 0) === 1;
    form.notify_on_escalation = Number(data?.notify_on_escalation || 0) === 1;
    form.notify_on_chat_message = Number(data?.notify_on_chat_message || 0) === 1;
    form.notify_on_assignment = Number(data?.notify_on_assignment || 0) === 1;
    success.value = 'Platform settings updated successfully.';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to update platform settings');
  } finally {
    saving.value = false;
  }
};

const overviewCards = computed(() => [
  {
    title: 'Platform Name',
    value: form.system_name || 'Complaint Management System',
    detail: 'Global branding used across the platform.'
  },
  {
    title: 'Maintenance Mode',
    value: form.maintenance_mode ? 'On' : 'Off',
    detail: form.maintenance_mode ? 'Platform is currently paused.' : 'Platform is currently available.'
  },
  {
    title: 'Default Org Status',
    value: form.default_org_status === 'inactive' ? 'Inactive' : 'Active',
    detail: 'New organizations inherit this status.'
  }
]);

onMounted(fetchPlatformSettings);

const fetchOrganizations = async () => {
  orgLoading.value = true;
  orgError.value = '';
  try {
    const response = await api.get('/organization');
    organizations.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch organizations') || [];
  } catch (requestError) {
    orgError.value = extractApiError(requestError, 'Failed to fetch organizations');
  } finally {
    orgLoading.value = false;
  }
};

const toggleOrganizationStatus = async (org) => {
  if (!org) return;
  orgActionId.value = org.organization_id;
  orgError.value = '';
  try {
    const nextStatus = String(org.status || 'active') === 'active' ? 'inactive' : 'active';
    const response = await api.patch(`/organization/${org.organization_id}/status`, { status: nextStatus });
    const updated = ensureSuccess(unwrapResponse(response), 'Failed to update organization status');
    organizations.value = organizations.value.map((row) =>
      row.organization_id === updated.organization_id ? updated : row
    );
  } catch (requestError) {
    orgError.value = extractApiError(requestError, 'Failed to update organization status');
  } finally {
    orgActionId.value = null;
  }
};

onMounted(fetchOrganizations);

const syncAccountEmail = () => {
  accountForm.email = String(session.currentUser?.email || '').trim();
};

const saveAccountEmail = async () => {
  accountError.value = '';
  accountSuccess.value = '';
  if (!accountForm.email.trim()) {
    accountError.value = 'Email is required.';
    return;
  }
  if (!accountForm.current_password.trim()) {
    accountError.value = 'Current password is required to change email.';
    return;
  }

  try {
    await session.changeEmail({
      new_email: accountForm.email.trim(),
      current_password: accountForm.current_password
    });
    accountForm.current_password = '';
    accountSuccess.value = 'Email updated. Please verify if required.';
  } catch (requestError) {
    accountError.value = extractApiError(requestError, 'Failed to update email');
  }
};

const saveAccountPassword = async () => {
  accountError.value = '';
  accountSuccess.value = '';
  if (!accountForm.current_password.trim() || !accountForm.new_password.trim()) {
    accountError.value = 'Current and new password are required.';
    return;
  }
  if (accountForm.new_password !== accountForm.confirm_password) {
    accountError.value = 'New passwords do not match.';
    return;
  }

  try {
    await session.changePassword({
      current_password: accountForm.current_password,
      new_password: accountForm.new_password
    });
    accountForm.current_password = '';
    accountForm.new_password = '';
    accountForm.confirm_password = '';
    accountSuccess.value = 'Password updated successfully.';
  } catch (requestError) {
    accountError.value = extractApiError(requestError, 'Failed to update password');
  }
};

const fetchAuditLogs = async () => {
  auditLoading.value = true;
  auditError.value = '';
  try {
    const response = await api.get('/audit-logs', {
      params: {
        limit: auditPagination.limit,
        offset: auditPagination.offset,
        search: auditFilters.search || undefined,
        actor_role: auditFilters.actor_role || undefined,
        action: auditFilters.action || undefined,
        target_table: auditFilters.target_table || undefined
      }
    });
    const payload = ensureSuccess(unwrapResponse(response), 'Failed to fetch audit logs');
    auditRows.value = payload?.items || [];
    auditTotal.value = Number(payload?.total || 0);
  } catch (requestError) {
    auditError.value = extractApiError(requestError, 'Failed to fetch audit logs');
  } finally {
    auditLoading.value = false;
  }
};

const formatAuditMetadata = (meta) => {
  if (!meta) return '';
  try {
    const parsed = typeof meta === 'string' ? JSON.parse(meta) : meta;
    if (!parsed || typeof parsed !== 'object') return String(meta);
    const entries = Object.entries(parsed)
      .filter(([key]) => !['user_agent', 'path', 'method'].includes(key))
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${value}`);
    return entries.join(' • ');
  } catch (error) {
    return String(meta);
  }
};

const clearAuditFilters = () => {
  auditFilters.search = '';
  auditFilters.action = '';
  auditFilters.target_table = '';
  auditFilters.actor_role = '';
  fetchAuditLogs();
};

onMounted(fetchAuditLogs);
onMounted(syncAccountEmail);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <PageHeader
          title="Platform Settings"
          description="Super-admin control center for platform-wide policies and governance."
        />

        <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article
            v-for="card in overviewCards"
            :key="card.title"
            class="app-section-card"
          >
            <p class="text-sm font-medium text-slate-500">{{ card.title }}</p>
            <p class="mt-2 text-xl font-semibold text-slate-900">{{ card.value }}</p>
            <p class="mt-2 text-sm text-slate-600">{{ card.detail }}</p>
          </article>
        </section>

        <section class="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <article class="app-section-card">
            <h2 class="text-lg font-semibold text-slate-900">Platform Settings</h2>
            <p class="mt-1 text-sm text-slate-600">System name, maintenance mode, and defaults.</p>

            <div class="mt-4 grid grid-cols-1 gap-3">
              <label class="text-sm font-semibold text-slate-700">System Name</label>
              <input v-model="form.system_name" class="app-input" placeholder="System name">

              <label class="text-sm font-semibold text-slate-700">Maintenance Mode</label>
              <select v-model="form.maintenance_mode" class="app-select">
                <option :value="false">Off</option>
                <option :value="true">On</option>
              </select>

              <label class="text-sm font-semibold text-slate-700">Default Organization Status</label>
              <select v-model="form.default_org_status" class="app-select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div class="app-action-row flex flex-wrap gap-2 pt-2">
                <button class="app-btn-primary" :disabled="saving" @click="savePlatformSettings">
                  {{ saving ? 'Saving...' : 'Save Settings' }}
                </button>
                <button class="app-btn-secondary" :disabled="loading" @click="fetchPlatformSettings">
                  Refresh
                </button>
              </div>

              <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
              <p v-if="success" class="text-sm text-emerald-700">{{ success }}</p>
            </div>
          </article>

          <article class="app-section-card">
            <h2 class="text-lg font-semibold text-slate-900">Global Security Settings</h2>
            <p class="mt-1 text-sm text-slate-600">Password rules, session policies, and verification enforcement.</p>

            <div class="mt-4 grid grid-cols-1 gap-3">
              <label class="text-sm font-semibold text-slate-700">Password Minimum Length</label>
              <input v-model="form.password_min_length" type="number" min="6" max="64" class="app-input">

              <label class="text-sm font-semibold text-slate-700">Session TTL (minutes)</label>
              <input v-model="form.session_ttl_minutes" type="number" min="15" max="10080" class="app-input">

              <label class="text-sm font-semibold text-slate-700">Require Email Verification</label>
              <select v-model="form.require_email_verification" class="app-select">
                <option :value="true">Yes</option>
                <option :value="false">No</option>
              </select>

              <div class="app-action-row flex flex-wrap gap-2 pt-2">
                <button class="app-btn-primary" :disabled="saving" @click="savePlatformSettings">
                  {{ saving ? 'Saving...' : 'Save Security Settings' }}
                </button>
                <button class="app-btn-secondary" :disabled="loading" @click="fetchPlatformSettings">
                  Refresh
                </button>
              </div>
            </div>
          </article>
        </section>

        <section class="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <article class="app-section-card">
            <h2 class="text-lg font-semibold text-slate-900">Super Admin Email</h2>
            <p class="mt-1 text-sm text-slate-600">Update your login email address.</p>

            <div class="mt-4 grid grid-cols-1 gap-3">
              <label class="text-sm font-semibold text-slate-700">Email</label>
              <input v-model="accountForm.email" type="email" class="app-input" placeholder="you@example.com">

              <label class="text-sm font-semibold text-slate-700">Current Password</label>
              <input v-model="accountForm.current_password" type="password" class="app-input" placeholder="Current password">

              <div class="app-action-row flex flex-wrap gap-2 pt-2">
                <button class="app-btn-primary" @click="saveAccountEmail">
                  Update Email
                </button>
              </div>

              <p v-if="accountError" class="text-sm text-red-600">{{ accountError }}</p>
              <p v-if="accountSuccess" class="text-sm text-emerald-700">{{ accountSuccess }}</p>
            </div>
          </article>

          <article class="app-section-card">
            <h2 class="text-lg font-semibold text-slate-900">Super Admin Password</h2>
            <p class="mt-1 text-sm text-slate-600">Change your password securely.</p>

            <div class="mt-4 grid grid-cols-1 gap-3">
              <label class="text-sm font-semibold text-slate-700">Current Password</label>
              <input v-model="accountForm.current_password" type="password" class="app-input" placeholder="Current password">

              <label class="text-sm font-semibold text-slate-700">New Password</label>
              <input v-model="accountForm.new_password" type="password" class="app-input" placeholder="New password">

              <label class="text-sm font-semibold text-slate-700">Confirm New Password</label>
              <input v-model="accountForm.confirm_password" type="password" class="app-input" placeholder="Confirm new password">

              <div class="app-action-row flex flex-wrap gap-2 pt-2">
                <button class="app-btn-primary" @click="saveAccountPassword">
                  Update Password
                </button>
              </div>

              <p v-if="accountError" class="text-sm text-red-600">{{ accountError }}</p>
              <p v-if="accountSuccess" class="text-sm text-emerald-700">{{ accountSuccess }}</p>
            </div>
          </article>
        </section>

        <section class="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <article class="app-section-card">
            <h2 class="text-lg font-semibold text-slate-900">Complaint Workflow Policy</h2>
            <p class="mt-1 text-sm text-slate-600">Status rules, escalation thresholds, and response SLAs.</p>

            <div class="mt-4 grid grid-cols-1 gap-3">
              <label class="text-sm font-semibold text-slate-700">Enforce Status Sequence</label>
              <select v-model="form.enforce_status_sequence" class="app-select">
                <option :value="false">Off</option>
                <option :value="true">On</option>
              </select>

              <label class="text-sm font-semibold text-slate-700">Require Response Before Resolve</label>
              <select v-model="form.require_admin_response_on_resolve" class="app-select">
                <option :value="false">No</option>
                <option :value="true">Yes</option>
              </select>

              <label class="text-sm font-semibold text-slate-700">Escalation Threshold (hours)</label>
              <input v-model="form.escalation_threshold_hours" type="number" min="1" max="720" class="app-input">

              <label class="text-sm font-semibold text-slate-700">Enforce Escalation Threshold</label>
              <select v-model="form.enforce_escalation_threshold" class="app-select">
                <option :value="false">Off</option>
                <option :value="true">On</option>
              </select>

              <label class="text-sm font-semibold text-slate-700">Response SLA (hours)</label>
              <input v-model="form.response_sla_hours" type="number" min="1" max="720" class="app-input">

              <div class="app-action-row flex flex-wrap gap-2 pt-2">
                <button class="app-btn-primary" :disabled="saving" @click="savePlatformSettings">
                  {{ saving ? 'Saving...' : 'Save Workflow Policy' }}
                </button>
                <button class="app-btn-secondary" :disabled="loading" @click="fetchPlatformSettings">
                  Refresh
                </button>
              </div>
            </div>
          </article>

          <article class="app-section-card">
            <h2 class="text-lg font-semibold text-slate-900">Notification Policy</h2>
            <p class="mt-1 text-sm text-slate-600">Global defaults for automated notifications.</p>

            <div class="mt-4 grid grid-cols-1 gap-3">
              <label class="text-sm font-semibold text-slate-700">Enable Notifications</label>
              <select v-model="form.notifications_enabled" class="app-select">
                <option :value="true">On</option>
                <option :value="false">Off</option>
              </select>

              <label class="text-sm font-semibold text-slate-700">Notify on Complaint Created</label>
              <select v-model="form.notify_on_complaint_created" class="app-select">
                <option :value="true">On</option>
                <option :value="false">Off</option>
              </select>

              <label class="text-sm font-semibold text-slate-700">Notify on Status Change</label>
              <select v-model="form.notify_on_status_change" class="app-select">
                <option :value="true">On</option>
                <option :value="false">Off</option>
              </select>

              <label class="text-sm font-semibold text-slate-700">Notify on Response</label>
              <select v-model="form.notify_on_response" class="app-select">
                <option :value="true">On</option>
                <option :value="false">Off</option>
              </select>

              <label class="text-sm font-semibold text-slate-700">Notify on Escalation</label>
              <select v-model="form.notify_on_escalation" class="app-select">
                <option :value="true">On</option>
                <option :value="false">Off</option>
              </select>

              <label class="text-sm font-semibold text-slate-700">Notify on Chat Messages</label>
              <select v-model="form.notify_on_chat_message" class="app-select">
                <option :value="true">On</option>
                <option :value="false">Off</option>
              </select>

              <label class="text-sm font-semibold text-slate-700">Notify on Assignment</label>
              <select v-model="form.notify_on_assignment" class="app-select">
                <option :value="true">On</option>
                <option :value="false">Off</option>
              </select>

              <div class="app-action-row flex flex-wrap gap-2 pt-2">
                <button class="app-btn-primary" :disabled="saving" @click="savePlatformSettings">
                  {{ saving ? 'Saving...' : 'Save Notification Policy' }}
                </button>
                <button class="app-btn-secondary" :disabled="loading" @click="fetchPlatformSettings">
                  Refresh
                </button>
              </div>
            </div>
          </article>
        </section>

        <section class="app-section-card">
          <h2 class="text-lg font-semibold text-slate-900">Organization Governance</h2>
          <p class="mt-1 text-sm text-slate-600">Activate or suspend organizations and review their status.</p>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button class="app-btn-secondary" :disabled="orgLoading" @click="fetchOrganizations">
              {{ orgLoading ? 'Refreshing...' : 'Refresh Organizations' }}
            </button>
            <RouterLink to="/admin/organizations" class="app-btn-primary">
              Manage Organizations
            </RouterLink>
          </div>

          <p v-if="orgError" class="mt-3 text-sm text-red-600">{{ orgError }}</p>

          <div v-if="orgLoading" class="mt-4 text-sm text-[var(--app-muted-color)]">Loading organizations...</div>
          <div v-else-if="organizations.length === 0" class="mt-4 text-sm text-[var(--app-muted-color)]">
            No organizations found.
          </div>

          <div v-else class="mt-4 app-table-shell overflow-x-auto">
            <table class="app-table min-w-full">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Complaints</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="org in organizations" :key="org.organization_id">
                  <td>
                    <p class="font-semibold text-[var(--app-title-color)]">{{ org.name }}</p>
                    <p class="text-xs text-[var(--app-muted-color)]">{{ org.email }}</p>
                  </td>
                  <td>
                    <span :class="org.status === 'active' ? 'app-badge app-badge-success' : 'app-badge app-badge-danger'">
                      {{ org.status || 'inactive' }}
                    </span>
                  </td>
                  <td>{{ org.complaints_count ?? 0 }}</td>
                  <td>
                    <button
                      class="app-btn-secondary min-h-[32px] px-3 py-1 text-xs"
                      :disabled="orgActionId === org.organization_id"
                      @click="toggleOrganizationStatus(org)"
                    >
                      {{ org.status === 'active' ? 'Suspend' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="app-section-card">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Audit Logs</h2>
              <p class="mt-1 text-sm text-slate-600">Track platform-wide actions and changes.</p>
            </div>
            <button class="app-btn-secondary" :disabled="auditLoading" @click="fetchAuditLogs">
              {{ auditLoading ? 'Refreshing...' : 'Refresh Logs' }}
            </button>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input v-model="auditFilters.search" class="app-input" placeholder="Search logs">
            <input v-model="auditFilters.action" class="app-input" placeholder="Filter by action">
            <input v-model="auditFilters.target_table" class="app-input" placeholder="Filter by table">
            <select v-model="auditFilters.actor_role" class="app-select">
              <option value="">All roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="org_admin">Org Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button class="app-btn-primary" :disabled="auditLoading" @click="fetchAuditLogs">
              Apply Filters
            </button>
            <button
              class="app-btn-ghost"
              :disabled="auditLoading"
              @click="clearAuditFilters"
            >
              Clear Filters
            </button>
            <span class="text-xs text-[var(--app-muted-color)]">
              Showing {{ auditRows.length }} of {{ auditTotal }} entries
            </span>
          </div>

          <p v-if="auditError" class="mt-3 text-sm text-red-600">{{ auditError }}</p>
          <div v-if="auditLoading" class="mt-3 text-sm text-[var(--app-muted-color)]">Loading audit logs...</div>

          <div v-else class="mt-4 app-table-shell overflow-x-auto">
            <table class="app-table min-w-full">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="auditRows.length === 0">
                  <td colspan="5" class="text-sm text-[var(--app-muted-color)]">No audit logs found.</td>
                </tr>
                <tr v-for="log in auditRows" :key="log.id">
                  <td class="text-xs text-[var(--app-muted-color)]">{{ log.created_at }}</td>
                  <td class="text-sm text-[var(--app-text-color)]">{{ log.actor_role || 'system' }}</td>
                  <td class="text-sm font-semibold text-[var(--app-title-color)]">{{ log.action }}</td>
                  <td class="text-sm text-[var(--app-text-color)]">
                    {{ log.target_table }}<span v-if="log.target_id"> #{{ log.target_id }}</span>
                  </td>
                  <td class="text-xs text-[var(--app-muted-color)]">{{ formatAuditMetadata(log.metadata) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
