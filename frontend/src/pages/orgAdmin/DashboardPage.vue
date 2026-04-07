<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { authApi, complaintsApi, departmentsApi, escalationsApi, extractApiError, statusLogsApi } from '../../services/api';
import AnalyticsBarChart from '../../components/superAdmin/AnalyticsBarChart.vue';
import AnalyticsDonutChart from '../../components/superAdmin/AnalyticsDonutChart.vue';
import AnalyticsLineChart from '../../components/superAdmin/AnalyticsLineChart.vue';
import MobileDataCardList from '../../components/MobileDataCardList.vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { createOrgAdminAnalytics } from '../../services/analytics.service.js';
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
    const [userRows, complaintRows, departmentRows, escalationRows, statusLogRows] = await Promise.all([
      authApi.listUsers(),
      complaintsApi.list(),
      departmentsApi.list(),
      escalationsApi.list(),
      statusLogsApi.list()
    ]);

    users.value = userRows || [];
    complaints.value = complaintRows || [];
    departments.value = departmentRows || [];
    escalations.value = escalationRows || [];
    statusLogs.value = statusLogRows || [];
    lastRefresh.value = new Date();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load organization dashboard');
  } finally {
    loading.value = false;
  }
};
const dashboardAnalytics = computed(() => createOrgAdminAnalytics({
  complaints: complaints.value || [],
  users: users.value || [],
  departments: departments.value || [],
  escalations: escalations.value || [],
  statusLogs: statusLogs.value || []
}));

const complaintsSorted = computed(() => dashboardAnalytics.value.complaintsSorted);
const activeUsers = computed(() => dashboardAnalytics.value.activeUsers);
const inactiveUsers = computed(() => dashboardAnalytics.value.inactiveUsers);
const openComplaints = computed(() => dashboardAnalytics.value.openComplaints);
const inReviewComplaints = computed(() => dashboardAnalytics.value.inReviewComplaints);
const activeEscalations = computed(() => dashboardAnalytics.value.activeEscalations);
const summaryCards = computed(() => dashboardAnalytics.value.summaryCards);
const attentionItems = computed(() => dashboardAnalytics.value.attentionItems);
const statusSeries = computed(() => dashboardAnalytics.value.statusSeries);
const complaintTrendSeries = computed(() => dashboardAnalytics.value.complaintTrendSeries);
const departmentWorkloadSeries = computed(() => dashboardAnalytics.value.departmentWorkloadSeries);

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
const recentComplaintCardFields = [
  { key: 'complaint', label: 'Complaint' },
  { key: 'department', label: 'Department' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'updated', label: 'Updated' }
];

const recentUsers = computed(() =>
  [...users.value]
    .sort((a, b) => toTime(b.created_at || b.updated_at) - toTime(a.created_at || a.updated_at))
    .slice(0, 5)
);

