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
      <section class="app-footer-panel rounded-[30px] p-5 text-white">
        <h2 class="text-lg font-bold text-white">Quick Actions</h2>
        <div class="mt-4 grid gap-3">
          <RouterLink to="/submit-complaint" class="rounded-[22px] bg-[var(--app-primary)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(31,77,183,0.2)] hover:-translate-y-0.5 hover:bg-[var(--app-primary-ink)]">
            Submit Complaint
          </RouterLink>
          <RouterLink to="/track-complaint" class="rounded-[22px] border border-white/30 bg-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/30">
            Track Complaint
          </RouterLink>
          <RouterLink to="/feedback" class="rounded-[22px] border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20">
            Leave Feedback
          </RouterLink>
          <RouterLink to="/testimonial" class="rounded-[22px] border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20">
         Share Your Experience
        </RouterLink>
        </div>
      </section>

      <section class="app-footer-panel rounded-[30px] p-5 text-white">
          <RouterLink to="/testimonial" class="user-shell-outline-btn rounded-[22px] px-4 py-3 text-sm">
            Share Testimonial
          </RouterLink>
        </div>
      </section>

      <section class="user-shell-accent p-6 text-white">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-white">Recent Complaints</h2>
            <p class="text-[0.98rem] text-white/80">Only your complaints are listed here.</p>
          </div>
          <button class="rounded-full border border-white/25 bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30" @click="fetchComplaints">
            Refresh
          </button>
        </div>

        <p v-if="loading" class="text-sm text-white/70">Loading complaints...</p>
        <p v-else-if="error" class="text-sm text-red-300">{{ error }}</p>
        <p v-else-if="recentComplaints.length === 0" class="text-sm text-white/70">No complaints found yet.</p>

        <div v-else class="space-y-3">
          <article
            v-for="item in recentComplaints"
            :key="item.id"
            class="app-footer-card rounded-[24px] p-4"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white">{{ item.title || 'Untitled Complaint' }}</h3>
                <p class="mt-1 text-[0.98rem] text-white/80">{{ item.complaint }}</p>
                <p class="mt-2 text-xs text-white/60">Tracking: {{ item.tracking_code || 'N/A' }}</p>
                <p class="text-xs text-white/60">Organization: {{ item.organization_name || 'Not assigned' }}</p>
                <p class="text-xs text-white/60">Department: {{ item.department_name || 'Not specified' }}</p>
                <RouterLink
                  v-if="item.status === 'resolved' || item.status === 'closed'"
                  to="/testimonial"
                  class="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/16"
                >
                  Share Testimonial
                </RouterLink>
              </div>
              <div class="flex flex-wrap gap-2">
                <span class="app-badge bg-white/15 text-white">
                  {{ item.priority }}
                </span>
                <span class="app-badge bg-white/15 text-white">
                  {{ item.status }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>
  </section>
</template>
