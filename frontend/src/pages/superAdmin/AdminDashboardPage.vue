<script setup>
import { computed, onMounted, ref } from 'vue';
import ActivityFeed from '../../components/ActivityFeed.vue';
import RecentOrganizationsTable from '../../components/RecentOrganizationsTable.vue';
import OrganizationCreateForm from '../../components/OrganizationCreateForm.vue';
import { useSessionStore } from '../../stores/session';
import { useUiToastStore } from '../../stores/uiToast';
import api, { extractApiError, unwrapResponse } from '../../services/api';

const session = useSessionStore();
const uiToast = useUiToastStore();
const saving = ref(false);
const formError = ref('');

const profileAvatar = computed(() => {
  return (
    session.currentUser?.avatar_url ||
    session.currentUser?.avatar ||
    session.currentUser?.profile_image ||
    session.currentUser?.photo_url ||
    ''
  );
});

const isSuperAdmin = computed(() => session.currentUser?.role === 'super_admin');

const organizationSummary = computed(() => {
  const total = Number(session.dashboardStats.totalOrganizations || 0);
  const active = Number(session.dashboardStats.activeOrganizations || 0);
  const suspended = Number(session.dashboardStats.suspendedOrganizations || 0);
  const unassignedAnonymousComplaints = Number(session.dashboardStats.unassignedAnonymousComplaints || 0);
  return {
    total,
    active,
    suspended,
    pendingSetup: Math.max(0, total - active - suspended),
    unassignedAnonymousComplaints
  };
});

const createOrganization = async (payload) => {
  saving.value = true;
  formError.value = '';

  try {
    const response = await api.post('/organizations', payload);
    const data = unwrapResponse(response);
    if (!data?.success) {
      throw new Error(data?.message || 'Failed to create organization');
    }
    uiToast.success('Organization and organization admin created successfully.');
    await Promise.all([session.fetchRecentOrganizations(), session.loadDashboardData()]);
  } catch (error) {
    formError.value = extractApiError(error, 'Failed to create organization');
    uiToast.error(formError.value);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  session.fetchRecentOrganizations();
  session.loadDashboardData();
});
</script>

