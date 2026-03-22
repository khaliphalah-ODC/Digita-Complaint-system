<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import AnalyticsBarChart from '../../components/superAdmin/AnalyticsBarChart.vue';
import AnalyticsDonutChart from '../../components/superAdmin/AnalyticsDonutChart.vue';
import AnalyticsLineChart from '../../components/superAdmin/AnalyticsLineChart.vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import { useSessionStore } from '../../stores/session';

const session = useSessionStore();
const loading = ref(false);
const error = ref('');
const complaints = ref([]);
const users = ref([]);
const departments = ref([]);
const escalations = ref([]);
const statusLogs = ref([]);
const lastRefresh = ref(null);
let pollTimer = null;

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const toTime = (value) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toShortDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const daysSince = (value) => {
  const time = toTime(value);
  if (!time) return 0;
  return Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24));
};

const fetchDashboardData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const [usersRes, complaintsRes, departmentsRes, escalationsRes, statusLogsRes] = await Promise.all([
      api.get('/users'),
      api.get('/complaint'),
      api.get('/department'),
      api.get('/escalations'),
      api.get('/status-logs')
    ]);

    users.value = ensureSuccess(unwrapResponse(usersRes), 'Failed to fetch users') || [];
    complaints.value = ensureSuccess(unwrapResponse(complaintsRes), 'Failed to fetch complaints') || [];
    departments.value = ensureSuccess(unwrapResponse(departmentsRes), 'Failed to fetch departments') || [];
    escalations.value = ensureSuccess(unwrapResponse(escalationsRes), 'Failed to fetch escalations') || [];
    statusLogs.value = ensureSuccess(unwrapResponse(statusLogsRes), 'Failed to fetch status logs') || [];
    lastRefresh.value = new Date();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load organization dashboard');
  } finally {
    loading.value = false;
  }
};

const complaintsSorted = computed(() =>
  [...complaints.value].sort((a, b) => {
    const aTime = toTime(a.updated_at || a.reviewed_at || a.created_at);
    const bTime = toTime(b.updated_at || b.reviewed_at || b.created_at);
    return bTime - aTime;
  })
);

const activeUsers = computed(() =>
  users.value.filter((row) => String(row.status || '').toLowerCase() === 'active')
);

const inactiveUsers = computed(() =>
  users.value.filter((row) => String(row.status || '').toLowerCase() !== 'active')
);

const openComplaints = computed(() =>
  complaints.value.filter((row) => ['submitted', 'in_review'].includes(String(row.status || '').toLowerCase()))
);

const inReviewComplaints = computed(() =>
  complaints.value.filter((row) => String(row.status || '').toLowerCase() === 'in_review')
);

const resolvedThisWeek = computed(() => {
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return complaints.value.filter((row) => {
    const status = String(row.status || '').toLowerCase();
    const resolvedAt = toTime(row.reviewed_at || row.updated_at || row.created_at);
    return ['resolved', 'closed'].includes(status) && resolvedAt >= weekAgo;
  }).length;
});

const newComplaintsThisWeek = computed(() => {
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return complaints.value.filter((row) => toTime(row.created_at) >= weekAgo).length;
});

const overdueComplaints = computed(() =>
  openComplaints.value.filter((row) => daysSince(row.updated_at || row.created_at) >= 4)
);

const unassignedDepartmentComplaints = computed(() =>
  openComplaints.value.filter((row) => !row.department_id && !row.department_name)
);

const unansweredComplaints = computed(() =>
  openComplaints.value.filter((row) => !String(row.admin_response || '').trim())
);

const activeEscalations = computed(() =>
  escalations.value.filter((row) => ['pending', 'in_progress'].includes(String(row.status || '').toLowerCase()))
);

