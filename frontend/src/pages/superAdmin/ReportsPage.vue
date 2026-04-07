<script setup>
import { computed, onMounted, ref } from 'vue';
import AnalyticsBarChart from '../../components/superAdmin/AnalyticsBarChart.vue';
import AnalyticsDonutChart from '../../components/superAdmin/AnalyticsDonutChart.vue';
import AnalyticsLineChart from '../../components/superAdmin/AnalyticsLineChart.vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import { extractApiError, organizationsApi, publicFeedbackApi } from '../../services/api';
import { createPublicFeedbackAnalyticsSummary, createReportsAnalytics } from '../../services/analytics.service.js';

const loading = ref(false);
const error = ref('');
const reportAnalytics = ref(createReportsAnalytics());
const publicFeedbackAnalytics = ref(createPublicFeedbackAnalyticsSummary());

const fetchReports = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [stats, publicFeedbackStats] = await Promise.all([
      organizationsApi.getGlobalStats(),
      publicFeedbackApi.getSystemAnalytics()
    ]);
    reportAnalytics.value = createReportsAnalytics(stats);
    publicFeedbackAnalytics.value = createPublicFeedbackAnalyticsSummary(publicFeedbackStats);
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load report data');
  } finally {
    loading.value = false;
  }
};

const escalationBars = computed(() => reportAnalytics.value.escalationBars);
const feedbackBars = computed(() => reportAnalytics.value.feedbackBars);
const complaintStatusSeries = computed(() => reportAnalytics.value.complaintStatusSeries);
const analyticsSummary = computed(() => reportAnalytics.value.analyticsSummary);
const topComplaintOrganization = computed(() => reportAnalytics.value.topComplaintOrganization);
const attentionItems = computed(() => reportAnalytics.value.attentionItems);
const escalationSummaryCards = computed(() => reportAnalytics.value.escalationSummaryCards);
const escalationAttentionItems = computed(() => reportAnalytics.value.escalationAttentionItems);
const complaintMonthlyTrend = computed(() => reportAnalytics.value.normalizedStats.complaintMonthlyTrend || []);
const assessmentMonthlyTrend = computed(() => reportAnalytics.value.normalizedStats.assessmentMonthlyTrend || []);
const complaintsByOrganization = computed(() => reportAnalytics.value.normalizedStats.complaintsByOrganization || []);
const complaintResolutionRate = computed(() => {
  const total = Number(analyticsSummary.value.totalComplaints || 0);
  if (!total) return 0;
  const resolved = complaintStatusSeries.value
    .filter((item) => ['Resolved', 'Closed'].includes(item.label))
    .reduce((sum, item) => sum + Number(item.value || 0), 0);
  return Math.round((resolved / total) * 100);
});
const feedbackSummary = computed(() => reportAnalytics.value.normalizedStats.feedbackSummary || { total: 0, average: 0, byRating: {} });
const publicFeedbackSummaryCards = computed(() => publicFeedbackAnalytics.value.summaryCards || []);
const publicFeedbackOrganizationSeries = computed(() => publicFeedbackAnalytics.value.organizationSeries || []);
const publicFeedbackMonthlyTrend = computed(() => publicFeedbackAnalytics.value.monthlyTrend || []);

