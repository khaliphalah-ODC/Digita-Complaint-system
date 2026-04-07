<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { extractApiError, organizationsApi } from '../../services/api.js';
import PageHeader from '../../components/superAdmin/PageHeader.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const organization = ref(null);
const joinCode = ref(null);
const joinCodeLoading = ref(false);
const joinCodeError = ref('');
const joinCodeCopying = ref(false);
const joinLinkCopying = ref(false);
const joinCodeDownloading = ref(false);

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

const fetchJoinCode = async (organizationId) => {
  if (!organizationId) return;
  joinCodeLoading.value = true;
  joinCodeError.value = '';
  try {
    joinCode.value = await organizationsApi.getJoinCode(organizationId);
  } catch (requestError) {
    joinCodeError.value = extractApiError(requestError, 'Failed to fetch join code');
  } finally {
    joinCodeLoading.value = false;
  }
};

const regenerateJoinCode = async () => {
  if (!organization.value?.organization_id) return;
  joinCodeLoading.value = true;
  joinCodeError.value = '';
  try {
    joinCode.value = await organizationsApi.regenerateJoinCode(organization.value.organization_id);
  } catch (requestError) {
    joinCodeError.value = extractApiError(requestError, 'Failed to regenerate join code');
  } finally {
    joinCodeLoading.value = false;
  }
};

const copyJoinCode = async () => {
  if (!joinCode.value?.join_code) return;
  joinCodeCopying.value = true;
  joinCodeError.value = '';
  try {
    await navigator.clipboard.writeText(joinCode.value.join_code);
  } catch (requestError) {
    joinCodeError.value = extractApiError(requestError, 'Failed to copy join code');
  } finally {
    joinCodeCopying.value = false;
  }
};

const copyJoinLink = async () => {
  if (!joinCode.value?.join_url) return;
  joinLinkCopying.value = true;
  joinCodeError.value = '';
  try {
    await navigator.clipboard.writeText(joinCode.value.join_url);
  } catch (requestError) {
    joinCodeError.value = extractApiError(requestError, 'Failed to copy join link');
  } finally {
    joinLinkCopying.value = false;
  }
};

const downloadJoinQr = async () => {
  if (!joinCode.value?.join_qr_url) return;
  joinCodeDownloading.value = true;
  joinCodeError.value = '';
  try {
    const response = await fetch(joinCode.value.join_qr_url);
    if (!response.ok) {
      throw new Error(`QR download failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const orgName = String(organization.value?.name || 'organization').trim().replace(/\s+/g, '-');
    link.href = url;
    link.download = `${orgName}-join-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (requestError) {
    joinCodeError.value = extractApiError(requestError, 'Failed to download QR code');
  } finally {
    joinCodeDownloading.value = false;
  }
};

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const orgId = route.params.id;
    organization.value = await organizationsApi.getById(orgId);
    await fetchJoinCode(orgId);
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
          <div class="flex min-w-0 items-start gap-4">
            <img
              v-if="organization.logo"
              :src="organization.logo"
              alt="Organization Logo"
              class="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
            >
            <div v-else class="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg font-semibold text-blue-700">ORG</div>

            <div class="min-w-0">
              <h2 class="break-words text-2xl font-semibold text-slate-900">{{ organization.name }}</h2>
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

          <article class="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p class="text-xs font-medium text-slate-500">Primary admin contact</p>
            <p class="mt-2 break-words text-base font-semibold text-slate-900">{{ organization.organization_admin?.full_name || 'Not assigned' }}</p>
            <p class="mt-1 break-words text-sm text-slate-600">{{ organization.organization_admin?.email || 'No admin email available' }}</p>
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
              <p class="mt-2 break-words text-sm font-semibold text-slate-900">{{ item.value }}</p>
            </article>
          </div>
            </article>

            <article class="app-section-card">
          <h3 class="text-lg font-semibold text-slate-900">Contact and location</h3>
          <div class="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p class="font-medium text-slate-900">Address</p>
              <p class="mt-1 break-words">{{ organization.address || 'No address available' }}</p>
            </div>
            <div>
              <p class="font-medium text-slate-900">Organization email</p>
              <p class="mt-1 break-words">{{ organization.email || 'N/A' }}</p>
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

          <section class="app-section-card">
            <h3 class="text-lg font-semibold text-slate-900">Administrator assignment</h3>
            <p class="mt-1 text-sm text-slate-600">Current organization-admin coverage for this directory record.</p>
            <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <article class="rounded-xl border border-slate-200 p-4">
                <p class="text-sm font-medium text-slate-500">Organization admin</p>
                <p class="mt-2 break-words text-sm font-semibold text-slate-900">{{ organization.organization_admin?.full_name || 'Not assigned' }}</p>
              </article>
              <article class="rounded-xl border border-slate-200 p-4">
                <p class="text-sm font-medium text-slate-500">Admin email</p>
                <p class="mt-2 break-words text-sm font-semibold text-slate-900">{{ organization.organization_admin?.email || 'N/A' }}</p>
              </article>
              <article class="rounded-xl border border-slate-200 p-4">
                <p class="text-sm font-medium text-slate-500">Admin status</p>
                <p class="mt-2 text-sm font-semibold text-slate-900">{{ organization.organization_admin?.status || 'N/A' }}</p>
              </article>
            </div>
          </section>

          <section class="app-section-card">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Invite Access</h3>
                <p class="mt-1 text-sm text-slate-600">Review or regenerate the organization join code and QR for org-admin invitations.</p>
              </div>
              <button class="app-btn-secondary" :disabled="joinCodeLoading" @click="regenerateJoinCode">
                {{ joinCodeLoading ? 'Refreshing...' : 'Regenerate Code' }}
              </button>
            </div>

            <p v-if="joinCodeError" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ joinCodeError }}
            </p>

            <div class="mt-4 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <article class="min-w-0 rounded-xl border border-slate-200 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Join Code</p>
                <p class="mt-2 break-all text-2xl font-semibold text-slate-900">
                  {{ joinCodeLoading ? 'Loading...' : (joinCode?.join_code || 'Not available') }}
                </p>
                <p class="mt-2 break-all text-sm text-slate-600">
                  {{ joinCode?.join_url || 'Join link will appear here once the code is ready.' }}
                </p>
                <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button class="app-btn-secondary w-full sm:w-auto" :disabled="!joinCode?.join_code || joinCodeCopying" @click="copyJoinCode">
                    {{ joinCodeCopying ? 'Copying...' : 'Copy Code' }}
                  </button>
                  <button class="app-btn-secondary w-full sm:w-auto" :disabled="!joinCode?.join_url || joinLinkCopying" @click="copyJoinLink">
                    {{ joinLinkCopying ? 'Copying...' : 'Copy Link' }}
                  </button>
                </div>
              </article>

              <article class="rounded-xl border border-slate-200 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">QR Code</p>
                <div class="mt-3 flex flex-col items-center gap-3 sm:items-start">
                  <img
                    v-if="joinCode?.join_qr_url"
                    :src="joinCode.join_qr_url"
                    alt="Organization join QR"
                    class="h-40 w-40 rounded-xl border border-slate-200 bg-white p-3"
                  >
                  <p v-else class="text-sm text-slate-600">
                    QR code will appear once the join code is generated.
                  </p>
                  <button class="app-btn-secondary w-full sm:w-auto" :disabled="!joinCode?.join_qr_url || joinCodeDownloading" @click="downloadJoinQr">
                    {{ joinCodeDownloading ? 'Downloading...' : 'Download QR' }}
                  </button>
                </div>
              </article>
            </div>
          </section>
        </template>
      </div>
    </div>
  </section>
</template>
