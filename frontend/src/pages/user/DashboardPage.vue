<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { complaintsApi, extractApiError } from '../../services/api.js';
import EmptyState from '../../components/ui/EmptyState.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { createUserComplaintAnalytics } from '../../services/analytics.service.js';
import { useSessionStore } from '../../stores/session.js';

const session = useSessionStore();
const loading = ref(false);
const error = ref('');
const complaints = ref([]);

const complaintAnalytics = computed(() => createUserComplaintAnalytics(complaints.value || []));
const complaintSummary = computed(() => complaintAnalytics.value.summary);
const recentComplaints = computed(() => complaintAnalytics.value.recentComplaints);
const isOrganizationMemberUser = computed(
  () => session.currentUser?.role === 'user' && Boolean(session.currentUser?.organization_id)
);

const getWorkflowSteps = (item) => {
  const rawStatus = String(item?.status || 'submitted').toLowerCase();
  const reviewed = ['in_review', 'resolved', 'closed'].includes(rawStatus) || Boolean(item?.reviewed_at || item?.admin_response || item?.assigned_name || item?.reviewer_name);
  const assigned = Boolean(item?.assigned_name);
  const resolved = ['resolved', 'closed'].includes(rawStatus);
  const closed = rawStatus === 'closed';

  return [
    { key: 'submitted', label: 'Submitted', done: true },
    { key: 'reviewed', label: 'Reviewed', done: reviewed },
    { key: 'assigned', label: 'Assigned', done: assigned },
    { key: 'resolved', label: 'Resolved', done: resolved },
    { key: 'closed', label: 'Closed', done: closed }
  ];
};

const getOwnerSummary = (item) => {
  if (item?.assigned_name) return `Assigned to ${item.assigned_name}`;
  if (item?.department_name) return `In ${item.department_name} queue`;
  return 'Pending assignment';
};

const fetchComplaints = async () => {
  loading.value = true;
  error.value = '';

  try {
    complaints.value = await complaintsApi.list() || [];
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
            class="w-full rounded-[22px] border border-[var(--app-line)] !bg-orange-500 px-4 py-3 text-sm font-semibold text-[var(--app-title-color)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-surface-soft)]"
          >
            Submit Complaint
          </RouterLink>
          <RouterLink
            to="/track-complaint"
            class="w-full rounded-[22px] border border-[var(--app-line)] bg-orange-500 px-4 py-3 text-sm font-semibold text-[var(--app-title-color)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-surface-soft)]"
          >
            Track Complaint
          </RouterLink>
          <RouterLink
            to="/feedback"
            class="w-full rounded-[22px] border border-[var(--app-line)] bg-orange-500 px-4 py-3 text-sm font-semibold text-[var(--app-title-color)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-surface-soft)]"
          >
            Leave Feedback
          </RouterLink>
          <RouterLink
            to="/testimonial"
            class="w-full rounded-[22px] border border-[var(--app-line)] bg-orange-500 px-4 py-3 text-sm font-semibold text-[var(--app-title-color)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-surface-soft)]"
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

        <LoadingSpinner v-if="loading" label="Loading complaints..." :centered="false" />
        <ErrorState v-else-if="error" title="Could not load complaints" :description="error" />
        <EmptyState
          v-else-if="recentComplaints.length === 0"
          title="No complaints found yet."
          description="Once you submit a complaint, its latest status will appear here."
        />

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
                <p class="text-xs font-medium text-[var(--app-primary-ink)]">{{ getOwnerSummary(item) }}</p>
                <RouterLink
                  v-if="item.status === 'resolved' || item.status === 'closed'"
                  to="/testimonial"
                  class="mt-3 inline-flex rounded-full border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--app-title-color)] hover:border-[var(--app-line-strong)]"
                >
                  Share Testimonial
                </RouterLink>
              </div>
              <div class="app-action-row flex flex-wrap gap-2">
                <StatusBadge :value="item.priority" />
                <StatusBadge :value="item.status" tone="neutral" />
              </div>
            </div>

            <div class="mt-4 rounded-[22px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-3 py-4 sm:px-4">
              <div class="grid grid-cols-5 items-start gap-2 text-center text-[10px] font-semibold leading-4 text-slate-600 sm:text-[11px]">
                <span v-for="step in getWorkflowSteps(item)" :key="`${item.id}-${step.key}-label`">{{ step.label }}</span>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <div
                  v-for="(step, index) in getWorkflowSteps(item)"
                  :key="`${item.id}-${step.key}`"
                  class="flex w-full items-center"
                >
                  <div
                    class="z-10 mx-auto h-5 w-5 rounded-full border-2 text-center text-[10px] leading-4"
                    :class="step.done ? 'border-[var(--app-primary)] bg-[var(--app-primary)] text-white' : 'border-slate-300 bg-white text-slate-400'"
                  >
                    {{ step.done ? '✓' : '' }}
                  </div>
                  <div
                    v-if="index < getWorkflowSteps(item).length - 1"
                    class="-ml-1 h-1 flex-1"
                    :class="step.done && getWorkflowSteps(item)[index + 1]?.done ? 'bg-[var(--app-primary)]' : 'bg-slate-200'"
                  ></div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>
  </section>
</template>
