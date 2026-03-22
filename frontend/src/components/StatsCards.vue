<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <div class="space-y-4">
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-[20px] border border-[var(--app-line)] bg-[var(--app-primary)] p-5 text-white shadow-[0_18px_34px_rgba(24,58,99,0.16)]">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-white/68">Total Organizations</p>
        <p class="mt-3 text-4xl font-semibold">{{ loading ? '...' : stats.totalOrganizations }}</p>
      </article>
      <article class="app-section-card">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Active Organizations</p>
        <p class="mt-3 text-4xl font-semibold text-slate-900">{{ loading ? '...' : stats.activeOrganizations }}</p>
      </article>
      <article class="app-section-card">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Suspended Organizations</p>
        <p class="mt-3 text-4xl font-semibold text-slate-900">{{ loading ? '...' : stats.suspendedOrganizations }}</p>
      </article>
      <article class="app-section-card">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total Complaints</p>
        <p class="mt-3 text-4xl font-semibold text-slate-900">{{ loading ? '...' : stats.totalComplaints }}</p>
      </article>
    </section>

    <section class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <article class="rounded-[18px] border border-[var(--app-line)] bg-white p-4 shadow-[var(--app-shadow-sm)]">
        <p class="text-xs uppercase tracking-[0.12em] text-slate-500">Submitted</p>
        <p class="mt-2 text-2xl font-semibold text-[var(--app-primary)]">{{ loading ? '...' : stats.submittedComplaints }}</p>
      </article>
      <article class="rounded-[18px] border border-[var(--app-line)] bg-white p-4 shadow-[var(--app-shadow-sm)]">
        <p class="text-xs uppercase tracking-[0.12em] text-[var(--app-pending)]">In Review</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ loading ? '...' : stats.inReviewComplaints }}</p>
      </article>
      <article class="rounded-[18px] border border-[var(--app-line)] bg-white p-4 shadow-[var(--app-shadow-sm)]">
        <p class="text-xs uppercase tracking-[0.12em] text-[var(--app-success)]">Resolved</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ loading ? '...' : stats.resolvedComplaints }}</p>
      </article>
      <article class="rounded-[18px] border border-[var(--app-line)] bg-white p-4 shadow-[var(--app-shadow-sm)]">
        <p class="text-xs uppercase tracking-[0.12em] text-slate-500">Closed</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ loading ? '...' : stats.closedComplaints }}</p>
      </article>
    </section>
  </div>
</template>
