<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import ActivityFeed from '../../components/ActivityFeed.vue';
import RecentOrganizationsTable from '../../components/RecentOrganizationsTable.vue';
import StatsCards from '../../components/StatsCards.vue';
import { useSessionStore } from '../../stores/session';

const session = useSessionStore();

const profileAvatar = computed(() => {
  return (
    session.currentUser?.avatar_url ||
    session.currentUser?.avatar ||
    session.currentUser?.profile_image ||
    session.currentUser?.photo_url ||
    ''
  );
});

const isAdmin = computed(() => session.currentUser?.role === 'admin');

const operationalSummary = computed(() => {
  const submitted = Number(session.dashboardStats.submittedComplaints || 0);
  const inReview = Number(session.dashboardStats.inReviewComplaints || 0);
  const unresolved = submitted + inReview;
  return {
    unresolved,
    resolved: Number(session.dashboardStats.resolvedComplaints || 0),
    closed: Number(session.dashboardStats.closedComplaints || 0)
  };
});

onMounted(() => {
  session.loadDashboardData();
});
</script>

<template>
  <header class="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
    <div>
      <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">Admin Command Center</p>
      <h1 class="mt-1 text-3xl font-black text-slate-900">
        Welcome back, {{ isAdmin ? 'Platform Admin' : 'Team Member' }}
      </h1>
      <p class="mt-2 text-sm text-slate-600">
        Monitor system health, complaint pipeline, and organization activity from one place.
      </p>
    </div>

    <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
      <img v-if="profileAvatar" :src="profileAvatar" alt="User Avatar" class="h-11 w-11 rounded-full object-cover">
      <div
        v-else
        class="h-11 w-11 rounded-full bg-gradient-to-br from-blue-600 to-slate-700 text-center text-sm font-bold leading-[2.8rem] text-white"
      >
        {{ session.userInitials }}
      </div>
      <div>
        <p class="text-sm font-semibold text-slate-900">{{ session.currentUser?.full_name || 'User' }}</p>
        <p class="text-xs text-slate-500">{{ session.currentUser?.email || 'Signed in' }}</p>
      </div>
    </div>
  </header>

  <section class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <RouterLink to="/admin/organizations" class="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p class="text-xs uppercase tracking-wide text-slate-500">Admin Action</p>
      <p class="mt-1 text-lg font-bold text-slate-900">Manage Organizations</p>
      <p class="text-sm text-slate-600">Create, activate, and monitor organization records.</p>
    </RouterLink>
    <RouterLink to="/admin/complaints" class="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p class="text-xs uppercase tracking-wide text-slate-500">Admin Action</p>
      <p class="mt-1 text-lg font-bold text-slate-900">Review Complaints</p>
      <p class="text-sm text-slate-600">Prioritize and track unresolved complaint cases.</p>
    </RouterLink>
    <RouterLink to="/admin/escalations" class="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p class="text-xs uppercase tracking-wide text-slate-500">Admin Action</p>
      <p class="mt-1 text-lg font-bold text-slate-900">Handle Escalations</p>
      <p class="text-sm text-slate-600">Resolve high-risk items requiring intervention.</p>
    </RouterLink>
    <RouterLink to="/admin/users" class="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p class="text-xs uppercase tracking-wide text-slate-500">Admin Action</p>
      <p class="mt-1 text-lg font-bold text-slate-900">Control User Access</p>
      <p class="text-sm text-slate-600">Manage user accounts and permission visibility.</p>
    </RouterLink>
  </section>

  <StatsCards :stats="session.dashboardStats" :loading="session.loadingDashboard" />

  <section class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
    <article class="rounded-2xl border border-slate-200 bg-white p-4">
      <p class="text-xs uppercase tracking-wide text-slate-500">Pending Workload</p>
      <p class="mt-2 text-3xl font-black text-amber-600">
        {{ session.loadingDashboard ? '...' : operationalSummary.unresolved }}
      </p>
      <p class="text-sm text-slate-600">Submitted + in review complaints needing admin oversight.</p>
    </article>
    <article class="rounded-2xl border border-slate-200 bg-white p-4">
      <p class="text-xs uppercase tracking-wide text-slate-500">Resolved Cases</p>
      <p class="mt-2 text-3xl font-black text-emerald-600">
        {{ session.loadingDashboard ? '...' : operationalSummary.resolved }}
      </p>
      <p class="text-sm text-slate-600">Complaints resolved successfully this cycle.</p>
    </article>
    <article class="rounded-2xl border border-slate-200 bg-white p-4">
      <p class="text-xs uppercase tracking-wide text-slate-500">Closed Cases</p>
      <p class="mt-2 text-3xl font-black text-slate-700">
        {{ session.loadingDashboard ? '...' : operationalSummary.closed }}
      </p>
      <p class="text-sm text-slate-600">Cases closed after review and final verification.</p>
    </article>
  </section>

  <RecentOrganizationsTable
    :organizations="session.recentOrganizations"
    :loading="session.loadingDashboard || session.loadingRecentOrganizations"
    :error="session.dashboardError || session.recentOrganizationsError"
  />
  <ActivityFeed
    :items="session.activityFeed"
    :loading="session.loadingDashboard"
    :error="session.dashboardError"
  />
</template>
