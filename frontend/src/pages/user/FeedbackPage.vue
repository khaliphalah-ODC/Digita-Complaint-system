<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { complaintsApi, extractApiError, feedbackApi } from '../../services/api.js';
import EmptyState from '../../components/ui/EmptyState.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import FormField from '../../components/ui/FormField.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { useSessionStore } from '../../stores/session.js';

const router = useRouter();
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

const isAdminFamily = computed(() => ['super_admin', 'org_admin'].includes(session.currentUser?.role || ''));
const isUserWorkspace = computed(() => session.currentUser?.role === 'user');
const panelClass = computed(() => (isUserWorkspace.value ? 'user-shell-panel rounded-[30px] p-4' : 'app-shell-panel rounded-[30px] p-4'));
const statCardClass = computed(() => (isUserWorkspace.value ? 'user-shell-card rounded-[26px] p-4' : 'app-ink-card rounded-[26px] p-4'));
const softTextClass = computed(() => (isUserWorkspace.value ? 'text-sm text-[var(--app-muted-color)]' : 'text-sm text-slate-600'));
const headingClass = computed(() => (isUserWorkspace.value ? 'mt-2 text-3xl font-semibold text-[var(--app-primary-ink)]' : 'mt-2 text-3xl font-semibold text-slate-900'));
const inputClass = computed(() => (isUserWorkspace.value ? 'app-input text-[var(--app-primary-ink)]' : 'app-input'));
const fieldClass = computed(() => (isUserWorkspace.value ? 'app-input text-[var(--app-primary-ink)]' : 'app-input'));
const secondaryButtonClass = computed(() => 'app-btn-secondary');
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
    const rows = await complaintsApi.list();
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
    feedbackRows.value = await feedbackApi.list() || [];
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
      await feedbackApi.update(editingId.value, { rating: payload.rating, comment: payload.comment });
    } else {
      await feedbackApi.create(payload);
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
    await feedbackApi.remove(row.id);
    await fetchFeedback();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete feedback');
  }
};

const returnHome = () => {
  if (session.currentUser?.role === 'super_admin') {
    router.push('/admin/dashboard');
    return;
  }
  if (session.currentUser?.role === 'org_admin') {
    router.push('/org-admin/dashboard');
    return;
  }
  router.push('/');
};

onMounted(async () => {
  if (session.currentUser?.role === 'super_admin') {
    router.replace('/admin/dashboard');
    return;
  }
  if (session.currentUser?.role === 'org_admin') {
    router.replace('/org-admin/dashboard');
    return;
  }
  await Promise.all([fetchComplaints(), fetchFeedback()]);
});
</script>

<template>
  <section
    v-if="isAdminFamily"
    class="app-shell-panel w-full rounded-[30px] px-6 py-10 text-center md:px-8"
  >
    <h1 class="text-3xl font-semibold tracking-tight text-slate-800">Feedback Is User Only</h1>
    <p class="mt-2 text-sm text-slate-600">
      Feedback submission and history are only available to regular users for their own complaint experience.
    </p>
    <button
      class="mt-5 rounded-full bg-[var(--app-primary)] px-5 py-3 text-sm font-bold text-white"
      @click="returnHome"
    >
      Return to Dashboard
    </button>
  </section>

  <section v-else class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="app-kicker">Experience Notes</p>
        <h1 :class="headingClass">Feedback</h1>
        <p :class="softTextClass">Share feedback for your complaint experience.</p>
      </div>
      <button :class="secondaryButtonClass" @click="fetchFeedback">
        Refresh
      </button>
    </header>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <article :class="`${statCardClass} p-5`">
        <p class="text-xs uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Average Rating</p>
        <p class="mt-3 text-3xl font-semibold text-[var(--app-primary)]">{{ feedbackSummary.averageRating }}</p>
      </article>
      <article :class="`${statCardClass} p-5`">
        <p class="text-xs uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Total Feedback</p>
        <p class="mt-3 text-3xl font-semibold text-[var(--app-primary-ink)]">{{ feedbackSummary.total }}</p>
      </article>
      <article :class="`${statCardClass} p-5`">
        <p class="text-xs uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Last 7 Days</p>
        <p class="mt-3 text-3xl font-semibold text-[var(--app-primary)]">{{ feedbackSummary.recentCount }}</p>
      </article>
    </section>

    <section :class="panelClass">
      <h2 class="mb-4 text-xl font-semibold text-[var(--app-primary-ink)]">{{ editingId ? 'Edit Feedback' : 'Create Feedback' }}</h2>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField
          v-model="form.complaint_id"
          as="select"
          label="Complaint"
          :input-class="fieldClass"
        >
          <template #options>
            <option value="">Select complaint</option>
            <option v-for="c in complaintOptions" :key="c.id" :value="c.id">{{ c.label }}</option>
          </template>
        </FormField>

        <FormField
          v-model="form.rating"
          as="select"
          label="Rating"
          :input-class="fieldClass"
          :options="[
            { value: 5, label: '5 - Excellent' },
            { value: 4, label: '4 - Good' },
            { value: 3, label: '3 - Fair' },
            { value: 2, label: '2 - Poor' },
            { value: 1, label: '1 - Bad' }
          ]"
        />

        <FormField
          v-model="form.comment"
          as="textarea"
          label="Comment"
          placeholder="Write your feedback"
          :rows="3"
          :input-class="`${fieldClass} md:col-span-2`"
          wrapper-class="md:col-span-2"
        />

        <div class="flex gap-2 md:col-span-2">
          <button :disabled="saving" class="app-btn-primary disabled:opacity-60" @click="saveFeedback">
            {{ saving ? 'Saving...' : editingId ? 'Update Feedback' : 'Submit Feedback' }}
          </button>
          <button :class="secondaryButtonClass" @click="resetForm">
            Clear
          </button>
        </div>
      </div>
    </section>

    <section :class="panelClass">
      <h2 class="mb-4 text-xl font-semibold text-[var(--app-primary-ink)]">Feedback Records</h2>
      <LoadingSpinner v-if="loading" label="Loading feedback..." />
      <ErrorState
        v-else-if="error"
        title="Unable to load feedback"
        :description="error"
      />
      <EmptyState
        v-else-if="feedbackRows.length === 0"
        title="No feedback found"
        description="Once you submit feedback for a complaint, it will appear here."
        compact
      />

      <div v-else class="space-y-3">
        <article v-for="row in feedbackRows" :key="row.id" :class="`${statCardClass} p-5`">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="text-[0.98rem] font-semibold text-[var(--app-primary-ink)]">{{ row.complaint_title || `Complaint #${row.complaint_id}` }}</p>
              <p class="text-xs text-[var(--app-muted-color)]">{{ row.complaint_tracking_code || 'No tracking code' }}</p>
              <p class="mt-2 text-[0.98rem] text-[var(--app-primary-ink)]">{{ row.comment || 'No comment provided.' }}</p>
              <p class="mt-1 text-xs text-[var(--app-muted-color)]">
                By {{ row.user_full_name || `User #${row.user_id}` }} | {{ row.created_at }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <StatusBadge :value="`${row.rating}/5`" tone="neutral" />
              <button class="app-btn-secondary px-3 py-1 text-xs" @click="startEdit(row)">Edit</button>
              <button class="app-btn-danger min-h-[30px] px-3 py-1 text-xs" @click="deleteFeedback(row)">Delete</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
