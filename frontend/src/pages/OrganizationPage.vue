<script setup>
import { computed, onMounted, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../services/api';
import OrganizationCreateForm from '../components/OrganizationCreateForm.vue';
import { useSessionStore } from '../stores/session.js';

const session = useSessionStore();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const organizations = ref([]);
const resetKey = ref(0);

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const fetchOrganizations = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/organization');
    organizations.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch organization') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch organization');
  } finally {
    loading.value = false;
  }
};

const createOrganization = async (payload) => {
  saving.value = true;
  error.value = '';
  try {
    await api.post('/organization', payload);
    await session.fetchCurrentUser();
    resetKey.value += 1;
    await fetchOrganizations();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to create organization');
  } finally {
    saving.value = false;
  }
};

const myOrganization = computed(() => organizations.value[0] || null);
const hasOrganization = computed(() => !!myOrganization.value);
const isUserWorkspace = computed(() => session.currentUser?.role === 'user');
const panelClass = computed(() => (isUserWorkspace.value ? 'user-shell-panel rounded-[30px] p-5' : 'app-footer-panel rounded-[30px] p-5 text-white'));
const cardClass = computed(() => (isUserWorkspace.value ? 'user-shell-card rounded-[24px] p-4' : 'app-footer-card rounded-[24px] p-4'));
const refreshButtonClass = computed(() => (isUserWorkspace.value ? 'rounded-full border border-[#c6d8f8] bg-white px-4 py-2 text-sm font-medium text-[var(--app-primary-ink)] hover:bg-[#eef4ff]' : 'rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700'));

onMounted(fetchOrganizations);
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="app-kicker">Organization Profile</p>
        <h1 class="mt-2 text-2xl font-bold text-slate-900">My Organization</h1>
        <p class="text-sm text-slate-600">Users can only create and view their own organization profile.</p>
      </div>
      <button :class="refreshButtonClass" @click="fetchOrganizations">
        Refresh
      </button>
    </header>

    <p v-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Loading organization...</p>

    <OrganizationCreateForm
      v-if="!loading && !hasOrganization"
      :loading="saving"
      :reset-key="resetKey"
      title="Create Organization"
      @submit="createOrganization"
    />

    <section v-else-if="!loading && hasOrganization" :class="panelClass">
      <h2 :class="isUserWorkspace ? 'text-lg font-bold text-[var(--app-primary-ink)]' : 'text-lg font-bold text-white'">Organization Detail</h2>
      <p :class="isUserWorkspace ? 'mt-1 text-sm text-[var(--app-muted-color)]' : 'mt-1 text-sm text-white/80'">This is your organization record.</p>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div :class="cardClass">
          <p :class="isUserWorkspace ? 'text-xs font-semibold uppercase tracking-wide text-[var(--app-muted-color)]' : 'text-xs font-semibold uppercase tracking-wide text-white/70'">Name</p>
          <p :class="isUserWorkspace ? 'mt-1 text-base font-semibold text-[var(--app-primary-ink)]' : 'mt-1 text-base font-semibold text-white'">{{ myOrganization.name }}</p>
        </div>
        <div :class="cardClass">
          <p :class="isUserWorkspace ? 'text-xs font-semibold uppercase tracking-wide text-[var(--app-muted-color)]' : 'text-xs font-semibold uppercase tracking-wide text-white/70'">Type</p>
          <p :class="isUserWorkspace ? 'mt-1 text-base font-semibold text-[var(--app-primary-ink)]' : 'mt-1 text-base font-semibold text-white'">{{ myOrganization.organization_type || '-' }}</p>
        </div>
        <div :class="cardClass">
          <p :class="isUserWorkspace ? 'text-xs font-semibold uppercase tracking-wide text-[var(--app-muted-color)]' : 'text-xs font-semibold uppercase tracking-wide text-white/70'">Email</p>
          <p :class="isUserWorkspace ? 'mt-1 text-base font-semibold text-[var(--app-primary-ink)]' : 'mt-1 text-base font-semibold text-white'">{{ myOrganization.email || '-' }}</p>
        </div>
        <div :class="cardClass">
          <p :class="isUserWorkspace ? 'text-xs font-semibold uppercase tracking-wide text-[var(--app-muted-color)]' : 'text-xs font-semibold uppercase tracking-wide text-white/70'">Phone</p>
          <p :class="isUserWorkspace ? 'mt-1 text-base font-semibold text-[var(--app-primary-ink)]' : 'mt-1 text-base font-semibold text-white'">{{ myOrganization.phone || '-' }}</p>
        </div>
        <div :class="`${cardClass} md:col-span-2`">
          <p :class="isUserWorkspace ? 'text-xs font-semibold uppercase tracking-wide text-[var(--app-muted-color)]' : 'text-xs font-semibold uppercase tracking-wide text-white/70'">Address</p>
          <p :class="isUserWorkspace ? 'mt-1 text-base font-semibold text-[var(--app-primary-ink)]' : 'mt-1 text-base font-semibold text-white'">{{ myOrganization.address || '-' }}</p>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <span :class="isUserWorkspace ? 'rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-semibold text-[var(--app-primary-ink)]' : 'rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90'">
          ID: {{ myOrganization.organization_id }}
        </span>
        <span :class="isUserWorkspace ? 'rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-semibold text-[var(--app-primary-ink)]' : 'rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90'">
          Status: {{ myOrganization.status || 'active' }}
        </span>
        <span :class="isUserWorkspace ? 'rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-semibold text-[var(--app-primary-ink)]' : 'rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90'">
          Complaints: {{ myOrganization.complaints_count ?? 0 }}
        </span>
      </div>
    </section>
  </section>
</template>
