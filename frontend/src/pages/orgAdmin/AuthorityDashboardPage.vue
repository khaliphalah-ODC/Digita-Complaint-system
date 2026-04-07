<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { authApi, complaintsApi, extractApiError, joinCodesApi, organizationsApi } from '../../services/api';
import { useSessionStore } from '../../stores/session';
import { useUiToastStore } from '../../stores/uiToast';
import MobileDataCardList from '../../components/MobileDataCardList.vue';
import AnalyticsDonutChart from '../../components/superAdmin/AnalyticsDonutChart.vue';
import AnalyticsLineChart from '../../components/superAdmin/AnalyticsLineChart.vue';

const session = useSessionStore();
const uiToast = useUiToastStore();
const loadingUsers = ref(false);
const loadingComplaints = ref(false);
const loadingPending = ref(false);
const loadingJoinCode = ref(false);
const saving = ref(false);
const users = ref([]);
const complaints = ref([]);
const pendingMembers = ref([]);
const joinCode = ref('');
const joinCodeExpiry = ref('');
const codeCopied = ref(false);
const error = ref('');
const lastRefresh = ref(null);
let pollTimer = null;
const authorityUserCardFields = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' }
];

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  status: 'active'
});

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
    users.value = await authApi.listUsers() || [];
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
    complaints.value = await complaintsApi.list() || [];
    lastRefresh.value = new Date();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch complaints');
  } finally {
    loadingComplaints.value = false;
  }
};

// ── Fetch pending members awaiting approval ───────────────
const fetchPendingMembers = async () => {
  loadingPending.value = true;
  try {
    pendingMembers.value = await joinCodesApi.pending() || [];
  } catch (requestError) {
    console.error('Failed to fetch pending members:', extractApiError(requestError));
  } finally {
    loadingPending.value = false;
  }
};

// ── Fetch the organization join code ─────────────────────
const fetchJoinCode = async () => {
  loadingJoinCode.value = true;
  try {
    const orgs = await organizationsApi.list() || [];
    const myOrg = Array.isArray(orgs) ? orgs[0] : orgs;
    if (myOrg) {
      joinCode.value = myOrg.join_code || '';
      joinCodeExpiry.value = myOrg.join_code_expires_at || '';
    }
  } catch (requestError) {
    console.error('Failed to fetch join code:', extractApiError(requestError));
  } finally {
    loadingJoinCode.value = false;
  }
};

// ── Copy join code to clipboard ───────────────────────────
const copyJoinCode = async () => {
  if (!joinCode.value) return;
  try {
    await navigator.clipboard.writeText(joinCode.value);
    codeCopied.value = true;
    setTimeout(() => { codeCopied.value = false; }, 2500);
  } catch {
    uiToast.error('Failed to copy. Please copy manually.');
  }
};

// ── Regenerate join code ──────────────────────────────────
const regenerateCode = async () => {
  try {
    const data = await joinCodesApi.regenerate();
    joinCode.value = data?.join_code || '';
    joinCodeExpiry.value = data?.expires_at || '';
    uiToast.success('Join code regenerated successfully.');
  } catch (requestError) {
    uiToast.error(extractApiError(requestError, 'Failed to regenerate join code'));
  }
};

// ── Approve a pending member ──────────────────────────────
const approveMember = async (userId) => {
  try {
    await joinCodesApi.approve(userId);
    uiToast.success('Member approved. They can now log in.');
    pendingMembers.value = pendingMembers.value.filter((m) => m.id !== userId);
    await fetchUsers();
  } catch (requestError) {
    uiToast.error(extractApiError(requestError, 'Failed to approve member'));
  }
};

