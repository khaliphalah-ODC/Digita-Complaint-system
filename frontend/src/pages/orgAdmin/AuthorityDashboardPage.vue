<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import { useSessionStore } from '../../stores/session';
import { useUiToastStore } from '../../stores/uiToast';
import AnalyticsDonutChart from '../../components/superAdmin/AnalyticsDonutChart.vue';
import AnalyticsLineChart from '../../components/superAdmin/AnalyticsLineChart.vue';

const session = useSessionStore();
const uiToast = useUiToastStore();
const loadingUsers = ref(false);
const loadingComplaints = ref(false);
const saving = ref(false);
const users = ref([]);
const complaints = ref([]);
const error = ref('');
const lastRefresh = ref(null);
let pollTimer = null;

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  status: 'active'
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) {
    throw new Error(payload?.message || fallbackMessage);
  }
  return payload.data;
};

const getUserCreateError = (requestError) => {
  const payload = requestError?.response?.data || {};
  if (Number(requestError?.response?.status) === 409 && payload?.message) {
    return payload.message;
  }
  return extractApiError(requestError, 'Failed to create user');
};

const fetchUsers = async () => {
  loadingUsers.value = true;
  error.value = '';
  try {
    const response = await api.get('/users');
    users.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch users') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch users');
  } finally {
    loadingUsers.value = false;
  }
};

const fetchComplaints = async () => {
  loadingComplaints.value = true;
  error.value = '';
  try {
    const response = await api.get('/complaint');
    complaints.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch complaints') || [];
    lastRefresh.value = new Date();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch complaints');
  } finally {
    loadingComplaints.value = false;
  }
};

const createUser = async () => {
  error.value = '';

  if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
    error.value = 'full_name, email, and password are required.';
    return;
  }

  saving.value = true;
  try {
    await api.post('/users', {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      status: form.status,
      role: 'user'
    });
    uiToast.success('User created successfully for your organization.');
    form.full_name = '';
    form.email = '';
    form.password = '';
    form.status = 'active';
    await fetchUsers();
  } catch (requestError) {
    error.value = getUserCreateError(requestError);
    uiToast.error(error.value);
  } finally {
    saving.value = false;
  }
};

const myStats = computed(() => {
  const rows = complaints.value || [];
  return {
    totalComplaints: rows.length,
    totalUsers: users.value.length,
    open: rows.filter((row) => row.status === 'submitted' || row.status === 'in_review').length,
    resolved: rows.filter((row) => row.status === 'resolved' || row.status === 'closed').length
  };
});

