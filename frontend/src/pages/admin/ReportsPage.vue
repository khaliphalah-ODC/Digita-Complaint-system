<script setup>
import { computed, onMounted, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';

const loading = ref(false);
const error = ref('');

const escalations = ref([]);
const feedback = ref([]);

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const fetchReports = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [escalationRes, feedbackRes] = await Promise.all([
      api.get('/escalations'),
      api.get('/feedback')
    ]);
    escalations.value = ensureSuccess(unwrapResponse(escalationRes), 'Failed to fetch escalations') || [];
    feedback.value = ensureSuccess(unwrapResponse(feedbackRes), 'Failed to fetch feedback') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load report data');
  } finally {
    loading.value = false;
  }
};

const escalationStatusCounts = computed(() => {
  const counts = {
    pending: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0
  };
  for (const row of escalations.value) {
    if (counts[row.status] !== undefined) counts[row.status] += 1;
  }
  return counts;
});

const escalationBars = computed(() => {
  const counts = escalationStatusCounts.value;
  const max = Math.max(...Object.values(counts), 1);
  return Object.entries(counts).map(([label, value]) => ({
    label,
    value,
    width: `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`
  }));
});

const feedbackSummary = computed(() => {
  const ratings = feedback.value
    .map((row) => Number(row.rating))
    .filter((n) => Number.isFinite(n));
  const total = ratings.length;
  const avg = total === 0 ? 0 : ratings.reduce((sum, n) => sum + n, 0) / total;
  const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => {
    const rounded = Math.max(1, Math.min(5, Math.round(r)));
    byRating[rounded] += 1;
  });
  const max = Math.max(...Object.values(byRating), 1);
  const bars = Object.entries(byRating).map(([rating, count]) => ({
    label: `${rating}★`,
    value: count,
    width: `${Math.max((count / max) * 100, count > 0 ? 8 : 0)}%`
  }));
  return { total, average: avg.toFixed(2), bars };
});

onMounted(fetchReports);
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Reports</h1>
        <p class="text-sm text-slate-600">Operational view of escalations and feedback quality metrics.</p>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="fetchReports">
        Refresh
      </button>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Loading reports...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <article class="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 class="text-lg font-bold text-slate-900">Escalation Status Distribution</h2>
        <p class="text-sm text-slate-600">Total escalations: {{ escalations.length }}</p>
        <div class="mt-4 space-y-3">
          <div v-for="bar in escalationBars" :key="bar.label">
            <div class="mb-1 flex items-center justify-between text-xs text-slate-600">
              <span>{{ bar.label }}</span>
              <span>{{ bar.value }}</span>
            </div>
            <div class="h-2 rounded bg-slate-100">
              <div class="h-2 rounded bg-blue-600" :style="{ width: bar.width }" />
            </div>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 class="text-lg font-bold text-slate-900">Feedback Rating Distribution</h2>
        <p class="text-sm text-slate-600">
          Total feedback: {{ feedbackSummary.total }} | Average rating: {{ feedbackSummary.average }}
        </p>
        <div class="mt-4 space-y-3">
          <div v-for="bar in feedbackSummary.bars" :key="bar.label">
            <div class="mb-1 flex items-center justify-between text-xs text-slate-600">
              <span>{{ bar.label }}</span>
              <span>{{ bar.value }}</span>
            </div>
            <div class="h-2 rounded bg-slate-100">
              <div class="h-2 rounded bg-emerald-600" :style="{ width: bar.width }" />
            </div>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>
