<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../services/api.js';
import PageHeader from '../../components/superAdmin/PageHeader.vue';

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
  <section class="app-dark-stage w-full space-y-5 rounded-[34px] p-4 sm:p-6">
    <PageHeader
      theme="dark"
      kicker="Profile View"
      title="Organization Detail"
      description="Organization profile, status, and assigned admin information."
    >
      <template #actions>
        <button class="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/84" @click="load">Refresh</button>
        <button class="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/84" @click="exportSnapshotPdf">Export Snapshot (PDF)</button>
        <button class="rounded-full bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--app-primary-ink)]" @click="router.push('/admin/organizations')">Back</button>
      </template>
    </PageHeader>

    <p v-if="loading" class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/62">Loading organization detail...</p>
    <p v-else-if="error" class="rounded-2xl border border-red-400/30 bg-red-500/12 px-4 py-3 text-sm text-red-100">{{ error }}</p>

    <template v-else-if="organization">
      <section class="app-dark-panel rounded-[30px] p-6 text-white">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4">
            <img
              v-if="organization.logo"
              :src="organization.logo"
              alt="Organization Logo"
              class="h-16 w-16 rounded-full border border-white/12 object-cover"
            >
            <div v-else class="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-lg font-bold text-blue-100">ORG</div>
            <div>
              <h2 class="text-2xl font-black text-white">{{ organization.name }}</h2>
              <div class="mt-1 flex flex-wrap gap-2">
                <span class="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/84">ID: {{ organization.organization_id }}</span>
                <span class="rounded-full bg-blue-200 px-3 py-1 text-xs font-semibold text-[var(--app-primary-ink)]">{{ organization.organization_type }}</span>
                <span class="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">{{ organization.status }}</span>
              </div>
            </div>
          </div>

          <article class="rounded-[24px] border border-white/10 bg-white/[0.05] px-4 py-4 text-right">
            <p class="text-xs uppercase tracking-wide text-white/46">Assigned Org Admin</p>
            <p class="mt-1 text-lg font-bold text-white">{{ organization.organization_admin?.full_name || 'Not assigned' }}</p>
            <p class="text-xs text-white/58">{{ organization.organization_admin?.email || 'No admin email' }}</p>
          </article>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article class="app-dark-panel rounded-[28px] p-5 text-white">
          <h3 class="text-lg font-bold text-white">Contact & Location</h3>
          <div class="mt-3 grid grid-cols-1 gap-3 text-sm text-white/74">
            <p><span class="font-semibold text-white/92">Email:</span> {{ organization.email || 'N/A' }}</p>
            <p><span class="font-semibold text-white/92">Phone:</span> {{ organization.phone || 'N/A' }}</p>
            <p><span class="font-semibold text-white/92">Address:</span> {{ organization.address || 'N/A' }}</p>
            <a :href="mapUrl" target="_blank" rel="noopener noreferrer" class="inline-block w-max rounded-full bg-blue-200 px-4 py-2 text-xs font-semibold text-[var(--app-primary-ink)] hover:bg-white">
              View on Map
            </a>
          </div>
        </article>

        <article class="app-dark-panel rounded-[28px] p-5 text-white">
          <h3 class="text-lg font-bold text-white">Admin Assignment</h3>
          <div class="mt-3 grid grid-cols-1 gap-3 text-sm text-white/74">
            <p><span class="font-semibold text-white/92">Organization Admin:</span> {{ organization.organization_admin?.full_name || 'Not assigned' }}</p>
            <p><span class="font-semibold text-white/92">Admin Email:</span> {{ organization.organization_admin?.email || 'N/A' }}</p>
            <p><span class="font-semibold text-white/92">Admin Status:</span> {{ organization.organization_admin?.status || 'N/A' }}</p>
            <p><span class="font-semibold text-white/92">Created:</span> {{ organization.created_at || 'N/A' }}</p>
          </div>
        </article>
      </section>
    </template>
  </section>
</template>