<template>
  <header class="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
    <div>
      <p class="app-kicker">Super Admin Command Center</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
        Welcome back, {{ isSuperAdmin ? 'Super Admin' : 'Platform User' }}
      </h1>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Create organizations, assign organization admins, and monitor platform-wide aggregate health from one place.
      </p>
    </div>

    <div class="app-shell-panel flex items-center gap-3 rounded-[24px] px-3 py-3 text-right">
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
    <article class="app-ink-card rounded-[28px] p-5 text-left">
      <p class="text-xs uppercase tracking-wide text-slate-500">Admin Action</p>
      <p class="mt-1 text-lg font-bold text-slate-900">Organizations</p>
      <p class="text-sm text-slate-600">Provision new organizations and assign their admin accounts.</p>
    </article>
    <article class="app-ink-card rounded-[28px] p-5 text-left">
      <p class="text-xs uppercase tracking-wide text-slate-500">Admin Action</p>
      <p class="mt-1 text-lg font-bold text-slate-900">Organization Directory</p>
      <p class="text-sm text-slate-600">Review organization profiles, statuses, and assigned org-admin accounts.</p>
    </article>
    <article class="app-ink-card rounded-[28px] p-5 text-left">
      <p class="text-xs uppercase tracking-wide text-slate-500">Admin Action</p>
      <p class="mt-1 text-lg font-bold text-slate-900">Organization Status</p>
      <p class="text-sm text-slate-600">Track which organizations are active or inactive across the platform.</p>
    </article>
    <article class="app-ink-card rounded-[28px] p-5 text-left">
      <p class="text-xs uppercase tracking-wide text-slate-500">Admin Action</p>
      <p class="mt-1 text-lg font-bold text-slate-900">Organization Oversight</p>
      <p class="text-sm text-slate-600">Track organization status, activity, and assigned admins.</p>
    </article>
  </section>

  <section class="mb-4">
    <div class="inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
      <span class="rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-white">
        {{ session.loadingDashboard ? '...' : organizationSummary.unassignedAnonymousComplaints }}
      </span>
      <span class="text-sm font-semibold text-amber-900">Unassigned anonymous complaints waiting for triage</span>
    </div>
  </section>

  <section class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
    <article class="app-ink-card rounded-[28px] p-5">
      <p class="text-xs uppercase tracking-wide text-slate-500">Total Organizations</p>
      <p class="mt-2 text-3xl font-black text-amber-600">
        {{ session.loadingDashboard ? '...' : organizationSummary.total }}
      </p>
      <p class="text-sm text-slate-600">All organizations currently registered on the platform.</p>
    </article>
    <article class="app-ink-card rounded-[28px] p-5">
      <p class="text-xs uppercase tracking-wide text-slate-500">Active Organizations</p>
      <p class="mt-2 text-3xl font-black text-emerald-600">
        {{ session.loadingDashboard ? '...' : organizationSummary.active }}
      </p>
      <p class="text-sm text-slate-600">Organizations currently enabled and operating normally.</p>
    </article>
    <article class="app-ink-card rounded-[28px] p-5">
      <p class="text-xs uppercase tracking-wide text-slate-500">Inactive Organizations</p>
      <p class="mt-2 text-3xl font-black text-slate-700">
        {{ session.loadingDashboard ? '...' : organizationSummary.suspended }}
      </p>
      <p class="text-sm text-slate-600">Organizations currently suspended or marked inactive.</p>
    </article>
    <article class="app-ink-card rounded-[28px] p-5">
      <p class="text-xs uppercase tracking-wide text-slate-500">Anonymous Triage Queue</p>
      <p class="mt-2 text-3xl font-black text-amber-700">
        {{ session.loadingDashboard ? '...' : organizationSummary.unassignedAnonymousComplaints }}
      </p>
      <p class="text-sm text-slate-600">Anonymous complaints submitted without an organization assignment.</p>
    </article>
    <article class="app-ink-card rounded-[28px] p-5">
      <p class="text-xs uppercase tracking-wide text-slate-500">Directory Entries</p>
      <p class="mt-2 text-3xl font-black text-blue-700">
        {{ session.loadingRecentOrganizations ? '...' : session.recentOrganizations.length }}
      </p>
      <p class="text-sm text-slate-600">Organization records shown in the current dashboard directory view.</p>
    </article>
  </section>

  <section class="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[1.15fr,0.85fr]">
    <div class="space-y-4">
      <OrganizationCreateForm
        title="Create Organization"
        :loading="saving"
        :show-status="true"
        @submit="createOrganization"
      />
      <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
    </div>

    <section class="app-shell-panel rounded-[30px] p-5">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Organization Directory</h2>
          <p class="text-sm text-slate-600">Full platform list with assigned organization admins.</p>
        </div>
        <button class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700" @click="session.fetchRecentOrganizations">
          Refresh
        </button>
      </div>

      <p v-if="session.loadingRecentOrganizations" class="text-sm text-slate-500">Loading organizations...</p>
      <p v-else-if="session.recentOrganizationsError" class="text-sm text-red-600">{{ session.recentOrganizationsError }}</p>
      <div v-else class="space-y-3">
        <article
          v-for="row in session.recentOrganizations"
          :key="row.id"
          class="app-ink-card rounded-[24px] px-4 py-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-bold text-slate-900">{{ row.name }}</h3>
              <p class="text-sm text-slate-600">{{ row.type || 'Organization' }}</p>
            </div>
            <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{{ row.status }}</span>
          </div>
          <div class="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600">
            <p>Admin: {{ row.organization_admin?.full_name || 'Not assigned' }}</p>
            <p>Email: {{ row.organization_admin?.email || row.email || 'N/A' }}</p>
            <p>Last Active: {{ row.lastActive || 'N/A' }}</p>
          </div>
        </article>
      </div>
    </section>
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