// ── Reject a pending member ───────────────────────────────
const rejectMember = async (userId) => {
  try {
    await joinCodesApi.reject(userId);
    uiToast.success('Member rejected and removed.');
    pendingMembers.value = pendingMembers.value.filter((m) => m.id !== userId);
  } catch (requestError) {
    uiToast.error(extractApiError(requestError, 'Failed to reject member'));
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
    await authApi.createUser({
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
    resolved: rows.filter((row) => row.status === 'resolved' || row.status === 'closed').length,
    pendingCount: pendingMembers.value.length,
  };
});

const formatExpiry = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

onMounted(() => {
  fetchUsers();
  fetchComplaints();
  fetchPendingMembers();
  fetchJoinCode();
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
  in_review: 'Reviewed / Assigned',
  resolved: 'Resolved',
  closed: 'Closed'
};

const statusSeries = computed(() => {
  const counts = { submitted: 0, in_review: 0, resolved: 0, closed: 0 };
  (complaints.value || []).forEach((complaint) => {
    const status = String(complaint.status || 'submitted').toLowerCase();
    if (counts[status] >= 0) counts[status] += 1;
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
    if (timeline[key]) timeline[key].value += 1;
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
    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="org-admin-gradient-panel">
      <header>
        <p class="app-kicker text-white/80">Organization Admin Workspace</p>
        <h1 class="mt-2 text-3xl font-black text-white sm:text-4xl">
          Welcome, {{ session.currentUser?.full_name || 'Organization Admin' }}
        </h1>
        <p class="mt-3 max-w-3xl text-sm leading-7 text-white/75">
          Manage users in your organization and review complaint traffic.
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
        <article class="org-admin-panel-card org-admin-stat-card">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/70">Pending Approvals</p>
          <p class="mt-2 text-3xl font-black text-white">{{ loadingPending ? '...' : myStats.pendingCount }}</p>
          <p class="text-xs text-white/60">Members awaiting your approval.</p>
        </article>
      </section>
    </div>

    <p v-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

    <!-- ── Join Code Card ──────────────────────────────────── -->
    <section class="org-admin-panel-card">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-lg font-bold text-white">Organization Join Code</h2>
          <p class="mt-1 text-sm text-white/70">
            Share this code with members so they can register under your organization at
            <span class="font-semibold text-white/90">/join</span>.
          </p>
        </div>
        <button
          class="org-admin-outline-btn flex-shrink-0"
          @click="regenerateCode"
        >
          Regenerate Code
        </button>
      </div>

      <div v-if="loadingJoinCode" class="mt-4 text-sm text-white/60">Loading join code...</div>
      <div v-else-if="joinCode" class="mt-4 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-5 py-3">
          <span class="font-mono text-xl font-black tracking-widest text-white">{{ joinCode }}</span>
        </div>
        <button
          class="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
          :class="codeCopied
            ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
            : 'border-white/20 bg-white/10 text-white hover:bg-white/15'"
          @click="copyJoinCode"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!codeCopied" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          {{ codeCopied ? 'Copied!' : 'Copy Code' }}
        </button>
        <p v-if="joinCodeExpiry" class="text-xs text-white/50">
          Expires {{ formatExpiry(joinCodeExpiry) }}
        </p>
      </div>
      <p v-else class="mt-4 text-sm text-white/50">No join code found. Click "Regenerate Code" to create one.</p>
    </section>

    <!-- ── Pending Members Panel ───────────────────────────── -->
    <section v-if="pendingMembers.length > 0 || loadingPending" class="org-admin-panel-card">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-bold text-white">
            Pending Approvals
            <span class="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
              {{ pendingMembers.length }}
            </span>
          </h2>
          <p class="text-sm text-white/70">These members registered using your join code and are awaiting your approval.</p>
        </div>
        <button class="org-admin-outline-btn" @click="fetchPendingMembers">Refresh</button>
      </div>

      <p v-if="loadingPending" class="text-sm text-white/60">Loading pending members...</p>

      <div v-else class="space-y-3">
        <article
          v-for="member in pendingMembers"
          :key="member.id"
          class="flex flex-col gap-3 rounded-[18px] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
              {{ member.full_name?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
            <div>
              <p class="text-sm font-bold text-white">{{ member.full_name }}</p>
              <p class="text-xs text-white/60">{{ member.email }}</p>
              <p class="text-xs text-white/40">
                Registered {{ new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/30"
              @click="approveMember(member.id)"
            >
              ✓ Approve
            </button>
            <button
              class="rounded-full bg-red-500/15 px-4 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/25"
              @click="rejectMember(member.id)"
            >
              ✕ Reject
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- ── Main Grid ───────────────────────────────────────── -->
    <section class="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr,1.05fr]">
      <section class="space-y-5">
        <section class="org-admin-panel-card">
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-white">Create User</h2>
              <p class="text-sm text-white/70">New users attach automatically to your organization.</p>
            </div>
            <button class="org-admin-outline-btn" @click="fetchUsers">Refresh Users</button>
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
              <p class="text-sm text-white/70">Only your organization's users are displayed.</p>
            </div>
          </div>

          <p v-if="loadingUsers" class="text-sm text-white/70">Loading users...</p>
          <p v-else-if="users.length === 0" class="text-sm text-white/70">No users found in your organization.</p>
          <MobileDataCardList
            v-else
            :items="users"
            :fields="authorityUserCardFields"
            key-field="id"
          >
            <template #field-name="{ item }">
              <p class="break-words font-semibold text-[var(--app-title-color)]">{{ item.full_name }}</p>
            </template>
            <template #field-email="{ item }">
              <p class="break-all font-medium text-[var(--app-title-color)]">{{ item.email }}</p>
            </template>
            <template #field-role="{ item }">
              <p class="font-medium text-[var(--app-title-color)]">{{ item.role }}</p>
            </template>
            <template #field-status="{ item }">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="item.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : item.status === 'pending' ? 'bg-amber-500/15 text-amber-300' : 'bg-white/10 text-white/60'"
              >
                {{ item.status }}
              </span>
            </template>
          </MobileDataCardList>

          <div v-if="users.length > 0" class="hidden md:block app-table-shell-responsive overflow-x-auto">
            <table class="org-admin-table org-admin-table-responsive min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th class="pb-2 pr-3 text-xs uppercase tracking-wide text-white/70">Name</th>
                  <th class="pb-2 pr-3 text-xs uppercase tracking-wide text-white/70">Email</th>
                  <th class="pb-2 pr-3 text-xs uppercase tracking-wide text-white/70">Role</th>
                  <th class="pb-2 pr-3 text-xs uppercase tracking-wide text-white/70">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in users" :key="row.id" class="border-t border-white/10">
                  <td data-label="Name" class="py-2 pr-3 text-white">{{ row.full_name }}</td>
                  <td data-label="Email" class="py-2 pr-3 text-white/80">{{ row.email }}</td>
                  <td data-label="Role" class="py-2 pr-3 text-white/80">{{ row.role }}</td>
                  <td data-label="Status" class="py-2 pr-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-semibold"
                      :class="row.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : row.status === 'pending' ? 'bg-amber-500/15 text-amber-300' : 'bg-white/10 text-white/60'"
                    >
                      {{ row.status }}
                    </span>
                  </td>
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
          <button class="org-admin-outline-btn" @click="fetchComplaints">Refresh Complaints</button>
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
                <p class="text-xs text-white/60">Department: {{ item.department_name || 'Not specified' }}</p>
                <p class="text-xs text-white/60">
                  Reporter:
                  {{ item.is_anonymous ? 'Anonymous Reporter' : (item.user_full_name || item.anonymous_label || 'Unknown') }}
                </p>
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

    <!-- ── Analytics ───────────────────────────────────────── -->
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
