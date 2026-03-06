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

onMounted(fetchOrganizations);
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">My Organization</h1>
        <p class="text-sm text-slate-600">Users can only create and view their own organization profile.</p>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="fetchOrganizations">
        Refresh
      </button>
    </header>

    <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Loading organization...</p>

    <OrganizationCreateForm
      v-if="!loading && !hasOrganization"
      :loading="saving"
      :reset-key="resetKey"
      title="Create Organization"
      @submit="createOrganization"
    />

    <section v-else-if="!loading && hasOrganization" class="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 class="text-lg font-bold text-slate-900">Organization Detail</h2>
      <p class="mt-1 text-sm text-slate-600">This is your organization record.</p>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
          <p class="mt-1 text-base font-semibold text-slate-900">{{ myOrganization.name }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
          <p class="mt-1 text-base font-semibold text-slate-900">{{ myOrganization.organization_type || '-' }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
          <p class="mt-1 text-base font-semibold text-slate-900">{{ myOrganization.email || '-' }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
          <p class="mt-1 text-base font-semibold text-slate-900">{{ myOrganization.phone || '-' }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</p>
          <p class="mt-1 text-base font-semibold text-slate-900">{{ myOrganization.address || '-' }}</p>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          ID: {{ myOrganization.organization_id }}
        </span>
        <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Status: {{ myOrganization.status || 'active' }}
        </span>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Complaints: {{ myOrganization.complaints_count ?? 0 }}
        </span>
      </div>
    </section>
  </section>
</template>
