<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { extractApiError, organizationsApi } from '../../services/api';
import AnalyticsBarChart from '../../components/superAdmin/AnalyticsBarChart.vue';
import AnalyticsLineChart from '../../components/superAdmin/AnalyticsLineChart.vue';
import MobileDataCardList from '../../components/MobileDataCardList.vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import { createSuperAdminAnalytics } from '../../services/analytics.service.js';
import { useSessionStore } from '../../stores/session';

const session = useSessionStore();
const organizations = ref([]);
const organizationsError = ref('');
const loadingOrganizations = ref(false);

const toPercent = (value) => `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`;

const fetchOrganizations = async () => {
  loadingOrganizations.value = true;
  organizationsError.value = '';
  try {
    organizations.value = await organizationsApi.list() || [];
  } catch (requestError) {
    organizationsError.value = extractApiError(requestError, 'Failed to fetch organizations');
  } finally {
    loadingOrganizations.value = false;
  }
};

const refreshDashboard = async () => {
  await Promise.all([session.loadDashboardData(), fetchOrganizations()]);
};

const pageError = computed(() => session.dashboardError || organizationsError.value);
const pageLoading = computed(() => session.loadingDashboard || loadingOrganizations.value);
const dashboardAnalytics = computed(() => createSuperAdminAnalytics({
  organizations: organizations.value || [],
  dashboardStats: session.dashboardStats || {}
}));
const organizationOverviewCardFields = [
  { key: 'organization', label: 'Organization' },
  { key: 'total', label: 'Total Complaints' },
  { key: 'pending', label: 'Pending Complaints' },
  { key: 'response', label: 'Response Rate' },
  { key: 'escalation', label: 'Escalation Rate' },
  { key: 'status', label: 'Status' }
];
const organizationOverviewRows = computed(() => dashboardAnalytics.value.organizationOverviewRows);
const organizationStatusSeries = computed(() => dashboardAnalytics.value.organizationStatusSeries);
const complaintStatusSeries = computed(() => dashboardAnalytics.value.complaintStatusSeries);
const complaintTrendSeries = computed(() => dashboardAnalytics.value.complaintTrendSeries);
const organizationLoadSeries = computed(() => dashboardAnalytics.value.organizationLoadSeries);
const underperformingOrganizations = computed(() => dashboardAnalytics.value.underperformingOrganizations);
const systemAlerts = computed(() => dashboardAnalytics.value.systemAlerts);
const organizationsWithoutAdmin = computed(() => dashboardAnalytics.value.organizationsWithoutAdmin);
const averageComplaintsPerOrganization = computed(() => dashboardAnalytics.value.averageComplaintsPerOrganization);
const openEscalations = computed(() => dashboardAnalytics.value.openEscalations);
const resolutionRate = computed(() => dashboardAnalytics.value.resolutionRate);

const actionCards = [
  {
    title: 'Create Organization',
    detail: 'Add a new organization record and prepare it for org-admin assignment.',
    to: '/admin/organizations'
  },
  {
    title: 'Edit Organization',
    detail: 'Update organization records, contact details, and governance settings.',
    to: '/admin/organizations'
  },
  {
    title: 'Activate or Deactivate',
    detail: 'Change organization status when supervision requires a platform-level decision.',
    to: '/admin/organizations'
  }
];

const kpis = computed(() => [
  {
    label: 'Total Organizations',
    value: dashboardAnalytics.value.summaryCards[0]?.value || 0,
    detail: 'platform directory',
    icon: '🏢'
  },
  {
    label: 'Active Organizations',
    value: dashboardAnalytics.value.summaryCards[1]?.value || 0,
    detail: 'currently operational',
    icon: '✅'
  },
  {
    label: 'Open Escalations',
    value: openEscalations.value,
    detail: 'system-wide',
    icon: '⚠️'
  },
  {
    label: 'Resolution Rate',
    value: toPercent(resolutionRate.value),
    detail: 'read-only complaint flow',
    icon: '📈'
  }
]);

const alertToneClass = (tone) => {
  if (tone === 'danger') return 'app-badge app-badge-danger';
  if (tone === 'warning') return 'app-badge app-badge-warning';
  return 'app-badge app-badge-neutral';
};

const statusBadgeClass = (status) => (
  status === 'active' ? 'app-badge app-badge-success' : 'app-badge app-badge-warning'
);