onMounted(fetchReports);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
    <PageHeader
      title="Reports"
      description="Platform-level reporting for complaint flow, escalations, feedback, and monthly movement."
    >
      <template #actions>
        <button class="app-btn-secondary" @click="fetchReports">
          Refresh
        </button>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="app-section-card app-metric-card">
        <p class="text-sm font-medium text-slate-500">Total complaints</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ analyticsSummary.totalComplaints }}</p>
        <p class="mt-2 text-sm text-slate-600">All complaints represented in the reporting feed.</p>
      </article>
      <article class="app-section-card app-metric-card">
        <p class="text-sm font-medium text-slate-500">Open complaints</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ analyticsSummary.openComplaints }}</p>
        <p class="mt-2 text-sm text-slate-600">Submitted and in-review complaints still moving through the flow.</p>
      </article>
      <article class="app-section-card app-metric-card">
        <p class="text-sm font-medium text-slate-500">Escalations</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ analyticsSummary.totalEscalations }}</p>
        <p class="mt-2 text-sm text-slate-600">Current escalation workload represented in reports.</p>
      </article>
      <article class="app-section-card app-metric-card">
        <p class="text-sm font-medium text-slate-500">Average feedback</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ analyticsSummary.averageFeedback }}</p>
        <p class="mt-2 text-sm text-slate-600">Average rating from recorded feedback submissions.</p>
      </article>
    </section>

    <LoadingSpinner v-if="loading" label="Loading reports..." />
    <ErrorState v-else-if="error" title="Could not load reports" :description="error" />
    <EmptyState
      v-else-if="analyticsSummary.totalComplaints === 0 && analyticsSummary.totalEscalations === 0"
      title="No report data is available yet."
      description="Platform reporting cards and charts will populate once analytics data is available."
    />

    <section v-else class="space-y-6">
      <section class="app-section-card">
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
            <p class="text-sm font-medium text-slate-500">Open complaints</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ analyticsSummary.openComplaints }}</p>
            <p class="mt-2 text-sm text-slate-600">Submitted and in-review complaints currently active in the workflow.</p>
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

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AnalyticsBarChart
            title="Complaints by Organization"
            subtitle="Use this to confirm whether complaint volume is clustering in a few organizations."
            :series="complaintsByOrganization"
            compact
            empty-message="Organization complaint volume is too low or unavailable, so this chart is hidden until stronger data is reported."
          />
          <AnalyticsDonutChart
            title="Complaint Status Distribution"
            subtitle="Use this to confirm whether complaint flow is balanced or stuck in open states."
            :series="complaintStatusSeries"
            center-label="Complaints"
            compact
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

        <section class="mb-6 app-section-card">
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
          compact
          empty-message="There are no reported escalations to visualize right now, so the chart has been replaced with this operational empty state."
        />
      </section>

      <section>
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-slate-900">Feedback Overview</h2>
          <p class="mt-1 text-sm text-slate-600">Feedback supports supervision, but it should not outweigh the complaint and escalation message.</p>
        </div>
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr,1.2fr]">
          <section class="app-section-card">
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
            compact
            empty-message="Feedback volume is too low to support a useful rating chart right now."
          />
        </div>
      </section>

      <section>
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-slate-900">Public Feedback Channels</h2>
          <p class="mt-1 text-sm text-slate-600">System-wide visibility into organization QR-accessible public feedback channels.</p>
        </div>
        <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article v-for="item in publicFeedbackSummaryCards" :key="item.label" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">{{ item.label }}</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ item.value }}</p>
            <p class="mt-2 text-sm text-slate-600">{{ item.detail }}</p>
          </article>
        </div>
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AnalyticsBarChart
            title="Public Feedback by Organization"
            subtitle="Organizations with the highest public feedback activity."
            :series="publicFeedbackOrganizationSeries"
            compact
            empty-message="No public feedback submissions are available yet."
          />
          <AnalyticsLineChart
            title="Public Feedback Monthly Trend"
            subtitle="Recent monthly submission volume across public organization feedback channels."
            :series="publicFeedbackMonthlyTrend"
            line-color="#183a63"
            compact
            empty-message="Public feedback trend data is not available yet."
          />
        </div>
      </section>

      <section>
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-slate-900">Monthly Trends</h2>
          <p class="mt-1 text-sm text-slate-600">Trend charts come last so they support decisions instead of replacing them.</p>
        </div>
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AnalyticsLineChart
            title="Monthly Complaint Trend"
            subtitle="Complaint volume over the last 12 months."
            :series="complaintMonthlyTrend"
            line-color="#2563eb"
            compact
            empty-message="Complaint trend data is too low to show a useful monthly chart right now."
          />
          <AnalyticsLineChart
            title="Monthly Completed Assessment Trend"
            subtitle="Completed assessments over the last 12 months."
            :series="assessmentMonthlyTrend"
            line-color="#16a34a"
            compact
            empty-message="Assessment trend data is too low to show a useful monthly chart right now."
          />
        </div>
      </section>
    </section>
      </div>
    </div>
  </section>
</template>
