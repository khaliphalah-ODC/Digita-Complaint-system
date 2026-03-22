<script setup>
import { computed, onMounted, ref } from 'vue';
import AnalyticsBarChart from '../../components/superAdmin/AnalyticsBarChart.vue';
import AnalyticsDonutChart from '../../components/superAdmin/AnalyticsDonutChart.vue';
import AnalyticsLineChart from '../../components/superAdmin/AnalyticsLineChart.vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';

const loading = ref(false);
const error = ref('');
const complaintStatusCounts = ref({
  submitted: 0,
  in_review: 0,
  resolved: 0,
  closed: 0
});
const complaintsByOrganization = ref([]);
const complaintMonthlyTrend = ref([]);
const assessmentMonthlyTrend = ref([]);
const escalationStatusCounts = ref({
  pending: 0,
  in_progress: 0,
  resolved: 0,
  rejected: 0
});
const feedbackSummary = ref({
  total: 0,
  average: 0,
  byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const fetchReports = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/organization/global-stats');
    const stats = ensureSuccess(unwrapResponse(response), 'Failed to load report data');
    complaintStatusCounts.value = {
      submitted: Number(stats.submittedComplaints || 0),
      in_review: Number(stats.inReviewComplaints || 0),
      resolved: Number(stats.resolvedComplaints || 0),
      closed: Number(stats.closedComplaints || 0)
    };
    complaintsByOrganization.value = (stats.complaintsByOrganization || []).map((row) => ({
      label: row.name || 'Unnamed',
      value: Number(row.complaints || 0)
    }));
    complaintMonthlyTrend.value = (stats.complaintMonthlyTrend || []).map((row) => ({
      label: row.month || '',
      value: Number(row.value || 0)
    }));
    assessmentMonthlyTrend.value = (stats.assessmentMonthlyTrend || []).map((row) => ({
      label: row.month || '',
      value: Number(row.value || 0)
    }));
    escalationStatusCounts.value = stats.escalationStatusCounts || escalationStatusCounts.value;
    feedbackSummary.value = stats.feedbackSummary || feedbackSummary.value;
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load report data');
  } finally {
    loading.value = false;
  }
};

const escalationBars = computed(() => {
  const counts = escalationStatusCounts.value || {};
  return [
    { label: 'Pending', value: Number(counts.pending || 0), tone: '#d97706' },
    { label: 'In Progress', value: Number(counts.in_progress || 0), tone: '#2563eb' },
    { label: 'Resolved', value: Number(counts.resolved || 0), tone: '#0f766e' },
    { label: 'Rejected', value: Number(counts.rejected || 0), tone: '#64748b' }
  ];
});

const feedbackBars = computed(() => {
  const byRating = feedbackSummary.value?.byRating || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  return Object.entries(byRating).map(([rating, count], index) => ({
    label: `${rating} Star`,
    value: Number(count || 0),
    tone: ['#1d4ed8', '#2563eb', '#0f766e', '#d97706', '#7c3aed'][index % 5]
  }));
});

const complaintStatusSeries = computed(() => {
  const counts = complaintStatusCounts.value || {};
  return [
    { label: 'Submitted', value: Number(counts.submitted || 0), tone: '#1d4ed8' },
    { label: 'In Review', value: Number(counts.in_review || 0), tone: '#0f766e' },
    { label: 'Resolved', value: Number(counts.resolved || 0), tone: '#d97706' },
    { label: 'Closed', value: Number(counts.closed || 0), tone: '#0f172a' }
  ];
});

const totalComplaints = computed(() => complaintStatusSeries.value.reduce((sum, item) => sum + item.value, 0));
const openComplaints = computed(() => Number(complaintStatusCounts.value.submitted || 0) + Number(complaintStatusCounts.value.in_review || 0));
const openEscalations = computed(() => Number(escalationStatusCounts.value.pending || 0) + Number(escalationStatusCounts.value.in_progress || 0));
const complaintResolutionRate = computed(() => {
  return totalComplaints.value > 0
    ? Math.round(((Number(complaintStatusCounts.value.resolved || 0) + Number(complaintStatusCounts.value.closed || 0)) / totalComplaints.value) * 100)
    : 0;
});

const analyticsSummary = computed(() => ({
  totalComplaints: totalComplaints.value,
  openComplaints: openComplaints.value,
  totalEscalations: escalationBars.value.reduce((sum, item) => sum + item.value, 0),
  averageFeedback: Number(feedbackSummary.value.average || 0).toFixed(2)
}));

