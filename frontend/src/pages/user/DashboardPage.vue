<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../services/api.js';
import { useSessionStore } from '../../stores/session.js';

const session = useSessionStore();
const loading = ref(false);
const error = ref('');
const complaints = ref([]);

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) {
    throw new Error(payload?.message || fallbackMessage);
  }
  return payload.data;
};

const complaintSummary = computed(() => {
  const rows = complaints.value || [];
  return {
    total: rows.length,
    open: rows.filter((row) => row.status === 'submitted' || row.status === 'in_review').length,
    resolved: rows.filter((row) => row.status === 'resolved' || row.status === 'closed').length
  };
});

const recentComplaints = computed(() => (complaints.value || []).slice(0, 5));
const isOrganizationMemberUser = computed(
  () => session.currentUser?.role === 'user' && Boolean(session.currentUser?.organization_id)
);

const fetchComplaints = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.get('/complaint');
    complaints.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch complaints') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch complaints');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchComplaints);
</script>

<template>
  <section class="w-full space-y-5">
    <header>
      <p class="app-kicker">
        {{ isOrganizationMemberUser ? 'Organization User Workspace' : 'Public User Workspace' }}
      </p>
      <h1 class="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
        Welcome, {{ session.currentUser?.full_name || 'User' }}
      </h1>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        {{ isOrganizationMemberUser
          ? 'Track the complaints you filed through your organization and submit new reports quickly.'
          : 'Track your complaint activity, submit new complaints, and follow up on progress from one place.' }}
      </p>
    </header>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <article class="app-ink-card rounded-[28px] p-5">
        <p class="text-xs uppercase tracking-wide text-slate-500">Total Complaints</p>
        <p class="mt-2 text-3xl font-black text-slate-900">{{ loading ? '...' : complaintSummary.total }}</p>
      </article>
      <article class="app-ink-card rounded-[28px] p-5">
        <p class="text-xs uppercase tracking-wide text-slate-500">Open</p>
        <p class="mt-2 text-3xl font-black text-[var(--app-accent)]">{{ loading ? '...' : complaintSummary.open }}</p>
      </article>
      <article class="app-ink-card rounded-[28px] p-5">
        <p class="text-xs uppercase tracking-wide text-slate-500">Resolved</p>
        <p class="mt-2 text-3xl font-black text-[var(--app-primary)]">{{ loading ? '...' : complaintSummary.resolved }}</p>
      </article>
    </section>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr,1.15fr]">
      <section class="user-shell-panel p-5">
        <h2 class="text-lg font-bold text-slate-900">Quick Actions</h2>
        <div class="mt-4 grid gap-3">
          <RouterLink
            to="/submit-complaint"
            class="w-full rounded-[22px] border border-[var(--app-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--app-title-color)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-surface-soft)]"
          >
            Submit Complaint
          </RouterLink>
          <RouterLink
            to="/track-complaint"
            class="w-full rounded-[22px] border border-[var(--app-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--app-title-color)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-surface-soft)]"
          >
            Track Complaint
          </RouterLink>
          <RouterLink
            to="/feedback"
            class="w-full rounded-[22px] border border-[var(--app-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--app-title-color)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-surface-soft)]"
          >
            Leave Feedback
          </RouterLink>
          <RouterLink
            to="/testimonial"
            class="w-full rounded-[22px] border border-[var(--app-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--app-title-color)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-surface-soft)]"
          >
            Share Your Experience
          </RouterLink>
        </div>
      </section>

      <section class="app-section-card p-6">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-[var(--app-title-color)]">Recent Complaints</h2>
            <p class="text-[0.98rem] text-[var(--app-muted-color)]">Only your complaints are listed here.</p>
          </div>
          <button class="app-btn-secondary min-h-[36px] px-4 py-2 text-sm" @click="fetchComplaints">
            Refresh
          </button>
        </div>

        <p v-if="loading" class="text-sm text-[var(--app-muted-color)]">Loading complaints...</p>
        <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-else-if="recentComplaints.length === 0" class="text-sm text-[var(--app-muted-color)]">No complaints found yet.</p>

        <div v-else class="space-y-3">
          <article
            v-for="item in recentComplaints"
            :key="item.id"
            class="app-card rounded-[24px] p-4"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-[var(--app-title-color)]">{{ item.title || 'Untitled Complaint' }}</h3>
                <p class="mt-1 text-[0.98rem] text-[var(--app-muted-color)]">{{ item.complaint }}</p>
                <p class="mt-2 text-xs text-[var(--app-muted-color)]">Tracking: {{ item.tracking_code || 'N/A' }}</p>
                <p class="text-xs text-[var(--app-muted-color)]">Organization: {{ item.organization_name || 'Not assigned' }}</p>
                <p class="text-xs text-[var(--app-muted-color)]">Department: {{ item.department_name || 'Not specified' }}</p>
                <RouterLink
                  v-if="item.status === 'resolved' || item.status === 'closed'"
                  to="/testimonial"
                  class="mt-3 inline-flex rounded-full border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--app-title-color)] hover:border-[var(--app-line-strong)]"
                >
                  Share Testimonial
                </RouterLink>
              </div>
              <div class="app-action-row flex flex-wrap gap-2">
                <span class="app-badge app-badge-warning">{{ item.priority }}</span>
                <span class="app-badge app-badge-neutral">{{ item.status }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>
  </section>
</template>
