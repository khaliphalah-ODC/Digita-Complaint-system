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

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const statusOrder = ['submitted', 'in_review', 'resolved', 'closed'];

const statusIndex = computed(() => {
  const status = complaint.value?.status || 'submitted';
  const idx = statusOrder.indexOf(status);
  return idx >= 0 ? idx : 0;
});

const prettyStatus = (status) => {
  if (!status) return 'Submitted';
  if (status === 'in_review') return 'In Review';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const statusBadgeClass = computed(() => {
  const status = complaint.value?.status;
  if (status === 'resolved') return 'bg-emerald-100 text-emerald-700';
  if (status === 'closed') return 'bg-slate-200 text-slate-700';
  if (status === 'in_review') return 'bg-violet-100 text-violet-700';
  return 'bg-blue-100 text-blue-700';
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
  <body style="font-family: Arial, sans-serif; padding: 24px;">
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
  <section class="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:p-7">
    <header class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-4xl font-black text-slate-800">{{ complaint?.tracking_code || 'TRK-000-000' }}</h1>
        <span class="rounded-full px-3 py-1 text-sm font-semibold" :class="statusBadgeClass">
          {{ prettyStatus(complaint?.status) }}
        </span>
      </div>

      <div class="flex w-full flex-col gap-2 md:w-[340px] md:flex-row">
        <input
          v-model="trackingInput"
          placeholder="Enter tracking code"
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-violet-500"
        >
        <button class="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700" @click="searchByCode">
          Track
        </button>
      </div>
    </header>

    <p v-if="loading" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Loading complaint...</p>
    <p v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

    <template v-else-if="complaint">
      <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <article class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p class="text-xs text-slate-500">Organization:</p>
          <p class="text-sm font-semibold text-slate-700">{{ complaint.organization_name || 'N/A' }}</p>
          <p class="text-xs text-slate-500">{{ complaint.organization_address || '' }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left md:text-right">
          <p class="text-xs text-slate-500">Handled by:</p>
          <p class="text-sm font-semibold text-slate-700">{{ complaint.reviewer_name || 'Pending assignment' }}</p>
        </article>
      </div>

      <div class="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div class="grid grid-cols-4 items-center gap-2 text-center text-xs font-semibold text-slate-600">
          <span>Submitted</span>
          <span>In Review</span>
          <span>Resolved</span>
          <span>Closed</span>
        </div>
        <div class="mt-2 flex items-center justify-between">
          <div
            v-for="(step, index) in statusOrder"
            :key="step"
            class="flex w-full items-center"
          >
            <div
              class="z-10 mx-auto h-5 w-5 rounded-full border-2 text-center text-[10px] leading-4"
              :class="index <= statusIndex ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-300 bg-white text-slate-400'"
            >
              {{ index <= statusIndex ? '✓' : '' }}
            </div>
            <div
              v-if="index < statusOrder.length - 1"
              class="-ml-1 h-1 flex-1"
              :class="index < statusIndex ? 'bg-violet-500' : 'bg-slate-200'"
            ></div>
          </div>
        </div>
      </div>

      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <h2 class="text-3xl font-black text-slate-800">Complaint Title: {{ complaint.title }}</h2>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{{ prettyStatus(complaint.status) }}</span>
          <span class="rounded-md bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Category</span>
          <span class="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{{ complaint.category || 'N/A' }}</span>
          <span class="rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-white">{{ complaint.priority || 'medium' }}</span>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr,0.8fr]">
          <article class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>{{ complaint.description || complaint.complaint }}</p>
            <p class="mt-4 text-xs text-slate-500">Submitted by: {{ reporterName }}</p>
          </article>

          <article class="rounded-xl border border-violet-300 bg-emerald-50 p-4">
            <p class="text-lg font-bold text-slate-800">Resolution</p>
            <p class="mt-2 text-sm text-slate-700">
              {{ complaint.admin_response || 'Admin response pending. Your complaint is being reviewed.' }}
            </p>
            <p class="mt-2 text-xs text-slate-500">(Resolved on: {{ formatDate(resolvedDate) }})</p>
          </article>
        </div>
      </section>

      <footer class="mt-6 flex flex-col gap-3 md:flex-row md:justify-between">
        <button class="rounded-full bg-violet-600 px-6 py-2 text-sm font-semibold text-white hover:bg-violet-700" @click="showChatModal = true">
          Message Support
        </button>
        <button class="rounded-full border border-slate-400 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" @click="downloadReceiptPdf">
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