onMounted(refreshDashboard);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <PageHeader
          kicker="System Supervision"
          title="Super Admin Dashboard"
          description="System-level visibility across organizations, complaint flow, escalation pressure, and platform health. This workspace is read-only for complaint operations and focused on organization oversight."
        >
          <template #actions>
            <button class="app-btn-secondary" type="button" @click="refreshDashboard">
              Refresh Dashboard
            </button>
            <RouterLink to="/admin/organizations" class="app-btn-primary">
              Open Organization Directory
            </RouterLink>
          </template>
        </PageHeader>

        <ErrorState v-if="pageError" title="Could not load oversight dashboard" :description="pageError" />

        <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="item in kpis"
            :key="item.label"
            class="app-section-card"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="app-metric-card">
                <p class="app-metric-label">{{ item.label }}</p>
                <div class="flex items-end gap-2">
                  <p class="app-metric-value">{{ item.value }}</p>
                </div>
                <p class="app-metric-detail">{{ item.detail }}</p>
              </div>
              <div class="flex h-11 w-11 items-center justify-center rounded-[var(--app-radius-lg)] bg-[var(--app-primary-mist)] text-lg">
                {{ item.icon }}
              </div>
            </div>
          </article>
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr),minmax(320px,0.9fr)]">
          <section class="app-section-card">
            <div class="app-section-heading mb-4">
              <p class="app-kicker">Main Analytics</p>
              <h2 class="app-section-title">Read-Only Complaint and Escalation Trends</h2>
              <p class="app-section-description">These charts support supervision only. Complaint handling remains outside the Super Admin dashboard.</p>
            </div>

            <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <AnalyticsLineChart
                title="Complaint Trend"
                subtitle="Monthly complaint volume across the entire platform."
                :series="complaintTrendSeries"
                compact
                empty-message="Monthly complaint data is not available yet."
              />
              <AnalyticsBarChart
                title="Complaint Status Overview"
                subtitle="Current complaint distribution by workflow state."
                :series="complaintStatusSeries"
                compact
                empty-message="Complaint status data is not available yet."
              />
            </div>
          </section>

          <section class="app-section-card">
            <div class="app-section-heading mb-4">
              <p class="app-kicker">System Alerts</p>
              <h2 class="app-section-title">Platform-Level Monitoring</h2>
              <p class="app-section-description">Alerts here highlight supervision issues across organizations, not complaint casework.</p>
            </div>

            <div class="space-y-3">
              <article
                v-for="item in systemAlerts"
                :key="item.title"
                class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-sm)]"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ item.title }}</p>
                    <p class="mt-1 text-sm text-[var(--app-muted-color)]">{{ item.detail }}</p>
                  </div>
                  <span :class="alertToneClass(item.tone)">
                    {{ item.tone === 'danger' ? 'Critical' : item.tone === 'warning' ? 'Watch' : 'Stable' }}
                  </span>
                </div>
              </article>
            </div>
          </section>
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr),minmax(320px,0.95fr)]">
          <section class="app-section-card">
            <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div class="app-section-heading">
                <p class="app-kicker">Organization Insights</p>
                <h2 class="app-section-title">Organization Overview Table</h2>
                <p class="app-section-description">Primary supervision view for organization health, complaint load, response signal, and escalation exposure.</p>
              </div>
              <RouterLink to="/admin/organizations" class="app-btn-secondary">
                Manage Organizations
              </RouterLink>
            </div>

            <LoadingSpinner v-if="pageLoading" label="Loading organization oversight data..." />

            <MobileDataCardList
              v-else-if="organizationOverviewRows.length"
              :items="organizationOverviewRows"
              :fields="organizationOverviewCardFields"
              key-field="id"
            >
              <template #field-organization="{ item }">
                <div class="min-w-0">
                  <p class="break-words font-semibold text-[var(--app-title-color)]">{{ item.name }}</p>
                  <p class="mt-1 text-xs text-[var(--app-muted-color)]">Org admin: {{ item.adminName }}</p>
                </div>
              </template>
              <template #field-total="{ item }">
                <p class="font-medium text-[var(--app-title-color)]">{{ item.totalComplaints }}</p>
              </template>
              <template #field-pending="{ item }">
                <p class="font-medium text-[var(--app-title-color)]">{{ item.pendingComplaints }}</p>
              </template>
              <template #field-response="{ item }">
                <p class="font-medium text-[var(--app-title-color)]">{{ toPercent(item.responseRate) }}</p>
              </template>
              <template #field-escalation="{ item }">
                <p class="font-medium text-[var(--app-title-color)]">{{ toPercent(item.escalationRate) }}</p>
              </template>
              <template #field-status="{ item }">
                <span :class="statusBadgeClass(item.status)">
                  {{ item.status === 'active' ? 'Active' : 'Inactive' }}
                </span>
              </template>
            </MobileDataCardList>

            <div v-if="organizationOverviewRows.length" class="hidden md:block app-table-shell overflow-x-auto">
              <table class="app-table app-table-responsive min-w-full">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Total Complaints</th>
                    <th>Pending Complaints</th>
                    <th>Response Rate</th>
                    <th>Escalation Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in organizationOverviewRows" :key="row.id">
                    <td data-label="Organization">
                      <div class="min-w-[180px]">
                        <p class="font-semibold text-[var(--app-title-color)]">{{ row.name }}</p>
                        <p class="text-xs text-[var(--app-muted-color)]">Org admin: {{ row.adminName }}</p>
                      </div>
                    </td>
                    <td data-label="Total Complaints">{{ row.totalComplaints }}</td>
                    <td data-label="Pending Complaints">{{ row.pendingComplaints }}</td>
                    <td data-label="Response Rate">{{ toPercent(row.responseRate) }}</td>
                    <td data-label="Escalation Rate">{{ toPercent(row.escalationRate) }}</td>
                    <td data-label="Status">
                      <span :class="statusBadgeClass(row.status)">
                        {{ row.status === 'active' ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <EmptyState
              v-else
              title="No organization overview data is available yet."
              description="Organization health data will appear here once platform stats are available."
            />
          </section>

          <div class="space-y-4">
            <section class="app-section-card">
              <div class="app-section-heading mb-4">
                <p class="app-kicker">Underperforming Organizations</p>
                <h2 class="app-section-title">Organizations Needing Attention</h2>
                <p class="app-section-description">High pending volume, elevated escalation exposure, inactive status, or missing org-admin coverage.</p>
              </div>

              <div v-if="underperformingOrganizations.length" class="space-y-3">
                <article
                  v-for="row in underperformingOrganizations"
                  :key="`${row.id}-watch`"
                  class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-[var(--app-title-color)]">{{ row.name }}</p>
                      <p class="mt-1 text-sm text-[var(--app-muted-color)]">
                        Pending {{ row.pendingComplaints }} • Escalation {{ toPercent(row.escalationRate) }}
                      </p>
                    </div>
                    <span class="app-badge app-badge-warning">
                      {{ row.status === 'active' ? 'Watch' : 'Inactive' }}
                    </span>
                  </div>
                </article>
              </div>

              <EmptyState
                v-else
                title="No organizations are currently flagged for elevated supervision."
                description="Current organization performance signals look healthy."
              />
            </section>

            <AnalyticsBarChart
              title="Complaints by Organization"
              subtitle="Highest complaint loads across the organization directory."
              :series="organizationLoadSeries"
              compact
              empty-message="Organization complaint concentration is not available yet."
            />
          </div>
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr),minmax(320px,1fr)]">
          <section class="app-section-card">
            <div class="app-section-heading mb-4">
              <p class="app-kicker">Organization Management</p>
              <h2 class="app-section-title">Limited Super Admin Actions</h2>
              <p class="app-section-description">Super Admin actions are restricted to organization lifecycle and platform supervision only.</p>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <RouterLink
                v-for="action in actionCards"
                :key="action.title"
                :to="action.to"
                class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-sm)] transition hover:-translate-y-[1px] hover:border-[var(--app-line-strong)]"
              >
                <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ action.title }}</p>
                <p class="mt-2 text-sm text-[var(--app-muted-color)]">{{ action.detail }}</p>
              </RouterLink>
            </div>
          </section>

          <section class="app-section-card">
            <div class="app-section-heading mb-4">
              <p class="app-kicker">Supporting Signals</p>
              <h2 class="app-section-title">Coverage and Escalation Monitoring</h2>
              <p class="app-section-description">Secondary indicators that help the platform team spot organizational risk early.</p>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <article class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Missing Org Admin</p>
                <p class="mt-2 text-3xl font-semibold text-[var(--app-title-color)]">{{ organizationsWithoutAdmin.length }}</p>
                <p class="mt-2 text-sm text-[var(--app-muted-color)]">Organizations that still need administrative ownership.</p>
              </article>
              <article class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Avg Complaints / Org</p>
                <p class="mt-2 text-3xl font-semibold text-[var(--app-title-color)]">{{ averageComplaintsPerOrganization }}</p>
                <p class="mt-2 text-sm text-[var(--app-muted-color)]">Average complaint load across active organizations.</p>
              </article>
            </div>

            <div class="mt-4">
              <AnalyticsBarChart
                title="Organization Coverage"
                subtitle="Current platform directory readiness."
                :series="organizationStatusSeries"
                compact
                empty-message="Organization coverage data is not available yet."
              />
            </div>
          </section>
        </section>
      </div>
    </div>
  </section>
</template>