const topComplaintOrganization = computed(() => complaintsByOrganization.value[0] || null);

const attentionItems = computed(() => {
  const items = [];

  if (openEscalations.value > 0) {
    items.push({
      title: 'Escalations are still open',
      detail: `${openEscalations.value} escalations remain pending or in progress and should be reviewed before the queue grows further.`,
      tone: 'border-amber-200 bg-amber-50 text-amber-900'
    });
  }

  if (openComplaints.value > 0 && complaintResolutionRate.value < 60) {
    items.push({
      title: 'Complaint resolution rate is still low',
      detail: `${complaintResolutionRate.value}% of complaints are resolved or closed based on the current reporting feed.`,
      tone: 'border-red-200 bg-red-50 text-red-900'
    });
  }

  if (topComplaintOrganization.value?.value >= Math.max(5, Math.ceil(totalComplaints.value * 0.2))) {
    items.push({
      title: 'Complaint volume is concentrated',
      detail: `${topComplaintOrganization.value.label} currently carries the highest complaint load with ${topComplaintOrganization.value.value} complaints.`,
      tone: 'border-blue-200 bg-blue-50 text-blue-900'
    });
  }

  if (Number(feedbackSummary.value.average || 0) > 0 && Number(feedbackSummary.value.average || 0) < 3.5) {
    items.push({
      title: 'Feedback trend needs follow-up',
      detail: `Average feedback is ${Number(feedbackSummary.value.average || 0).toFixed(2)}/5, which may indicate delays or poor resolution quality.`,
      tone: 'border-red-200 bg-red-50 text-red-900'
    });
  }

  if (!items.length) {
    items.push({
      title: 'No immediate report-level alerts',
      detail: 'Current complaint, escalation, and feedback data does not show a major platform-level warning.',
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-900'
    });
  }

  return items;
});

const escalationSummaryCards = computed(() => [
  {
    label: 'Open escalations',
    value: openEscalations.value,
    detail: 'Pending and in-progress escalation work'
  },
  {
    label: 'Pending',
    value: Number(escalationStatusCounts.value.pending || 0),
    detail: 'Cases still waiting to be handled'
  },
  {
    label: 'Resolved',
    value: Number(escalationStatusCounts.value.resolved || 0),
    detail: 'Escalations completed in the current feed'
  },
  {
    label: 'Rejected',
    value: Number(escalationStatusCounts.value.rejected || 0),
    detail: 'Escalations closed without approval'
  }
]);

const escalationAttentionItems = computed(() => {
  const items = [];

  if (Number(escalationStatusCounts.value.pending || 0) > 0) {
    items.push(`${Number(escalationStatusCounts.value.pending || 0)} escalations are waiting to be picked up.`);
  }

  if (Number(escalationStatusCounts.value.in_progress || 0) > Number(escalationStatusCounts.value.resolved || 0)) {
    items.push('In-progress escalations currently outnumber resolved escalations.');
  }

  if (!openEscalations.value) {
    items.push('No open escalations are currently reported.');
  }

  return items;
});

onMounted(fetchReports);
</script>

