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
    { label: 'Rejected', value: Number(counts.rejected || 0), tone: '#7c3aed' }
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

const analyticsSummary = computed(() => ({
  totalComplaints: complaintStatusSeries.value.reduce((sum, item) => sum + item.value, 0),
  totalEscalations: escalationBars.value.reduce((sum, item) => sum + item.value, 0),
  averageFeedback: Number(feedbackSummary.value.average || 0).toFixed(2),
  topOrganization: complaintsByOrganization.value[0]?.label || 'No organization data'
}));

onMounted(fetchReports);
</script>

<template>
  <section class="app-dark-stage space-y-5 rounded-[34px] p-4 sm:p-6">
    <PageHeader
      theme="dark"
      kicker="Platform Analytics"
      title="Analytics"
      description="Monitor aggregate complaint, escalation, and assessment movement across the platform without exposing tenant-internal records."
    >
      <template #actions>
        <button class="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/84" @click="fetchReports">
          Refresh Analytics
        </button>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Total Complaints</p>
        <p class="mt-2 text-3xl font-black text-white">{{ analyticsSummary.totalComplaints }}</p>
        <p class="text-sm text-white/58">Current complaint volume represented in the aggregate charts.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Escalations</p>
        <p class="mt-2 text-3xl font-black text-blue-200">{{ analyticsSummary.totalEscalations }}</p>
        <p class="text-sm text-white/58">Current size of the aggregate escalation queue.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Average Feedback</p>
        <p class="mt-2 text-3xl font-black text-emerald-300">{{ analyticsSummary.averageFeedback }}</p>
        <p class="text-sm text-white/58">Average rating captured from platform feedback submissions.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Top Organization</p>
        <p class="mt-2 text-xl font-black text-blue-200">{{ analyticsSummary.topOrganization }}</p>
        <p class="text-sm text-white/58">Currently leading complaint load in the organization chart.</p>
      </article>
    </section>

    <p v-if="loading" class="text-sm text-white/58">Loading reports...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <AnalyticsBarChart
        title="Complaints By Organization"
        subtitle="Top organizations by current complaint load."
        :series="complaintsByOrganization"
        theme="dark"
      />
      <AnalyticsDonutChart
        title="Complaint Status Distribution"
        subtitle="Platform-wide complaint state balance."
        :series="complaintStatusSeries"
        center-label="Open Flow"
        theme="dark"
      />
      <AnalyticsBarChart
        title="Escalation Status Distribution"
        subtitle="Current escalation queue breakdown."
        :series="escalationBars"
        theme="dark"
      />
      <AnalyticsDonutChart
        title="Feedback Rating Distribution"
        :subtitle="`Total feedback: ${feedbackSummary.total} | Average rating: ${Number(feedbackSummary.average || 0).toFixed(2)}`"
        :series="feedbackBars"
        center-label="Ratings"
        theme="dark"
      />
      <AnalyticsLineChart
        title="Monthly Complaint Trend"
        subtitle="Platform complaint volume over the last 12 months."
        :series="complaintMonthlyTrend"
        line-color="#4f8df7"
        theme="dark"
      />
      <AnalyticsLineChart
        title="Monthly Completed Assessment Trend"
        subtitle="Completed assessments over the last 12 months."
        :series="assessmentMonthlyTrend"
        line-color="#22c55e"
        theme="dark"
      />
    </section>
  </section>
</template>
