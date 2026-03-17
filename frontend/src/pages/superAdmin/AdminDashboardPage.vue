<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import ActivityFeed from '../../components/ActivityFeed.vue';
import AnalyticsBarChart from '../../components/superAdmin/AnalyticsBarChart.vue';
import AnalyticsDonutChart from '../../components/superAdmin/AnalyticsDonutChart.vue';
import AnalyticsLineChart from '../../components/superAdmin/AnalyticsLineChart.vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import { useSessionStore } from '../../stores/session';

const session = useSessionStore();

const complaintStatusSeries = computed(() => [
  { label: 'Submitted', value: Number(session.dashboardStats.submittedComplaints || 0), tone: '#4f8df7' },
  { label: 'In Review', value: Number(session.dashboardStats.inReviewComplaints || 0), tone: '#1f4db7' },
  { label: 'Resolved', value: Number(session.dashboardStats.resolvedComplaints || 0), tone: '#22c55e' },
  { label: 'Closed', value: Number(session.dashboardStats.closedComplaints || 0), tone: '#163462' }
]);

const escalationSeries = computed(() => {
  const counts = session.dashboardStats.escalationStatusCounts || {};
  return [
    { label: 'Pending', value: Number(counts.pending || 0), tone: '#4f8df7' },
    { label: 'In Progress', value: Number(counts.in_progress || 0), tone: '#1f4db7' },
    { label: 'Resolved', value: Number(counts.resolved || 0), tone: '#22c55e' },
    { label: 'Rejected', value: Number(counts.rejected || 0), tone: '#ef4444' }
  ];
});

const organizationLoadSeries = computed(() => {
  return (session.dashboardStats.complaintsByOrganization || []).slice(0, 8).map((item, index) => ({
    label: item.label,
    value: Number(item.value || 0),
    tone: ['#1f4db7', '#4f8df7', '#7fb3ff', '#245bcf', '#163462', '#9bc3ff'][index % 6]
  }));
});

const complaintTrendSeries = computed(() => session.dashboardStats.complaintMonthlyTrend || []);

const dashboardCards = computed(() => [
  {
    label: 'Organizations',
    value: Number(session.dashboardStats.totalOrganizations || 0),
    detail: `${Number(session.dashboardStats.activeOrganizations || 0)} active`,
    accent: 'from-blue-400 to-[var(--app-primary)]'
  },
  {
    label: 'Complaint Flow',
    value: Number(session.dashboardStats.totalComplaints || 0),
    detail: `${Number(session.dashboardStats.inReviewComplaints || 0)} in review`,
    accent: 'from-blue-500 to-sky-400'
  },
  {
    label: 'Triage Queue',
    value: Number(session.dashboardStats.unassignedAnonymousComplaints || 0),
    detail: 'Waiting for assignment',
    accent: 'from-blue-300 to-blue-500'
  },
  {
    label: 'Resolved',
    value: Number(session.dashboardStats.resolvedComplaints || 0),
    detail: 'Resolved platform-wide',
    accent: 'from-emerald-400 to-emerald-600'
  }
]);

const quickActions = [
  {
    title: 'Organizations',
    description: 'Manage organization records, statuses, and assigned org-admin accounts.',
    to: '/admin/organizations'
  },
  {
    title: 'Triage Queue',
    description: 'Route anonymous complaints that were submitted without an organization.',
    to: '/admin/triage'
  },
  {
    title: 'Analytics',
    description: 'Open the full aggregate analytics workspace for platform-level reporting.',
    to: '/admin/reports'
  }
];

onMounted(() => {
  session.loadDashboardData();
});
</script>

<template>
  <section class="app-dark-stage space-y-5 rounded-[34px] p-4 sm:p-6">
    <PageHeader
      theme="dark"
      kicker="Super Admin Command Center"
      title="Dashboard"
      description="Monitor platform performance, watch queue pressure, and jump into the super-admin tools that need attention."
    >
      <template #actions>
        <div class="flex flex-wrap items-center justify-end gap-3">
          <label class="flex min-w-[230px] items-center gap-3 rounded-full border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/68">
            <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="text-white/40" />
            <input
              type="text"
              placeholder="Search metrics or organizations..."
              class="w-full bg-transparent text-sm text-white placeholder:text-white/34 focus:outline-none"
            >
          </label>
          <div class="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-white/72">
            <font-awesome-icon :icon="['fas', 'calendar-days']" class="text-blue-200" />
            <span>Jan 1 - Dec 31</span>
          </div>
          <RouterLink
            to="/admin/reports"
            class="rounded-full bg-[linear-gradient(90deg,#163462_0%,#1f4db7_58%,#4f8df7_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(31,77,183,0.28)]"
          >
            View Analytics
          </RouterLink>
        </div>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-4">
      <article
        v-for="item in dashboardCards"
        :key="item.label"
        class="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 text-white shadow-[0_16px_40px_rgba(2,6,23,0.32)]"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.18em] text-white/44">{{ item.label }}</p>
            <p class="mt-4 text-4xl font-black">{{ item.value }}</p>
          </div>
          <span :class="`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent}`">
            <font-awesome-icon :icon="['fas', 'sparkles']" class="text-sm text-white" />
          </span>
        </div>
        <p class="mt-5 text-sm text-white/58">{{ item.detail }}</p>
      </article>
    </section>

    <section class="flex flex-wrap items-center gap-3 rounded-[24px] border border-blue-200/20 bg-blue-200/10 px-4 py-3">
      <span class="rounded-full bg-blue-200 px-3 py-1 text-xs font-black text-[var(--app-primary-ink)]">
        {{ session.loadingDashboard ? '...' : session.dashboardStats.unassignedAnonymousComplaints }}
      </span>
      <span class="text-sm font-semibold text-blue-100">Unassigned anonymous complaints are waiting in the triage queue.</span>
      <RouterLink to="/admin/triage" class="ml-auto text-sm font-semibold text-blue-200 underline underline-offset-4">
        Review Queue
      </RouterLink>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <RouterLink
        v-for="action in quickActions"
        :key="action.title"
        :to="action.to"
        class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
      >
        <p class="text-xs uppercase tracking-[0.18em] text-blue-200/80">Quick Access</p>
        <h2 class="mt-3 text-2xl font-black text-white">{{ action.title }}</h2>
        <p class="mt-3 text-sm leading-6 text-white/58">{{ action.description }}</p>
      </RouterLink>
    </section>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-[1.18fr,0.82fr]">
      <AnalyticsBarChart
        title="Complaint Load By Organization"
        subtitle="Current routed complaint volume across the busiest organizations."
        :series="organizationLoadSeries"
        theme="dark"
      />
      <AnalyticsDonutChart
        title="Complaint Status Snapshot"
        subtitle="Live platform-wide distribution of complaint states."
        :series="complaintStatusSeries"
        center-label="Complaints"
        theme="dark"
      />
    </section>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-[1.22fr,0.78fr]">
      <AnalyticsLineChart
        title="Monthly Complaint Trend"
        subtitle="Complaint volume over the last 12 months across the platform."
        :series="complaintTrendSeries"
        line-color="#4f8df7"
        theme="dark"
      />
      <AnalyticsBarChart
        title="Escalation Queue Snapshot"
        subtitle="Current distribution of escalations across the platform."
        :series="escalationSeries"
        theme="dark"
      />
    </section>

    <ActivityFeed
      :items="session.activityFeed"
      :loading="session.loadingDashboard"
      :error="session.dashboardError"
      theme="dark"
    />
  </section>
</template>