const quickActions = [
  { title: 'View All Complaints', detail: 'Open the full complaint queue and continue casework.', to: '/org-admin/complaints' },
  { title: 'Manage Users', detail: 'Create or update organization users and staff roles.', to: '/org-admin/users' },
  { title: 'Manage Departments', detail: 'Maintain department structure and assignment targets.', to: '/org-admin/departments' },
  { title: 'Review Escalations', detail: 'Handle escalated issues inside this organization.', to: '/org-admin/escalations' },
  { title: 'Public Feedback Channel', detail: 'Configure the public QR feedback form and review incoming submissions.', to: '/org-admin/public-feedback' }
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
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
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

        <ErrorState v-if="error" title="Could not load organization dashboard" :description="error" />

        <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <article
            v-for="item in summaryCards"
            :key="item.label"
            class="app-section-card"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="app-metric-card">
                <p class="app-metric-label">{{ item.label }}</p>
                <p class="app-metric-value">{{ loading ? '...' : item.value }}</p>
                <p class="app-metric-detail">{{ item.detail }}</p>
              </div>
              <div class="flex h-11 w-11 items-center justify-center rounded-[var(--app-radius-lg)] bg-[var(--app-primary-mist)] text-lg">
                {{ item.icon }}
              </div>
            </div>
          </article>
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr),minmax(320px,0.85fr)]">
          <section class="app-section-card">
            <div class="app-section-heading mb-4">
              <p class="app-kicker">Complaints Needing Attention</p>
              <h2 class="app-section-title">Operational Priorities</h2>
              <p class="app-section-description">Focus first on overdue complaints, unresolved escalations, and cases that are still waiting for assignment or response.</p>
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
            <div class="app-section-heading mb-4">
              <p class="app-kicker">Quick Actions</p>
              <h2 class="app-section-title">Team Workflow Shortcuts</h2>
              <p class="app-section-description">Jump directly into the org-level tools needed for daily complaint and staff operations.</p>
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
            <div class="app-section-heading mb-4">
              <p class="app-kicker">Operational Analytics</p>
              <h2 class="app-section-title">Complaint Volume, Status, and Department Load</h2>
              <p class="app-section-description">Charts here are meant to help staffing, routing, and follow-up inside this organization.</p>
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
              <div class="app-section-heading">
                <p class="app-kicker">Recent Activity</p>
                <h2 class="app-section-title">Latest Organization Updates</h2>
                <p class="app-section-description">Recent complaint updates, escalations, status changes, and staff activity.</p>
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

            <EmptyState
              v-else
              title="No recent organization activity is available yet."
              description="Complaint, escalation, and user activity will appear here as your team works."
            />
          </section>

          <section class="app-section-card">
            <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div class="app-section-heading">
                <p class="app-kicker">User Management</p>
                <h2 class="app-section-title">Organization Staff Overview</h2>
                <p class="app-section-description">This view stays limited to users inside your organization only.</p>
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

            <EmptyState
              v-else
              container-class="mt-4"
              title="No recent staff activity is available yet."
              description="New staff updates will show up here when team accounts are created or updated."
            />
          </section>
        </section>

        <section class="app-section-card">
          <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div class="app-section-heading">
              <p class="app-kicker">Recent Complaints</p>
              <h2 class="app-section-title">Practical Workflow Queue</h2>
              <p class="app-section-description">Recent complaints with the operational details needed for review, assignment, and status updates.</p>
            </div>
            <RouterLink to="/org-admin/complaints" class="app-btn-secondary">
              View All Complaints
            </RouterLink>
          </div>

          <MobileDataCardList
            v-if="recentComplaints.length"
            :items="recentComplaints"
            :fields="recentComplaintCardFields"
            key-field="id"
          >
            <template #field-complaint="{ item }">
              <div class="min-w-0">
                <p class="break-words font-semibold text-[var(--app-title-color)]">{{ item.title || 'Untitled Complaint' }}</p>
                <p class="mt-1 text-xs text-[var(--app-muted-color)]">Tracking: {{ item.tracking_code || 'N/A' }}</p>
              </div>
            </template>
            <template #field-department="{ item }">
              <p class="break-words font-medium text-[var(--app-title-color)]">{{ item.department_name || 'Unassigned' }}</p>
            </template>
            <template #field-priority="{ item }">
              <StatusBadge :value="item.priority || 'medium'" />
            </template>
            <template #field-status="{ item }">
              <StatusBadge :value="item.status || 'submitted'" />
            </template>
            <template #field-updated="{ item }">
              <p class="font-medium text-[var(--app-title-color)]">{{ toShortDate(item.updated_at || item.reviewed_at || item.created_at) }}</p>
            </template>
            <template #actions="{ item }">
              <RouterLink :to="`/org-admin/complaints/${item.id}`" class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs">
                Open
              </RouterLink>
            </template>
          </MobileDataCardList>

          <div v-if="recentComplaints.length" class="hidden md:block app-table-shell overflow-x-auto">
            <table class="app-table app-table-responsive min-w-full">
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
                  <td data-label="Complaint">
                    <div class="min-w-[220px]">
                      <p class="font-semibold text-[var(--app-title-color)]">{{ row.title || 'Untitled Complaint' }}</p>
                      <p class="text-xs text-[var(--app-muted-color)]">Tracking: {{ row.tracking_code || 'N/A' }}</p>
                    </div>
                  </td>
                  <td data-label="Department">{{ row.department_name || 'Unassigned' }}</td>
                  <td data-label="Priority">{{ row.priority || 'medium' }}</td>
                  <td data-label="Status">
                    <StatusBadge :value="row.status || 'submitted'" />
                  </td>
                  <td data-label="Updated">{{ toShortDate(row.updated_at || row.reviewed_at || row.created_at) }}</td>
                  <td data-label="Actions" data-actions="true">
                    <RouterLink :to="`/org-admin/complaints/${row.id}`" class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs">
                      Open
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <EmptyState
            v-else
            title="No complaints are available in this organization yet."
            description="Once complaints are submitted to this organization, they will appear here."
          />
        </section>
      </div>
    </div>
  </section>
</template>