const summaryCards = computed(() => [
  {
    label: 'Open Complaints',
    value: openComplaints.value.length,
    detail: 'submitted or in review',
    icon: '📂'
  },
  {
    label: 'In Review',
    value: inReviewComplaints.value.length,
    detail: 'awaiting progress',
    icon: '📝'
  },
  {
    label: 'Resolved This Week',
    value: resolvedThisWeek.value,
    detail: 'closed or resolved',
    icon: '✅'
  },
  {
    label: 'New Complaints This Week',
    value: newComplaintsThisWeek.value,
    detail: 'fresh intake',
    icon: '🆕'
  },
  {
    label: 'Active Users',
    value: activeUsers.value.length,
    detail: 'organization staff',
    icon: '👥'
  }
]);

const attentionItems = computed(() => {
  const items = [];

  if (overdueComplaints.value.length) {
    items.push({
      title: `${overdueComplaints.value.length} complaints are overdue`,
      detail: 'These cases have stayed open for at least 4 days without resolution.',
      tone: 'danger'
    });
  }

  if (activeEscalations.value.length) {
    items.push({
      title: `${activeEscalations.value.length} escalations are still active`,
      detail: 'Escalated complaints need direct operational follow-up inside this organization.',
      tone: 'warning'
    });
  }

  if (unassignedDepartmentComplaints.value.length) {
    items.push({
      title: `${unassignedDepartmentComplaints.value.length} complaints need department assignment`,
      detail: 'Routing these complaints will reduce response delays and improve workload clarity.',
      tone: 'warning'
    });
  }

  if (unansweredComplaints.value.length) {
    items.push({
      title: `${unansweredComplaints.value.length} complaints still need an admin response`,
      detail: 'These cases appear open without a recorded official response.',
      tone: 'danger'
    });
  }

  if (!items.length) {
    items.push({
      title: 'No urgent complaint workflow blockers right now',
      detail: 'Complaint intake, assignment, and response activity look stable inside this organization.',
      tone: 'info'
    });
  }

  return items.slice(0, 4);
});

const statusSeries = computed(() => {
  const counts = {
    submitted: 0,
    in_review: 0,
    resolved: 0,
    closed: 0
  };

  for (const complaint of complaints.value) {
    const status = String(complaint.status || 'submitted').toLowerCase();
    if (Object.hasOwn(counts, status)) counts[status] += 1;
  }

  return [
    { label: 'Submitted', value: counts.submitted, tone: '#f59e0b' },
    { label: 'In Review', value: counts.in_review, tone: '#2563eb' },
    { label: 'Resolved', value: counts.resolved, tone: '#16a34a' },
    { label: 'Closed', value: counts.closed, tone: '#64748b' }
  ];
});

const complaintTrendSeries = computed(() => {
  const timeline = {};
  const now = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    timeline[key] = {
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: 0
    };
  }

  for (const complaint of complaints.value) {
    const key = (complaint.created_at ? new Date(complaint.created_at) : new Date()).toISOString().slice(0, 10);
    if (timeline[key]) timeline[key].value += 1;
  }

  return Object.values(timeline);
});

