<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../services/api.js';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const organization = ref(null);

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const mapUrl = computed(() => {
  const addr = organization.value?.address;
  if (!addr) return '#';
  return `https://maps.google.com/?q=${encodeURIComponent(addr)}`;
});

const exportSnapshotPdf = () => {
  if (!organization.value) return;
  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Organization Snapshot</title></head>
  <body style="font-family: Arial, sans-serif; padding: 24px;">
    <h2>Organization Snapshot</h2>
    <p><strong>Name:</strong> ${organization.value.name || 'N/A'}</p>
    <p><strong>ID:</strong> ${organization.value.organization_id || 'N/A'}</p>
    <p><strong>Type:</strong> ${organization.value.organization_type || 'N/A'}</p>
    <p><strong>Status:</strong> ${organization.value.status || 'N/A'}</p>
    <p><strong>Admin:</strong> ${organization.value.organization_admin?.full_name || 'Not assigned'}</p>
    <p><strong>Admin Email:</strong> ${organization.value.organization_admin?.email || 'N/A'}</p>
    <p><strong>Organization Email:</strong> ${organization.value.email || 'N/A'}</p>
    <p><strong>Phone:</strong> ${organization.value.phone || 'N/A'}</p>
    <p><strong>Address:</strong> ${organization.value.address || 'N/A'}</p>
    <script>window.print()<\\/script>
  </body></html>`;

  const popup = window.open('', '_blank', 'width=900,height=700');
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
};

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const orgId = route.params.id;
    const orgRes = await api.get(`/organization/${orgId}`);
    organization.value = ensureSuccess(unwrapResponse(orgRes), 'Failed to fetch organization');
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load organization detail');
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<template>
  <section class="w-full space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="app-kicker">Profile View</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-900">Organization Detail</h1>
        <p class="text-sm text-slate-600">Organization profile, status, and assigned admin information.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700" @click="load">Refresh</button>
        <button class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700" @click="exportSnapshotPdf">Export Snapshot (PDF)</button>
        <button class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700" @click="router.push('/admin/organizations')">Back</button>
      </div>
    </header>

    <p v-if="loading" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Loading organization detail...</p>
    <p v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</p>

    <template v-else-if="organization">
      <section class="app-shell-panel rounded-[30px] p-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4">
            <img
              v-if="organization.logo"
              :src="organization.logo"
              alt="Organization Logo"
              class="h-16 w-16 rounded-full border border-slate-200 object-cover"
            >
            <div v-else class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">ORG</div>
            <div>
              <h2 class="text-2xl font-black text-slate-900">{{ organization.name }}</h2>
              <div class="mt-1 flex flex-wrap gap-2">
                <span class="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">ID: {{ organization.organization_id }}</span>
                <span class="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{{ organization.organization_type }}</span>
                <span class="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{{ organization.status }}</span>
              </div>
            </div>
          </div>

          <article class="app-ink-card rounded-[24px] px-4 py-4 text-right">
            <p class="text-xs uppercase tracking-wide text-slate-500">Assigned Org Admin</p>
            <p class="mt-1 text-lg font-bold text-slate-900">{{ organization.organization_admin?.full_name || 'Not assigned' }}</p>
            <p class="text-xs text-slate-500">{{ organization.organization_admin?.email || 'No admin email' }}</p>
          </article>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article class="app-shell-panel rounded-[28px] p-5">
          <h3 class="text-lg font-bold text-slate-900">Contact & Location</h3>
          <div class="mt-3 grid grid-cols-1 gap-2 text-sm">
            <p><span class="font-semibold text-slate-700">Email:</span> {{ organization.email || 'N/A' }}</p>
            <p><span class="font-semibold text-slate-700">Phone:</span> {{ organization.phone || 'N/A' }}</p>
            <p><span class="font-semibold text-slate-700">Address:</span> {{ organization.address || 'N/A' }}</p>
            <a :href="mapUrl" target="_blank" rel="noopener noreferrer" class="inline-block w-max rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
              View on Map
            </a>
          </div>
        </article>

        <article class="app-shell-panel rounded-[28px] p-5">
          <h3 class="text-lg font-bold text-slate-900">Admin Assignment</h3>
          <div class="mt-3 grid grid-cols-1 gap-2 text-sm">
            <p><span class="font-semibold text-slate-700">Organization Admin:</span> {{ organization.organization_admin?.full_name || 'Not assigned' }}</p>
            <p><span class="font-semibold text-slate-700">Admin Email:</span> {{ organization.organization_admin?.email || 'N/A' }}</p>
            <p><span class="font-semibold text-slate-700">Admin Status:</span> {{ organization.organization_admin?.status || 'N/A' }}</p>
            <p><span class="font-semibold text-slate-700">Created:</span> {{ organization.created_at || 'N/A' }}</p>
          </div>
        </article>
      </section>
    </template>
  </section>
</template>
