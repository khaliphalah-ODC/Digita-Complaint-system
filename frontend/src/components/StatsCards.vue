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
      <article class="rounded-2xl bg-blue-600 p-5 text-white shadow-lg">
        <p class="text-sm opacity-80">Total Organizations</p>
        <p class="mt-2 text-4xl font-black">{{ loading ? '...' : stats.totalOrganizations }}</p>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">Active Organizations</p>
        <p class="mt-2 text-4xl font-black text-slate-900">{{ loading ? '...' : stats.activeOrganizations }}</p>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">Suspended Organizations</p>
        <p class="mt-2 text-4xl font-black text-slate-900">{{ loading ? '...' : stats.suspendedOrganizations }}</p>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">Total Complaints</p>
        <p class="mt-2 text-4xl font-black text-slate-900">{{ loading ? '...' : stats.totalComplaints }}</p>
      </article>
    </section>

    <section class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <article class="rounded-xl border border-slate-200 bg-white p-3">
        <p class="text-xs uppercase tracking-wide text-slate-500">Submitted</p>
        <p class="mt-1 text-2xl font-black text-amber-600">{{ loading ? '...' : stats.submittedComplaints }}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-3">
        <p class="text-xs uppercase tracking-wide text-slate-500">In Review</p>
        <p class="mt-1 text-2xl font-black text-blue-600">{{ loading ? '...' : stats.inReviewComplaints }}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-3">
        <p class="text-xs uppercase tracking-wide text-slate-500">Resolved</p>
        <p class="mt-1 text-2xl font-black text-emerald-600">{{ loading ? '...' : stats.resolvedComplaints }}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-3">
        <p class="text-xs uppercase tracking-wide text-slate-500">Closed</p>
        <p class="mt-1 text-2xl font-black text-slate-700">{{ loading ? '...' : stats.closedComplaints }}</p>
      </article>
    </section>
  </div>
</template>
