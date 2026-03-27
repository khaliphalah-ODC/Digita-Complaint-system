<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import AnalyticsDonutChart from '../../components/superAdmin/AnalyticsDonutChart.vue';
import AnalyticsLineChart from '../../components/superAdmin/AnalyticsLineChart.vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import { useUiToastStore } from '../../stores/uiToast';

const uiToast = useUiToastStore();
const loading = ref(false);
const complaints = ref([]);
const lastRefresh = ref(null);
const error = ref('');
let pollHandle = null;

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) {
    throw new Error(payload?.message || fallbackMessage);
  }
  return payload.data;
};

const fetchComplaints = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/complaint');
    complaints.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch complaints') || [];
    lastRefresh.value = new Date();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load complaints');
  } finally {
    loading.value = false;
  }
};

const summaryStats = computed(() => {
  const rows = complaints.value || [];
  return {
    total: rows.length,
    resolved: rows.filter((row) => ['resolved', 'closed'].includes(row.status)).length,
    open: rows.filter((row) => ['submitted', 'in_review'].includes(row.status)).length,
    escalated: rows.filter((row) => String(row.status).startsWith('level')).length
  };
});

const statusLabels = {
  submitted: 'Submitted',
  in_review: 'Reviewed / Assigned',
  resolved: 'Resolved',
  closed: 'Closed'
};

const statusSeries = computed(() => {
  const counts = Object.keys(statusLabels).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  (complaints.value || []).forEach((complaint) => {
    const status = String(complaint.status || 'submitted').toLowerCase();
    if (counts[status] >= 0) {
      counts[status] += 1;
    }
  });

  const tones = ['#4f8df7', '#1f4db7', '#22c55e', '#ef4444'];
  return Object.entries(counts).map(([key, value], index) => ({
    label: statusLabels[key],
    value,
    tone: tones[index % tones.length]
  }));
});

const complaintTrendSeries = computed(() => {
  const windowDays = 6;
  const today = new Date();
  const timeline = {};

  for (let index = windowDays; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    timeline[date.toISOString().slice(0, 10)] = { label, value: 0 };
  }

  (complaints.value || []).forEach((complaint) => {
    const createdAt = complaint.created_at ? new Date(complaint.created_at) : new Date();
    const key = createdAt.toISOString().slice(0, 10);
    if (timeline[key]) {
      timeline[key].value += 1;
    }
  });

  return Object.values(timeline);
});

const lastUpdatedLabel = computed(() => {
  if (!lastRefresh.value) return 'Not updated yet';
  return `Last refreshed ${lastRefresh.value.toLocaleTimeString()} ${lastRefresh.value.toLocaleDateString()}`;
});

onMounted(() => {
  fetchComplaints();
  pollHandle = setInterval(() => {
    void fetchComplaints();
  }, 30000);
});

onUnmounted(() => {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
});
</script>

<template>
  <section class="app-admin-page">
    <div class="app-workspace-stack">
    <header class="rounded-[30px] border border-slate-200 bg-white/80 p-4 shadow-[var(--app-shadow)] sm:p-5">
      <p class="app-kicker text-[var(--app-primary)]">Organization Analytics</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900">Operational Pulse</h1>
      <p class="mt-2 text-sm text-slate-600">Live insights for your organization with rolling refresh every 30 seconds.</p>
    </header>

    <section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <article class="app-footer-card rounded-[24px] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Total Complaints</p>
        <p class="mt-2 text-3xl font-black text-white">{{ summaryStats.total }}</p>
        <p class="text-xs text-white/60">Includes public and organization submissions.</p>
      </article>
      <article class="app-footer-card rounded-[24px] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Open Issues</p>
        <p class="mt-2 text-3xl font-black text-white">{{ summaryStats.open }}</p>
        <p class="text-xs text-white/60">Submitted, reviewed, or assigned complaints.</p>
      </article>
      <article class="app-footer-card rounded-[24px] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Resolved</p>
        <p class="mt-2 text-3xl font-black text-white">{{ summaryStats.resolved }}</p>
        <p class="text-xs text-white/60">Resolved or closed complaints.</p>
      </article>
    </section>

    <p v-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

    <section class="space-y-5 rounded-[30px] border border-slate-200 bg-white/80 p-4 shadow-[var(--app-shadow)] sm:p-5">
      <header class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-lg font-bold text-slate-900">Live Charts</h2>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{{ lastUpdatedLabel }}</p>
      </header>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr,0.65fr]">
        <AnalyticsLineChart
          title="Complaint Trend (Rolling 7 days)"
          subtitle="Counts per day for your organization."
          :series="complaintTrendSeries"
          line-color="#1f4db7"
          compact
        />
        <AnalyticsDonutChart
          title="Status Distribution"
          subtitle="Live proportion of complaint states."
          center-label="Complaints"
          :series="statusSeries"
          compact
        />
      </div>
    </section>
    </div>
  </section>
</template>
