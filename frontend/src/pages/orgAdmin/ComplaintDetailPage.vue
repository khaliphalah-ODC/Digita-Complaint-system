<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authApi, complaintsApi, extractApiError } from '../../services/api.js';
import AdminComplaintReviewForm from '../../components/AdminComplaintReviewForm.vue';
import LiveSupportModal from '../../components/LiveSupportModal.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const error = ref('');
const complaint = ref(null);
const assignableUsers = ref([]);
const showChat = ref(false);
const isOrgAdminRoute = computed(() => route.path.startsWith('/org-admin/'));
const complaintsListRoute = computed(() => (isOrgAdminRoute.value ? '/org-admin/complaints' : '/admin/complaints'));
const liveChatRole = computed(() => (isOrgAdminRoute.value ? 'org_admin' : 'super_admin'));

const fetchComplaint = async () => {
  loading.value = true;
  error.value = '';
  try {
    complaint.value = await complaintsApi.getById(route.params.id);
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch complaint');
  } finally {
    loading.value = false;
  }
};

const fetchAssignableUsers = async () => {
  try {
    const users = await authApi.listUsers();
    assignableUsers.value = Array.isArray(users)
      ? users.filter((user) => {
          const role = String(user.role || '').toLowerCase();
          const status = String(user.status || '').toLowerCase();
          return ['org_admin', 'user'].includes(role) && status === 'active';
        })
      : [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load assignment options');
  }
};

const saveReview = async (payload) => {
  if (!complaint.value?.id) return;
  saving.value = true;
  error.value = '';
  try {
    await complaintsApi.update(complaint.value.id, payload);
    await fetchComplaint();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to update complaint');
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchComplaint(), fetchAssignableUsers()]);
});
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="app-kicker">Case Review</p>
        <h1 class="mt-2 text-3xl font-semibold text-slate-900">Complaint Review</h1>
        <p class="text-sm text-slate-600">Inspect full complaint details and send official response.</p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button class="app-btn-secondary w-full sm:w-auto" @click="fetchComplaint">
          Refresh
        </button>
        <button class="app-btn-secondary w-full sm:w-auto" @click="router.push(complaintsListRoute)">
          Back
        </button>
      </div>
    </header>

    <LoadingSpinner
      v-if="loading"
      label="Loading complaint..."
      wrapper-class="app-section-card"
    />
    <ErrorState
      v-else-if="error"
      title="Unable to load complaint"
      :description="error"
    />

    <template v-else-if="complaint">
      <section class="app-shell-panel rounded-[30px] p-6">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-slate-900">{{ complaint.title || 'Untitled Complaint' }}</h2>
            <p class="mt-1 text-sm text-slate-500">Tracking: {{ complaint.tracking_code || 'N/A' }}</p>
          </div>
          <div class="app-action-row flex flex-wrap gap-2">
            <StatusBadge :value="complaint.priority || 'medium'" />
            <StatusBadge :value="complaint.status || 'submitted'" />
          </div>
        </div>

        <div class="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
          <div class="rounded-[18px] border border-[var(--app-line)] bg-white px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Reporter</p>
            <p class="mt-2 font-medium text-slate-900">{{ complaint.is_anonymous ? (complaint.anonymous_label || 'Anonymous') : (complaint.user_full_name || 'N/A') }}</p>
          </div>
          <div class="rounded-[18px] border border-[var(--app-line)] bg-white px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</p>
            <p class="mt-2 font-medium text-slate-900">{{ complaint.user_email || 'N/A' }}</p>
          </div>
          <div class="rounded-[18px] border border-[var(--app-line)] bg-white px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Organization</p>
            <p class="mt-2 font-medium text-slate-900">{{ complaint.organization_name || 'N/A' }}</p>
          </div>
          <div class="rounded-[18px] border border-[var(--app-line)] bg-white px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Department</p>
            <p class="mt-2 font-medium text-slate-900">{{ complaint.department_name || 'Not specified' }}</p>
          </div>
          <div class="rounded-[18px] border border-[var(--app-line)] bg-white px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Assigned To</p>
            <p class="mt-2 font-medium text-slate-900">{{ complaint.assigned_name || 'Pending assignment' }}</p>
          </div>
          <div class="rounded-[18px] border border-[var(--app-line)] bg-white px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Category</p>
            <p class="mt-2 font-medium text-slate-900">{{ complaint.category || 'N/A' }}</p>
          </div>
          <div class="rounded-[18px] border border-[var(--app-line)] bg-white px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Submitted</p>
            <p class="mt-2 font-medium text-slate-900">{{ complaint.created_at || 'N/A' }}</p>
          </div>
        </div>

        <article class="mt-5 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-5 text-sm leading-7 text-slate-700">
          {{ complaint.complaint }}
        </article>
      </section>

      <AdminComplaintReviewForm
        :complaint="complaint"
        :assignable-users="assignableUsers"
        :saving="saving"
        @save="saveReview"
        @open-chat="showChat = true"
      />
    </template>

    <LiveSupportModal
      :visible="showChat"
      :complaint-id="complaint?.id || null"
      :current-role="liveChatRole"
      :title="`Live Chat - ${complaint?.title || `Complaint #${complaint?.id || ''}`}`"
      @close="showChat = false"
    />
      </div>
    </div>
  </section>
</template>
