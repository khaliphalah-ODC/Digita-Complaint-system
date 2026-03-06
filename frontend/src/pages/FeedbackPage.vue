<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../services/api.js';
import { useSessionStore } from '../stores/session.js';

const session = useSessionStore();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const feedbackRows = ref([]);
const complaintOptions = ref([]);
const editingId = ref(null);

const form = reactive({
  complaint_id: '',
  rating: 5,
  comment: ''
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const isAdmin = computed(() => session.currentUser?.role === 'admin');
const feedbackSummary = computed(() => {
  const rows = feedbackRows.value || [];
  const total = rows.length;
  const averageRating = total
    ? (rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / total).toFixed(1)
    : '0.0';

  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const recentCount = rows.filter((row) => {
    const timestamp = new Date(row.created_at).getTime();
    return !Number.isNaN(timestamp) && timestamp >= sevenDaysAgo;
  }).length;

  return {
    total,
    averageRating,
    recentCount
  };
});

const fetchComplaints = async () => {
  try {
    const response = await api.get('/complaint');
    const rows = ensureSuccess(unwrapResponse(response), 'Failed to fetch complaints');
    complaintOptions.value = (rows || []).map((row) => ({
      id: row.id,
      label: `${row.tracking_code || `#${row.id}`} - ${row.title || 'Untitled Complaint'}`
    }));
  } catch (_error) {
    complaintOptions.value = [];
  }
};

const fetchFeedback = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/feedback');
    feedbackRows.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch feedback') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch feedback');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  editingId.value = null;
  form.complaint_id = '';
  form.rating = 5;
  form.comment = '';
};

const saveFeedback = async () => {
  error.value = '';
  if (!form.complaint_id || !form.rating) {
    error.value = 'complaint_id and rating are required';
    return;
  }

  saving.value = true;
  try {
    const payload = {
      complaint_id: Number(form.complaint_id),
      rating: Number(form.rating),
      comment: form.comment.trim() || null
    };

    if (editingId.value) {
      await api.put(`/feedback/${editingId.value}`, { rating: payload.rating, comment: payload.comment });
    } else {
      await api.post('/feedback', payload);
    }

    resetForm();
    await fetchFeedback();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save feedback');
  } finally {
    saving.value = false;
  }
};

const startEdit = (row) => {
  editingId.value = row.id;
  form.complaint_id = String(row.complaint_id || '');
  form.rating = Number(row.rating || 5);
  form.comment = row.comment || '';
};

const deleteFeedback = async (row) => {
  const ok = window.confirm('Delete this feedback?');
  if (!ok) return;

  error.value = '';
  try {
    await api.delete(`/feedback/${row.id}`);
    await fetchFeedback();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete feedback');
  }
};

onMounted(async () => {
  await Promise.all([fetchComplaints(), fetchFeedback()]);
});
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Feedback</h1>
        <p class="text-sm text-slate-600">{{ isAdmin ? 'Review all platform feedback and moderate entries.' : 'Share feedback for your complaint experience.' }}</p>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="fetchFeedback">
        Refresh
      </button>
    </header>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <article class="rounded-2xl border border-slate-200 bg-white p-4">
        <p class="text-xs uppercase tracking-wide text-slate-500">Average Rating</p>
        <p class="mt-2 text-3xl font-black text-amber-600">{{ feedbackSummary.averageRating }}</p>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-4">
        <p class="text-xs uppercase tracking-wide text-slate-500">Total Feedback</p>
        <p class="mt-2 text-3xl font-black text-slate-900">{{ feedbackSummary.total }}</p>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-4">
        <p class="text-xs uppercase tracking-wide text-slate-500">Last 7 Days</p>
        <p class="mt-2 text-3xl font-black text-blue-700">{{ feedbackSummary.recentCount }}</p>
      </article>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold text-slate-900">{{ editingId ? 'Edit Feedback' : 'Create Feedback' }}</h2>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <select v-model="form.complaint_id" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Select complaint</option>
          <option v-for="c in complaintOptions" :key="c.id" :value="c.id">{{ c.label }}</option>
        </select>

        <select v-model="form.rating" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option :value="5">5 - Excellent</option>
          <option :value="4">4 - Good</option>
          <option :value="3">3 - Fair</option>
          <option :value="2">2 - Poor</option>
          <option :value="1">1 - Bad</option>
        </select>

        <textarea
          v-model="form.comment"
          rows="3"
          placeholder="Write your feedback"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
        />

        <div class="flex gap-2 md:col-span-2">
          <button :disabled="saving" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" @click="saveFeedback">
            {{ saving ? 'Saving...' : editingId ? 'Update Feedback' : 'Submit Feedback' }}
          </button>
          <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" @click="resetForm">
            Clear
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold text-slate-900">Feedback Records</h2>
      <p v-if="loading" class="text-sm text-slate-500">Loading feedback...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="feedbackRows.length === 0" class="text-sm text-slate-500">No feedback found.</p>

      <div v-else class="space-y-3">
        <article v-for="row in feedbackRows" :key="row.id" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ row.complaint_title || `Complaint #${row.complaint_id}` }}</p>
              <p class="text-xs text-slate-500">{{ row.complaint_tracking_code || 'No tracking code' }}</p>
              <p class="mt-2 text-sm text-slate-700">{{ row.comment || 'No comment provided.' }}</p>
              <p class="mt-1 text-xs text-slate-500">
                By {{ row.user_full_name || `User #${row.user_id}` }} | {{ row.created_at }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Rating: {{ row.rating }}/5</span>
              <button class="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700" @click="startEdit(row)">Edit</button>
              <button class="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" @click="deleteFeedback(row)">Delete</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