onMounted(() => {
  fetchUsers();
  fetchComplaints();
  pollTimer = setInterval(() => {
    void fetchComplaints();
  }, 30000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});

const statusLabels = {
  submitted: 'Submitted',
  in_review: 'In Review',
  resolved: 'Resolved',
  closed: 'Closed'
};

const statusSeries = computed(() => {
  const counts = {
    submitted: 0,
    in_review: 0,
    resolved: 0,
    closed: 0
  };

  (complaints.value || []).forEach((complaint) => {
    const status = String(complaint.status || 'submitted').toLowerCase();
    if (counts[status] >= 0) {
      counts[status] += 1;
    }
  });

  const tones = ['#4f8df7', '#1f4db7', '#22c55e', '#ef4444'];
  return Object.keys(counts).map((key, index) => ({
    label: statusLabels[key],
    value: counts[key],
    tone: tones[index % tones.length]
  }));
});

const complaintTrendSeries = computed(() => {
  const windowDays = 6;
  const now = new Date();
  const timeline = {};

  for (let i = windowDays; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    timeline[key] = { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: 0 };
  }

  (complaints.value || []).forEach((complaint) => {
    const timestamp = complaint.created_at ? new Date(complaint.created_at) : new Date();
    const key = timestamp.toISOString().slice(0, 10);
    if (timeline[key]) {
      timeline[key].value += 1;
    }
  });

  return Object.values(timeline);
});

const lastUpdatedLabel = computed(() => {
  if (!lastRefresh.value) return 'Not yet updated';
  return `Last refreshed ${lastRefresh.value.toLocaleTimeString()} ${lastRefresh.value.toLocaleDateString()}`;
});
</script>

<template>
  <section class="w-full space-y-5">
    <div class="org-admin-gradient-panel">
      <header>
        <p class="app-kicker text-white/80">Organization Admin Workspace</p>
        <h1 class="mt-2 text-3xl font-black text-white sm:text-4xl">
          Welcome, {{ session.currentUser?.full_name || 'Organization Admin' }}
        </h1>
        <p class="mt-3 max-w-3xl text-sm leading-7 text-white/75">
          Manage users in your organization and review organization complaint traffic.
        </p>
      </header>

      <section class="mt-6 org-admin-stat-row">
        <article class="org-admin-panel-card org-admin-stat-card">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/70">Organization Users</p>
          <p class="mt-2 text-3xl font-black text-white">{{ loadingUsers ? '...' : myStats.totalUsers }}</p>
          <p class="text-xs text-white/60">Active and invited members.</p>
        </article>
        <article class="org-admin-panel-card org-admin-stat-card">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/70">Organization Complaints</p>
          <p class="mt-2 text-3xl font-black text-white">{{ loadingComplaints ? '...' : myStats.totalComplaints }}</p>
          <p class="text-xs text-white/60">All statuses included.</p>
        </article>
        <article class="org-admin-panel-card org-admin-stat-card">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/70">Resolved</p>
          <p class="mt-2 text-3xl font-black text-white">{{ loadingComplaints ? '...' : myStats.resolved }}</p>
          <p class="text-xs text-white/60">Resolved or closed complaints.</p>
        </article>
      </section>
    </div>

    <p v-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr,1.05fr]">
      <section class="space-y-5">
        <section class="org-admin-panel-card">
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-white">Create User</h2>
              <p class="text-sm text-white/70">New users attach automatically to your organization.</p>
            </div>
            <button class="org-admin-outline-btn" @click="fetchUsers">
              Refresh Users
            </button>
          </div>

          <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="createUser">
            <input v-model="form.full_name" placeholder="Full name" class="org-admin-input">
            <input v-model="form.email" type="email" placeholder="Email" class="org-admin-input">
            <input v-model="form.password" type="password" placeholder="Password" class="org-admin-input md:col-span-2">
            <select v-model="form.status" class="org-admin-select">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <div class="flex items-center">
              <span class="rounded-full bg-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white">Role: user</span>
            </div>
            <div class="md:col-span-2">
              <button type="submit" :disabled="saving" class="org-admin-btn disabled:opacity-70">
                {{ saving ? 'Creating...' : 'Create User' }}
              </button>
            </div>
          </form>
        </section>

        <section class="org-admin-panel-card">
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-white">Users List</h2>
              <p class="text-sm text-white/70">Only your organization’s users are displayed.</p>
            </div>
          </div>

          <p v-if="loadingUsers" class="text-sm text-white/70">Loading users...</p>
          <p v-else-if="users.length === 0" class="text-sm text-white/70">No users found in your organization.</p>
          <div v-else class="overflow-x-auto">
            <table class="org-admin-table min-w-full text-left text-sm">
              <thead class="text-white/60">
                <tr>
                  <th class="pb-2 pr-3 text-xs uppercase tracking-wide text-white/70">Name</th>
                  <th class="pb-2 pr-3 text-xs uppercase tracking-wide text-white/70">Email</th>
                  <th class="pb-2 pr-3 text-xs uppercase tracking-wide text-white/70">Role</th>
                  <th class="pb-2 pr-3 text-xs uppercase tracking-wide text-white/70">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in users" :key="row.id" class="border-t border-white/10">
                  <td class="py-2 pr-3 text-white">{{ row.full_name }}</td>
                  <td class="py-2 pr-3 text-white/80">{{ row.email }}</td>
                  <td class="py-2 pr-3 text-white/80">{{ row.role }}</td>
                  <td class="py-2 pr-3 text-white/80">{{ row.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section class="org-admin-panel-card">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-bold text-white">Complaints List</h2>
            <p class="text-sm text-white/70">Complaint records scoped to your organization.</p>
          </div>
          <button class="org-admin-outline-btn" @click="fetchComplaints">
            Refresh Complaints
          </button>
        </div>

        <p v-if="loadingComplaints" class="text-sm text-white/70">Loading complaints...</p>
        <p v-else-if="complaints.length === 0" class="text-sm text-white/70">No complaints found for your organization.</p>
          <div v-else class="space-y-3">
            <article
              v-for="item in complaints.slice(0, 8)"
              :key="item.id"
              class="org-admin-panel-card"
            >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="text-base font-bold text-white">{{ item.title || 'Untitled Complaint' }}</h3>
                <p class="mt-1 text-sm text-white/80">{{ item.complaint }}</p>
                <p class="mt-2 text-xs text-white/60">Tracking: {{ item.tracking_code || 'N/A' }}</p>
                <p class="text-xs text-white/60">Reporter: {{ item.user_full_name || item.anonymous_label || 'Anonymous' }}</p>
              </div>
              <div class="flex flex-col gap-2">
                <span class="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-white">{{ item.priority }}</span>
                <span class="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-white">{{ item.status }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>

    <section class="org-admin-panel-card">
      <header class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-bold text-white">Organization Analytics (Real-time)</h2>
          <p class="text-sm text-white/75">Charts refresh every 30 seconds while you stay on this page.</p>
        </div>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{{ lastUpdatedLabel }}</p>
      </header>

      <div class="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr,0.65fr]">
        <AnalyticsLineChart
          title="Complaint Trend (Rolling 7 days)"
          subtitle="Counts per day for your organization."
          :series="complaintTrendSeries"
          line-color="#ffffff"
          theme="dark"
        />
        <AnalyticsDonutChart
          title="Status Distribution"
          subtitle="Live proportion of complaint states."
          center-label="Complaints"
          :series="statusSeries"
          theme="dark"
        />
      </div>
    </section>
  </section>
</template>
