<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../../services/api.js';
import AdminComplaintReviewForm from '../../../components/AdminComplaintReviewForm.vue';
import LiveSupportModal from '../../../components/LiveSupportModal.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const error = ref('');
const complaint = ref(null);
const showChat = ref(false);
const isOrgAdminRoute = computed(() => route.path.startsWith('/org-admin/'));
const complaintsListRoute = computed(() => (isOrgAdminRoute.value ? '/org-admin/complaints' : '/admin/complaints'));
const liveChatRole = computed(() => (isOrgAdminRoute.value ? 'org_admin' : 'super_admin'));

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const fetchComplaint = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get(`/complaint/${route.params.id}`);
    complaint.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch complaint');
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch complaint');
  } finally {
    loading.value = false;
  }
};

const saveReview = async (payload) => {
  if (!complaint.value?.id) return;
  saving.value = true;
  error.value = '';
  try {
    await api.put(`/complaint/${complaint.value.id}`, payload);
    await fetchComplaint();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to update complaint');
  } finally {
    saving.value = false;
  }
};

onMounted(fetchComplaint);
</script>

<template>
  <section class="w-full space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="app-kicker">Case Review</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-900">Complaint Review</h1>
        <p class="text-sm text-slate-600">Inspect full complaint details and send official response.</p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button class="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 sm:w-auto" @click="fetchComplaint">
          Refresh
        </button>
        <button class="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 sm:w-auto" @click="router.push(complaintsListRoute)">
          Back
        </button>
      </div>
    </header>

    <p v-if="loading" class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Loading complaint...</p>
    <p v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</p>

    <template v-else-if="complaint">
      <section class="app-shell-panel rounded-[30px] p-6">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 class="text-xl font-bold text-slate-900">{{ complaint.title || 'Untitled Complaint' }}</h2>
          <p class="text-xs text-slate-500">Tracking: {{ complaint.tracking_code || 'N/A' }}</p>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <p><span class="font-semibold text-slate-700">Reporter:</span> {{ complaint.is_anonymous ? (complaint.anonymous_label || 'Anonymous') : (complaint.user_full_name || 'N/A') }}</p>
          <p><span class="font-semibold text-slate-700">Email:</span> {{ complaint.user_email || 'N/A' }}</p>
          <p><span class="font-semibold text-slate-700">Organization:</span> {{ complaint.organization_name || 'N/A' }}</p>
          <p><span class="font-semibold text-slate-700">Department:</span> {{ complaint.department_name || 'Not specified' }}</p>
          <p><span class="font-semibold text-slate-700">Category:</span> {{ complaint.category || 'N/A' }}</p>
        </div>

        <article class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {{ complaint.complaint }}
        </article>
      </section>

      <AdminComplaintReviewForm :complaint="complaint" :saving="saving" @save="saveReview" @open-chat="showChat = true" />
    </template>

    <LiveSupportModal
      :visible="showChat"
      :complaint-id="complaint?.id || null"
      :current-role="liveChatRole"
      :title="`Live Chat - ${complaint?.title || `Complaint #${complaint?.id || ''}`}`"
      @close="showChat = false"
    />
  </section>
</template>