const departmentWorkloadSeries = computed(() => {
  const counts = new Map();

  for (const department of departments.value) {
    counts.set(String(department.name || `Department #${department.id}`), 0);
  }

  for (const complaint of complaints.value) {
    const label = complaint.department_name || 'Unassigned';
    counts.set(label, Number(counts.get(label) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, value], index) => ({
      label,
      value,
      tone: index === 0 ? '#183a63' : index === 1 ? '#335c8a' : index === 2 ? '#5b587f' : '#8a6d2f'
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
});

const recentActivity = computed(() => {
  const complaintItems = complaints.value.slice(0, 8).map((row) => ({
    title: row.title || 'Untitled complaint',
    detail: `Complaint received${row.department_name ? ` • ${row.department_name}` : ''}`,
    when: toTime(row.created_at),
    date: row.created_at,
    tone: 'complaint'
  }));

  const statusItems = statusLogs.value.slice(0, 8).map((row) => ({
    title: row.new_status || 'Status updated',
    detail: `${row.old_status || 'N/A'} -> ${row.new_status}${row.notes ? ` • ${row.notes}` : ''}`,
    when: toTime(row.created_at),
    date: row.created_at,
    tone: 'status'
  }));

  const escalationItems = escalations.value.slice(0, 8).map((row) => ({
    title: `Escalation ${row.escalation_level || 'raised'}`,
    detail: `${row.reason || 'Escalation updated'} • ${row.status || 'pending'}`,
    when: toTime(row.updated_at || row.created_at),
    date: row.updated_at || row.created_at,
    tone: 'escalation'
  }));

  const userItems = users.value.slice(0, 8).map((row) => ({
    title: row.full_name || row.email || 'User update',
    detail: `${row.role || 'user'} • ${row.status || 'active'}`,
    when: toTime(row.created_at || row.updated_at),
    date: row.created_at || row.updated_at,
    tone: 'user'
  }));

  return [...complaintItems, ...statusItems, ...escalationItems, ...userItems]
    .filter((item) => item.when > 0)
    .sort((a, b) => b.when - a.when)
    .slice(0, 6);
});

const recentComplaints = computed(() => complaintsSorted.value.slice(0, 8));

const recentUsers = computed(() =>
  [...users.value]
    .sort((a, b) => toTime(b.created_at || b.updated_at) - toTime(a.created_at || a.updated_at))
    .slice(0, 5)
);

const quickActions = [
  { title: 'View All Complaints', detail: 'Open the full complaint queue and continue casework.', to: '/org-admin/complaints' },
  { title: 'Manage Users', detail: 'Create or update organization users and staff roles.', to: '/org-admin/users' },
  { title: 'Manage Departments', detail: 'Maintain department structure and assignment targets.', to: '/org-admin/departments' },
  { title: 'Review Escalations', detail: 'Handle escalated issues inside this organization.', to: '/org-admin/escalations' }
];

const lastUpdatedLabel = computed(() => {
  if (!lastRefresh.value) return 'Not refreshed yet';
  return `Updated ${lastRefresh.value.toLocaleTimeString()} on ${lastRefresh.value.toLocaleDateString()}`;
});

const alertToneClass = (tone) => {
  if (tone === 'danger') return 'app-badge app-badge-danger';
  if (tone === 'warning') return 'app-badge app-badge-warning';
  return 'app-badge app-badge-neutral';
};

const complaintStatusBadgeClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'resolved') return 'app-badge app-badge-success';
  if (normalized === 'closed') return 'app-badge app-badge-neutral';
  return 'app-badge app-badge-warning';
};

onMounted(async () => {
  await fetchDashboardData();
  pollTimer = setInterval(() => {
    void fetchDashboardData();
  }, 30000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <section class="min-h-full p-3 sm:p-4">
    <div class="app-page-shell mx-auto max-w-7xl p-3 sm:p-4">
      <div class="space-y-4 rounded-[var(--app-radius-xl)] border border-[var(--app-line)] bg-[rgba(255,255,255,0.42)] p-4 sm:p-5">
        <PageHeader
          kicker="Organization Operations"
          title="Organization Admin Dashboard"
          description="Manage complaint workflow, team activity, department workload, and response progress inside your organization. This dashboard is operational and organization-specific."
        >
          <template #actions>
            <button class="app-btn-secondary" type="button" @click="fetchDashboardData">
              Refresh Dashboard
            </button>
            <RouterLink to="/org-admin/complaints" class="app-btn-primary">
              Open Complaint Queue
            </RouterLink>
          </template>
        </PageHeader>

        <p
          v-if="error"
          class="rounded-[var(--app-radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ error }}
        </p>

        <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <article
            v-for="item in summaryCards"
            :key="item.label"
            class="app-section-card"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">{{ item.label }}</p>
                <p class="mt-2 text-3xl font-semibold text-[var(--app-title-color)]">{{ loading ? '...' : item.value }}</p>
                <p class="mt-2 text-sm text-[var(--app-muted-color)]">{{ item.detail }}</p>
              </div>
              <div class="flex h-11 w-11 items-center justify-center rounded-[var(--app-radius-lg)] bg-[var(--app-primary-mist)] text-lg">
                {{ item.icon }}
              </div>
            </div>
          </article>
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr),minmax(320px,0.85fr)]">
          <section class="app-section-card">
            <div class="mb-4">
              <p class="app-kicker">Complaints Needing Attention</p>
              <h2 class="mt-2 text-xl font-semibold text-[var(--app-title-color)]">Operational Priorities</h2>
              <p class="mt-1 text-sm text-[var(--app-muted-color)]">Focus first on overdue complaints, unresolved escalations, and cases that are still waiting for assignment or response.</p>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <article
                v-for="item in attentionItems"
                :key="item.title"
                class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-sm)]"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ item.title }}</p>
                    <p class="mt-1 text-sm text-[var(--app-muted-color)]">{{ item.detail }}</p>
                  </div>
                  <span :class="alertToneClass(item.tone)">
                    {{ item.tone === 'danger' ? 'Urgent' : item.tone === 'warning' ? 'Watch' : 'Stable' }}
                  </span>
                </div>
              </article>
            </div>
          </section>

          <section class="app-section-card">
            <div class="mb-4">
              <p class="app-kicker">Quick Actions</p>
              <h2 class="mt-2 text-xl font-semibold text-[var(--app-title-color)]">Team Workflow Shortcuts</h2>
              <p class="mt-1 text-sm text-[var(--app-muted-color)]">Jump directly into the org-level tools needed for daily complaint and staff operations.</p>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RouterLink
                v-for="action in quickActions"
                :key="action.title"
                :to="action.to"
                class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-sm)] transition hover:-translate-y-[1px] hover:border-[var(--app-line-strong)]"
              >
                <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ action.title }}</p>
                <p class="mt-2 text-sm text-[var(--app-muted-color)]">{{ action.detail }}</p>
              </RouterLink>
            </div>
          </section>
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr),minmax(320px,0.9fr)]">
          <section class="app-section-card">
            <div class="mb-4">
              <p class="app-kicker">Operational Analytics</p>
              <h2 class="mt-2 text-xl font-semibold text-[var(--app-title-color)]">Complaint Volume, Status, and Department Load</h2>
              <p class="mt-1 text-sm text-[var(--app-muted-color)]">Charts here are meant to help staffing, routing, and follow-up inside this organization.</p>
            </div>

            <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <AnalyticsLineChart
                title="Weekly Complaint Trend"
                subtitle="New complaint intake over the last 7 days."
                :series="complaintTrendSeries"
                compact
                empty-message="Recent complaint trend data is not available yet."
              />
              <AnalyticsDonutChart
                title="Complaint Status Overview"
                subtitle="Current complaint distribution inside this organization."
                center-label="Complaints"
                :series="statusSeries"
                empty-message="Complaint status data is not available yet."
              />
            </div>
          </section>

          <AnalyticsBarChart
            title="Complaints by Department"
            subtitle="Workload visibility across departments and unassigned complaint volume."
            :series="departmentWorkloadSeries"
            compact
            empty-message="Department workload data is not available yet."
          />
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr),minmax(0,1.05fr)]">
          <section class="app-section-card">
            <div class="mb-4 flex items-end justify-between gap-3">
              <div>
                <p class="app-kicker">Recent Activity</p>
                <h2 class="mt-2 text-xl font-semibold text-[var(--app-title-color)]">Latest Organization Updates</h2>
                <p class="mt-1 text-sm text-[var(--app-muted-color)]">Recent complaint updates, escalations, status changes, and staff activity.</p>
              </div>
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-muted-color)]">{{ lastUpdatedLabel }}</p>
            </div>

            <div v-if="recentActivity.length" class="space-y-3">
              <article
                v-for="item in recentActivity"
                :key="`${item.title}-${item.date}-${item.detail}`"
                class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ item.title }}</p>
                    <p class="mt-1 text-sm text-[var(--app-muted-color)]">{{ item.detail }}</p>
                  </div>
                  <p class="whitespace-nowrap text-xs text-[var(--app-muted-color)]">{{ toShortDate(item.date) }}</p>
                </div>
              </article>
            </div>

            <div v-else class="app-empty-state">
              No recent organization activity is available yet.
            </div>
          </section>

          <section class="app-section-card">
            <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p class="app-kicker">User Management</p>
                <h2 class="mt-2 text-xl font-semibold text-[var(--app-title-color)]">Organization Staff Overview</h2>
                <p class="mt-1 text-sm text-[var(--app-muted-color)]">This view stays limited to users inside your organization only.</p>
              </div>
              <RouterLink to="/org-admin/users" class="app-btn-secondary">
                Manage Users
              </RouterLink>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <article class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Total Users</p>
                <p class="mt-2 text-3xl font-semibold text-[var(--app-title-color)]">{{ users.length }}</p>
              </article>
              <article class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Active Staff</p>
                <p class="mt-2 text-3xl font-semibold text-[var(--app-title-color)]">{{ activeUsers.length }}</p>
              </article>
              <article class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Inactive Staff</p>
                <p class="mt-2 text-3xl font-semibold text-[var(--app-title-color)]">{{ inactiveUsers.length }}</p>
              </article>
            </div>

            <div v-if="recentUsers.length" class="mt-4 space-y-3">
              <article
                v-for="row in recentUsers"
                :key="row.id"
                class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ row.full_name || 'Unnamed User' }}</p>
                    <p class="mt-1 text-sm text-[var(--app-muted-color)]">{{ row.email }}</p>
                  </div>
                  <div class="text-right">
                    <span class="app-badge app-badge-neutral">{{ row.role || 'user' }}</span>
                    <p class="mt-2 text-xs text-[var(--app-muted-color)]">{{ row.status || 'active' }}</p>
                  </div>
                </div>
              </article>
            </div>

            <div v-else class="app-empty-state mt-4">
              No recent staff activity is available yet.
            </div>
          </section>
        </section>

        <section class="app-section-card">
          <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="app-kicker">Recent Complaints</p>
              <h2 class="mt-2 text-xl font-semibold text-[var(--app-title-color)]">Practical Workflow Queue</h2>
              <p class="mt-1 text-sm text-[var(--app-muted-color)]">Recent complaints with the operational details needed for review, assignment, and status updates.</p>
            </div>
            <RouterLink to="/org-admin/complaints" class="app-btn-secondary">
              View All Complaints
            </RouterLink>
          </div>

          <div v-if="recentComplaints.length" class="app-table-shell overflow-x-auto">
            <table class="app-table min-w-full">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in recentComplaints" :key="row.id">
                  <td>
                    <div class="min-w-[220px]">
                      <p class="font-semibold text-[var(--app-title-color)]">{{ row.title || 'Untitled Complaint' }}</p>
                      <p class="text-xs text-[var(--app-muted-color)]">Tracking: {{ row.tracking_code || 'N/A' }}</p>
                    </div>
                  </td>
                  <td>{{ row.department_name || 'Unassigned' }}</td>
                  <td>{{ row.priority || 'medium' }}</td>
                  <td>
                    <span :class="complaintStatusBadgeClass(row.status)">
                      {{ row.status || 'submitted' }}
                    </span>
                  </td>
                  <td>{{ toShortDate(row.updated_at || row.reviewed_at || row.created_at) }}</td>
                  <td>
                    <RouterLink :to="`/org-admin/complaints/${row.id}`" class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs">
                      Open
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="app-empty-state">
            No complaints are available in this organization yet.
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
