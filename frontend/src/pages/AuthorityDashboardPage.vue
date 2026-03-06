<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useComplaintStore } from '../stores/complaint';
import { useSessionStore } from '../stores/session';

const complaintStore = useComplaintStore();
const session = useSessionStore();

const myStats = computed(() => {
  const rows = complaintStore.complaints || [];
  return {
    total: rows.length,
    open: rows.filter((row) => row.status === 'submitted' || row.status === 'in_review').length,
    resolved: rows.filter((row) => row.status === 'resolved' || row.status === 'closed').length
  };
});

onMounted(() => {
  complaintStore.fetchComplaints();
});
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">Team Workspace</p>
      <h1 class="mt-1 text-3xl font-black text-slate-900">Welcome, {{ session.currentUser?.full_name || 'Team Member' }}</h1>
      <p class="mt-2 text-sm text-slate-600">
        Track your own complaint activity and submit new reports.
      </p>
    </header>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <article class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-xs uppercase tracking-wide text-slate-500">My Complaints</p>
        <p class="mt-2 text-3xl font-black text-slate-900">{{ complaintStore.loading ? '...' : myStats.total }}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-xs uppercase tracking-wide text-slate-500">Open</p>
        <p class="mt-2 text-3xl font-black text-amber-600">{{ complaintStore.loading ? '...' : myStats.open }}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-xs uppercase tracking-wide text-slate-500">Resolved</p>
        <p class="mt-2 text-3xl font-black text-emerald-600">{{ complaintStore.loading ? '...' : myStats.resolved }}</p>
      </article>
    </section>

    <section class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <RouterLink to="/complaints" class="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <p class="text-xs uppercase tracking-wide text-slate-500">Quick Action</p>
        <p class="mt-1 text-lg font-bold text-slate-900">Open Complaints</p>
        <p class="text-sm text-slate-600">Submit new complaint and track your existing cases.</p>
      </RouterLink>
      <RouterLink to="/feedback" class="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <p class="text-xs uppercase tracking-wide text-slate-500">Quick Action</p>
        <p class="mt-1 text-lg font-bold text-slate-900">Send Feedback</p>
        <p class="text-sm text-slate-600">Share service feedback related to closed complaints.</p>
      </RouterLink>
    </section>
  </section>
</template>
