<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../services/api.js';
import LiveSupportModal from '../components/LiveSupportModal.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const complaint = ref(null);
const trackingInput = ref('');
const showChatModal = ref(false);
let refreshTimer = null;
const isUserWorkspace = computed(() => Boolean(localStorage.getItem('token')));
const shellClass = computed(() => (isUserWorkspace.value ? 'user-shell-panel w-full rounded-[30px] p-4 sm:p-5 md:p-7' : 'app-shell-panel w-full rounded-[30px] p-4 sm:p-5 md:p-7'));
const cardClass = computed(() => (isUserWorkspace.value ? 'user-shell-card rounded-[24px] px-4 py-3' : 'app-ink-card rounded-[24px] px-4 py-3'));

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const workflowSteps = computed(() => {
  const row = complaint.value;
  const rawStatus = String(row?.status || 'submitted').toLowerCase();
  const reviewed = ['in_review', 'resolved', 'closed'].includes(rawStatus) || Boolean(row?.reviewed_at || row?.admin_response);
  const assigned = ['resolved', 'closed'].includes(rawStatus) || Boolean(row?.reviewer_name || row?.department_name);
  const resolved = ['resolved', 'closed'].includes(rawStatus);
  const closed = rawStatus === 'closed';

  return [
    { key: 'submitted', label: 'Submitted', done: Boolean(row) },
    { key: 'reviewed', label: 'Reviewed', done: reviewed },
    { key: 'assigned', label: 'Assigned', done: assigned },
    { key: 'resolved', label: 'Resolved', done: resolved },
    { key: 'closed', label: 'Closed', done: closed }
  ];
});

const prettyStatus = (status) => {
  if (!status) return 'Submitted';
  if (status === 'in_review') {
    return complaint.value?.department_name || complaint.value?.reviewer_name || complaint.value?.reviewed_at
      ? 'Assigned'
      : 'Reviewed';
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const statusBadgeClass = computed(() => {
  const status = complaint.value?.status;
  if (status === 'resolved') return 'bg-[var(--app-accent-soft)] text-[var(--app-primary-ink)]';
  if (status === 'closed') return 'bg-slate-100 text-slate-700';
  if (status === 'in_review') return 'bg-[var(--app-pending-soft)] text-[var(--app-pending)]';
  return 'bg-[var(--app-primary-mist)] text-[var(--app-primary-ink)]';
});

const reporterName = computed(() => {
  if (!complaint.value) return 'N/A';
  return complaint.value.is_anonymous ? (complaint.value.anonymous_label || 'Anonymous') : (complaint.value.user_full_name || 'N/A');
});

const resolvedDate = computed(() => complaint.value?.reviewed_at || complaint.value?.updated_at || complaint.value?.created_at || 'N/A');

const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
};

const loadComplaint = async (trackingCode) => {
  if (!trackingCode) {
    error.value = 'Tracking code is required.';
    complaint.value = null;
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    const response = await api.get(`/complaint/track/${encodeURIComponent(trackingCode)}`);
    complaint.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch complaint');
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch complaint');
    complaint.value = null;
  } finally {
    loading.value = false;
  }
};

const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    const code = String(route.query.code || '').trim().toUpperCase();
    if (!code) return;
    loadComplaint(code);
  }, 20000);
};

const searchByCode = async () => {
  const code = trackingInput.value.trim().toUpperCase();
  if (!code) return;
  await router.replace({ path: '/track-complaint', query: { code } });
  await loadComplaint(code);
};