<template>
  <section class="space-y-6 bg-slate-50 p-4 sm:p-6">
    <PageHeader
      title="Reports"
      description="Platform-level reporting for complaint flow, escalations, feedback, and monthly movement."
    >
      <template #actions>
        <button class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="fetchReports">
          Refresh
        </button>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Total complaints</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ analyticsSummary.totalComplaints }}</p>
        <p class="mt-2 text-sm text-slate-600">All complaints represented in the reporting feed.</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Open complaints</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ analyticsSummary.openComplaints }}</p>
        <p class="mt-2 text-sm text-slate-600">Submitted and in-review complaints still moving through the flow.</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Escalations</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ analyticsSummary.totalEscalations }}</p>
        <p class="mt-2 text-sm text-slate-600">Current escalation workload represented in reports.</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Average feedback</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ analyticsSummary.averageFeedback }}</p>
        <p class="mt-2 text-sm text-slate-600">Average rating from recorded feedback submissions.</p>
      </article>
    </section>

    <p v-if="loading" class="text-sm text-slate-500">Loading reports...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <section class="space-y-6">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-slate-900">Attention Needed</h2>
          <p class="mt-1 text-sm text-slate-600">The most important reporting signals to review before moving into charts.</p>
        </div>
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <article v-for="item in attentionItems" :key="item.title" class="rounded-xl border px-4 py-4" :class="item.tone">
            <h3 class="text-sm font-semibold">{{ item.title }}</h3>
            <p class="mt-1 text-sm opacity-90">{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section>
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-slate-900">Complaint Oversight</h2>
          <p class="mt-1 text-sm text-slate-600">Summary first, then supporting charts for complaint flow and concentration.</p>
        </div>

        <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">In review</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ complaintStatusCounts.in_review }}</p>
            <p class="mt-2 text-sm text-slate-600">Complaints currently active in review.</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">Resolution rate</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ complaintResolutionRate }}%</p>
            <p class="mt-2 text-sm text-slate-600">Resolved and closed complaints as a share of total complaints.</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">Highest complaint load</p>
            <p class="mt-2 text-xl font-semibold text-slate-900">{{ topComplaintOrganization?.label || 'No organization data' }}</p>
            <p class="mt-2 text-sm text-slate-600">
              {{ topComplaintOrganization ? `${topComplaintOrganization.value} complaints in the current feed.` : 'Complaint volume by organization is not available yet.' }}
            </p>
          </article>
        </div>

        <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AnalyticsBarChart
            title="Complaints by Organization"
            subtitle="Use this to confirm whether complaint volume is clustering in a few organizations."
            :series="complaintsByOrganization"
            empty-message="Organization complaint volume is too low or unavailable, so this chart is hidden until stronger data is reported."
          />
          <AnalyticsDonutChart
            title="Complaint Status Distribution"
            subtitle="Use this to confirm whether complaint flow is balanced or stuck in open states."
            :series="complaintStatusSeries"
            center-label="Complaints"
            empty-message="Complaint status data is not strong enough to visualize yet."
          />
        </div>
      </section>

      <section>
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-slate-900">Escalation Oversight</h2>
          <p class="mt-1 text-sm text-slate-600">This section answers whether escalations need attention before showing distribution detail.</p>
        </div>

        <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="item in escalationSummaryCards" :key="item.label" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">{{ item.label }}</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ item.value }}</p>
            <p class="mt-2 text-sm text-slate-600">{{ item.detail }}</p>
          </article>
        </div>

        <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-base font-semibold text-slate-900">Attention Needed</h3>
          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <article
              v-for="item in escalationAttentionItems"
              :key="item"
              class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              {{ item }}
            </article>
          </div>
        </section>

        <AnalyticsBarChart
          title="Escalation Status Distribution"
          subtitle="Shown only as supporting context after the key escalation message is already clear."
          :series="escalationBars"
          empty-message="There are no reported escalations to visualize right now, so the chart has been replaced with this operational empty state."
        />
      </section>

      <section>
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-slate-900">Feedback Overview</h2>
          <p class="mt-1 text-sm text-slate-600">Feedback supports supervision, but it should not outweigh the complaint and escalation message.</p>
        </div>
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr,1.2fr]">
          <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <article class="rounded-xl border border-slate-200 p-4">
                <p class="text-sm font-medium text-slate-500">Feedback submissions</p>
                <p class="mt-2 text-2xl font-semibold text-slate-900">{{ feedbackSummary.total }}</p>
              </article>
              <article class="rounded-xl border border-slate-200 p-4">
                <p class="text-sm font-medium text-slate-500">Average rating</p>
                <p class="mt-2 text-2xl font-semibold text-slate-900">{{ analyticsSummary.averageFeedback }}</p>
              </article>
            </div>
          </section>
          <AnalyticsDonutChart
            title="Feedback Rating Distribution"
            :subtitle="`Total feedback: ${feedbackSummary.total} | Average rating: ${Number(feedbackSummary.average || 0).toFixed(2)}`"
            :series="feedbackBars"
            center-label="Ratings"
            empty-message="Feedback volume is too low to support a useful rating chart right now."
          />
        </div>
      </section>

      <section>
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-slate-900">Monthly Trends</h2>
          <p class="mt-1 text-sm text-slate-600">Trend charts come last so they support decisions instead of replacing them.</p>
        </div>
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AnalyticsLineChart
            title="Monthly Complaint Trend"
            subtitle="Complaint volume over the last 12 months."
            :series="complaintMonthlyTrend"
            line-color="#2563eb"
            empty-message="Complaint trend data is too low to show a useful monthly chart right now."
          />
          <AnalyticsLineChart
            title="Monthly Completed Assessment Trend"
            subtitle="Completed assessments over the last 12 months."
            :series="assessmentMonthlyTrend"
            line-color="#16a34a"
            empty-message="Assessment trend data is too low to show a useful monthly chart right now."
          />
        </div>
      </section>
    </section>
  </section>
</template>
