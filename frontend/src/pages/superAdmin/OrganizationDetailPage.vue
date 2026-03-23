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

const infoRows = computed(() => {
  if (!organization.value) return [];

  return [
    { label: 'Organization ID', value: organization.value.organization_id || 'N/A' },
    { label: 'Type', value: organization.value.organization_type || 'N/A' },
    { label: 'Status', value: organization.value.status || 'N/A' },
    { label: 'Organization email', value: organization.value.email || 'N/A' },
    { label: 'Phone', value: organization.value.phone || 'N/A' },
    { label: 'Created', value: organization.value.created_at || 'N/A' }
  ];
});

const exportSnapshotPdf = () => {
  if (!organization.value) return;
  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Organization Snapshot</title></head>
  <body style="font-family: 'Times New Roman', Times, serif; padding: 24px;">
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
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <PageHeader
          title="Organization Detail"
          description="Structured overview of the organization record, directory information, and administrator assignment."
        >
          <template #actions>
            <button class="app-btn-secondary" @click="load">
              Refresh
            </button>
            <button class="app-btn-secondary" @click="exportSnapshotPdf">
              Export snapshot
            </button>
            <button class="app-btn-primary" @click="router.push('/admin/organizations')">
              Back to organizations
            </button>
          </template>
        </PageHeader>

        <p v-if="loading" class="app-section-card text-sm text-slate-500">Loading organization detail...</p>
        <p v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{{ error }}</p>

        <template v-else-if="organization">
          <section class="app-section-card">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex items-start gap-4">
            <img
              v-if="organization.logo"
              :src="organization.logo"
              alt="Organization Logo"
              class="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
            >
            <div v-else class="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg font-semibold text-blue-700">ORG</div>

            <div>
              <h2 class="text-2xl font-semibold text-slate-900">{{ organization.name }}</h2>
              <p class="mt-1 text-sm text-slate-600">Platform directory record used for routing coverage, oversight, and org-admin assignment.</p>

              <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <article class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-xs font-medium text-slate-500">Status</p>
                  <p class="mt-2 text-sm font-semibold text-slate-900">{{ organization.status || 'N/A' }}</p>
                </article>
                <article class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-xs font-medium text-slate-500">Type</p>
                  <p class="mt-2 text-sm font-semibold text-slate-900">{{ organization.organization_type || 'N/A' }}</p>
                </article>
                <article class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-xs font-medium text-slate-500">Assigned org-admin</p>
                  <p class="mt-2 text-sm font-semibold text-slate-900">{{ organization.organization_admin?.full_name || 'Not assigned' }}</p>
                </article>
              </div>
            </div>
          </div>

          <article class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p class="text-xs font-medium text-slate-500">Primary admin contact</p>
            <p class="mt-2 text-base font-semibold text-slate-900">{{ organization.organization_admin?.full_name || 'Not assigned' }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ organization.organization_admin?.email || 'No admin email available' }}</p>
          </article>
        </div>
          </section>

          <section class="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <article class="app-section-card">
          <h3 class="text-lg font-semibold text-slate-900">Directory summary</h3>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <article
              v-for="item in infoRows"
              :key="item.label"
              class="rounded-xl border border-slate-200 p-4"
            >
              <p class="text-sm font-medium text-slate-500">{{ item.label }}</p>
              <p class="mt-2 text-sm font-semibold text-slate-900">{{ item.value }}</p>
            </article>
          </div>
            </article>

            <article class="app-section-card">
          <h3 class="text-lg font-semibold text-slate-900">Contact and location</h3>
          <div class="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p class="font-medium text-slate-900">Address</p>
              <p class="mt-1">{{ organization.address || 'No address available' }}</p>
            </div>
            <div>
              <p class="font-medium text-slate-900">Organization email</p>
              <p class="mt-1">{{ organization.email || 'N/A' }}</p>
            </div>
            <div>
              <p class="font-medium text-slate-900">Phone</p>
              <p class="mt-1">{{ organization.phone || 'N/A' }}</p>
            </div>
            <a
              :href="mapUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View on map
            </a>
          </div>
            </article>
          </section>

<<<<<<< Updated upstream
          <section class="app-section-card">
            <h3 class="text-lg font-semibold text-slate-900">Administrator assignment</h3>
            <p class="mt-1 text-sm text-slate-600">Current organization-admin coverage for this directory record.</p>
            <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <article class="rounded-xl border border-slate-200 p-4">
                <p class="text-sm font-medium text-slate-500">Organization admin</p>
                <p class="mt-2 text-sm font-semibold text-slate-900">{{ organization.organization_admin?.full_name || 'Not assigned' }}</p>
              </article>
              <article class="rounded-xl border border-slate-200 p-4">
                <p class="text-sm font-medium text-slate-500">Admin email</p>
                <p class="mt-2 text-sm font-semibold text-slate-900">{{ organization.organization_admin?.email || 'N/A' }}</p>
              </article>
              <article class="rounded-xl border border-slate-200 p-4">
                <p class="text-sm font-medium text-slate-500">Admin status</p>
                <p class="mt-2 text-sm font-semibold text-slate-900">{{ organization.organization_admin?.status || 'N/A' }}</p>
              </article>
            </div>
          </section>
        </template>
      </div>
    </div>
=======
        <article class="app-dark-panel rounded-[28px] p-5 text-white">
          <h3 class="text-lg font-bold text-white">Admin Assignment</h3>
          <div class="mt-3 grid grid-cols-1 gap-3 text-sm text-white/74">
            <p><span class="font-semibold text-white/92">Organization Admin:</span> {{ organization.organization_admin?.full_name || 'Not assigned' }}</p>
            <p><span class="font-semibold text-white/92">Admin Email:</span> {{ organization.organization_admin?.email || 'N/A' }}</p>
            <p><span class="font-semibold text-white/92">Admin Status:</span> {{ organization.organization_admin?.status || 'N/A' }}</p>
            <p><span class="font-semibold text-white/92">Created:</span> {{ organization.created_at || 'N/A' }}</p>
          </div>
        </article>

<!-- ADD THIS NEW CARD BELOW — spans full width -->
        <article class="app-dark-panel rounded-[28px] p-5 text-white md:col-span-2">
          <h3 class="text-lg font-bold text-white">Organization Join Code</h3>
          <p class="mt-1 text-sm text-white/60">
            Share this code with members so they can register under this organization at the Sign Up page.
          </p>
          <div class="mt-4 flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-5 py-3">
              <span class="font-mono text-xl font-black tracking-widest text-white">
                {{ organization.join_code || 'No code generated yet' }}
              </span>
            </div>
            <p v-if="organization.join_code_expires_at" class="text-xs text-white/50">
              Expires {{ new Date(organization.join_code_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
            </p>
          </div>
        </article>

      </section>
    </template>
>>>>>>> Stashed changes
  </section>
</template>