const downloadReceiptPdf = () => {
  if (!complaint.value) return;

  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Complaint Receipt</title></head>
  <body style="font-family: 'Times New Roman', Times, serif; padding: 24px;">
    <h2>Complaint Tracking Receipt</h2>
    <p><strong>Tracking:</strong> ${complaint.value.tracking_code || 'N/A'}</p>
    <p><strong>Status:</strong> ${prettyStatus(complaint.value.status)}</p>
    <p><strong>Title:</strong> ${complaint.value.title || ''}</p>
    <p><strong>Category:</strong> ${complaint.value.category || 'N/A'}</p>
    <p><strong>Priority:</strong> ${complaint.value.priority || 'N/A'}</p>
    <p><strong>Organization:</strong> ${complaint.value.organization_name || 'N/A'}</p>
    <p><strong>Handled by:</strong> ${complaint.value.reviewer_name || 'Pending assignment'}</p>
    <p><strong>Resolution:</strong> ${complaint.value.admin_response || 'No resolution response yet.'}</p>
    <script>window.print()<\/script>
  </body></html>`;

  const popup = window.open('', '_blank', 'width=840,height=700');
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
};

onMounted(async () => {
  const code = String(route.query.code || '').trim().toUpperCase();
  trackingInput.value = code;
  if (code) {
    await loadComplaint(code);
  }
  startAutoRefresh();
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});
</script>

<template>
  <section :class="shellClass">
    <header class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <h1 class="break-all text-3xl font-semibold text-slate-800 sm:text-4xl">{{ complaint?.tracking_code || 'TRK-000-000' }}</h1>
        <span class="app-badge px-3 py-1 text-sm" :class="statusBadgeClass">
          {{ prettyStatus(complaint?.status) }}
        </span>
      </div>

      <div class="flex w-full flex-col gap-2 md:w-[340px] md:flex-row">
        <input
          v-model="trackingInput"
          placeholder="Enter tracking code"
          class="app-input uppercase"
        >
        <button class="app-btn-primary rounded-xl px-4 py-2" @click="searchByCode">
          Track
        </button>
      </div>
    </header>

    <p v-if="loading" class="rounded-2xl border border-[var(--app-line)] bg-[var(--app-primary-mist)] px-4 py-3 text-sm text-slate-600">Loading complaint...</p>
    <p v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</p>

    <template v-else-if="complaint">
      <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <article :class="cardClass">
          <p class="text-xs uppercase tracking-[0.12em] text-slate-500">Organization</p>
          <p class="mt-2 text-[0.98rem] font-semibold text-slate-700">{{ complaint.organization_name || 'N/A' }}</p>
          <p class="mt-1 text-xs text-slate-500">Department: {{ complaint.department_name || 'Not specified' }}</p>
          <p class="text-xs text-slate-500">{{ complaint.organization_address || '' }}</p>
        </article>
        <article :class="`${cardClass} text-left md:text-right`">
          <p class="text-xs uppercase tracking-[0.12em] text-slate-500">Handled by</p>
          <p class="mt-2 text-[0.98rem] font-semibold text-slate-700">{{ complaint.reviewer_name || 'Pending assignment' }}</p>
        </article>
      </div>

      <div class="mb-6 rounded-[24px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
        <div class="grid grid-cols-5 items-center gap-2 text-center text-[11px] font-semibold text-slate-600">
          <span v-for="step in workflowSteps" :key="`${step.key}-label`">{{ step.label }}</span>
        </div>
        <div class="mt-2 flex items-center justify-between">
          <div
            v-for="(step, index) in workflowSteps"
            :key="step.key"
            class="flex w-full items-center"
          >
            <div
              class="z-10 mx-auto h-5 w-5 rounded-full border-2 text-center text-[10px] leading-4"
              :class="step.done ? 'border-[var(--app-primary)] bg-[var(--app-primary)] text-white' : 'border-slate-300 bg-white text-slate-400'"
            >
              {{ step.done ? '✓' : '' }}
            </div>
            <div
              v-if="index < workflowSteps.length - 1"
              class="-ml-1 h-1 flex-1"
              :class="step.done && workflowSteps[index + 1]?.done ? 'bg-[var(--app-primary)]' : 'bg-slate-200'"
            ></div>
          </div>
        </div>
      </div>

      <section :class="isUserWorkspace ? 'user-shell-card rounded-[26px] p-5 md:p-6' : 'app-ink-card rounded-[26px] p-5 md:p-6'">
        <h2 class="text-2xl font-semibold text-slate-800 sm:text-3xl">Complaint Title: {{ complaint.title }}</h2>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <span class="app-badge app-badge-warning">{{ prettyStatus(complaint.status) }}</span>
          <span class="app-badge app-badge-neutral">Category</span>
          <span class="app-badge app-badge-neutral">{{ complaint.category || 'N/A' }}</span>
          <span class="app-badge app-badge-escalated">{{ complaint.priority || 'medium' }}</span>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr,0.8fr]">
          <article class="rounded-[22px] border border-[var(--app-line)] bg-white/90 p-5 text-[0.98rem] leading-8 text-slate-700">
            <p>{{ complaint.description || complaint.complaint }}</p>
            <p class="mt-4 text-xs text-slate-500">Submitted by: {{ reporterName }}</p>
          </article>

          <article class="rounded-[22px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-5">
            <p class="text-lg font-semibold text-slate-800">Resolution</p>
            <p class="mt-2 text-[0.98rem] text-slate-700">
              {{ complaint.admin_response || 'Admin response pending. Your complaint is being reviewed.' }}
            </p>
            <p class="mt-2 text-xs text-slate-500">(Resolved on: {{ formatDate(resolvedDate) }})</p>
          </article>
        </div>
      </section>

      <footer class="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
        <button class="app-btn-primary" @click="showChatModal = true">
          Message Support
        </button>
        <button class="app-btn-secondary" @click="downloadReceiptPdf">
          Download Receipt (PDF)
        </button>
      </footer>
    </template>
  </section>

  <LiveSupportModal
    :visible="showChatModal"
    :complaint-id="complaint?.id || null"
    current-role="user"
    title="Support Chat"
    @close="showChatModal = false"
  />
</template>
