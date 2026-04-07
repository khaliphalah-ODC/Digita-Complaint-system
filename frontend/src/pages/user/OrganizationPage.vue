<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { extractApiError, organizationsApi } from '../../services/api';
import EmptyState from '../../components/ui/EmptyState.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { useSessionStore } from '../../stores/session.js';

const session = useSessionStore();
const loading = ref(false);
const error = ref('');
const organizations = ref([]);
const joinCode = ref(null);
const joinCodeError = ref('');
const joinCodeLoading = ref(false);
const joinCodeDownloading = ref(false);
const joinCodeCopying = ref(false);
const joinLinkCopying = ref(false);

const fetchOrganizations = async () => {
  loading.value = true;
  error.value = '';
  try {
    organizations.value = await organizationsApi.list() || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch organization');
  } finally {
    loading.value = false;
  }
};

const myOrganization = computed(() => organizations.value[0] || null);
const hasOrganization = computed(() => !!myOrganization.value);
const isUserWorkspace = computed(() => session.currentUser?.role === 'user');
const isOrgAdmin = computed(() => session.currentUser?.role === 'org_admin');
const panelClass = computed(() => (isUserWorkspace.value ? 'user-shell-panel rounded-[30px] p-5' : 'app-footer-panel rounded-[30px] p-5'));
const cardClass = computed(() => (isUserWorkspace.value ? 'user-shell-card rounded-[24px] p-4' : 'app-footer-card rounded-[24px] p-4'));
const refreshButtonClass = computed(() => (isUserWorkspace.value ? 'app-btn-secondary' : 'app-btn-secondary'));

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
  if (!myOrganization.value?.organization_id) return;
  joinCodeLoading.value = true;
  joinCodeError.value = '';
  try {
    joinCode.value = await organizationsApi.regenerateJoinCode(myOrganization.value.organization_id);
  } catch (requestError) {
    joinCodeError.value = extractApiError(requestError, 'Failed to regenerate join code');
  } finally {
    joinCodeLoading.value = false;
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
    const orgName = String(myOrganization.value?.name || 'organization').trim().replace(/\s+/g, '-');
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

onMounted(fetchOrganizations);

watch(
  () => [myOrganization.value?.organization_id, isOrgAdmin.value],
  ([organizationId, orgAdmin]) => {
    if (orgAdmin && organizationId) {
      fetchJoinCode(organizationId);
    }
  },
  { immediate: true }
);
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="app-kicker">Organization Profile</p>
        <h1 class="mt-2 text-3xl font-semibold text-slate-900">My Organization</h1>
        <p class="text-[0.98rem] text-slate-600">Users can only create and view their own organization profile.</p>
      </div>
      <button :class="refreshButtonClass" @click="fetchOrganizations">
        Refresh
      </button>
    </header>

    <ErrorState
      v-if="error"
      title="Unable to load organization"
      :description="error"
    />
    <LoadingSpinner
      v-if="loading"
      label="Loading organization..."
      wrapper-class="app-section-card"
    />

    <EmptyState
      v-if="!loading && !hasOrganization"
      :container-class="panelClass"
      title="Organization unavailable"
      description="Organization creation is managed from the super-admin workspace. This page is read-only for regular users."
    />

    <section v-else-if="!loading && hasOrganization" :class="panelClass">
      <h2 class="text-xl font-semibold text-[var(--app-primary-ink)]">Organization Detail</h2>
      <p class="mt-1 text-[0.98rem] text-[var(--app-muted-color)]">This is your organization record.</p>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div :class="cardClass">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Name</p>
          <p class="mt-1 text-base font-semibold text-[var(--app-primary-ink)]">{{ myOrganization.name }}</p>
        </div>
        <div :class="cardClass">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Type</p>
          <p class="mt-1 text-base font-semibold text-[var(--app-primary-ink)]">{{ myOrganization.organization_type || '-' }}</p>
        </div>
        <div :class="cardClass">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Email</p>
          <p class="mt-1 text-base font-semibold text-[var(--app-primary-ink)]">{{ myOrganization.email || '-' }}</p>
        </div>
        <div :class="cardClass">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Phone</p>
          <p class="mt-1 text-base font-semibold text-[var(--app-primary-ink)]">{{ myOrganization.phone || '-' }}</p>
        </div>
        <div :class="`${cardClass} md:col-span-2`">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Address</p>
          <p class="mt-1 text-base font-semibold text-[var(--app-primary-ink)]">{{ myOrganization.address || '-' }}</p>
        </div>
      </div>

      <div class="app-action-row mt-4 flex flex-wrap gap-2">
        <StatusBadge :value="`ID: ${myOrganization.organization_id}`" tone="neutral" />
        <StatusBadge :value="myOrganization.status || 'active'" />
        <StatusBadge :value="`Complaints: ${myOrganization.complaints_count ?? 0}`" tone="neutral" />
      </div>

      <section v-if="isOrgAdmin" class="mt-6 app-section-card">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="app-kicker">Invite Access</p>
            <h3 class="app-section-title">Organization Join Code</h3>
            <p class="app-section-description">Share this code or QR to invite members into your organization.</p>
          </div>
          <button class="app-btn-secondary" :disabled="joinCodeLoading" @click="regenerateJoinCode">
            {{ joinCodeLoading ? 'Refreshing...' : 'Regenerate Code' }}
          </button>
        </div>

        <ErrorState
          v-if="joinCodeError"
          class="mt-3"
          title="Unable to load join code"
          :description="joinCodeError"
        />

        <div class="mt-4 grid gap-4 md:grid-cols-[1.1fr,0.9fr]">
          <div class="app-card p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Join Code</p>
            <p class="mt-2 text-2xl font-semibold text-[var(--app-primary-ink)]">
              {{ joinCodeLoading ? 'Loading...' : (joinCode?.join_code || 'Not available') }}
            </p>
            <p class="mt-2 text-sm text-[var(--app-muted-color)]">
              {{ joinCode?.join_url || 'Join link will appear here once the code is ready.' }}
            </p>
            <div class="app-action-row mt-3 flex flex-wrap gap-2">
              <button
                class="app-btn-secondary"
                :disabled="!joinCode?.join_code || joinCodeCopying"
                @click="copyJoinCode"
              >
                {{ joinCodeCopying ? 'Copying...' : 'Copy Code' }}
              </button>
              <button
                class="app-btn-secondary"
                :disabled="!joinCode?.join_url || joinLinkCopying"
                @click="copyJoinLink"
              >
                {{ joinLinkCopying ? 'Copying...' : 'Copy Link' }}
              </button>
            </div>
          </div>

          <div class="app-card p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">QR Code</p>
            <div class="mt-3 flex flex-col items-start gap-3">
              <img
                v-if="joinCode?.join_qr_url"
                :src="joinCode.join_qr_url"
                alt="Organization join QR"
                class="h-32 w-32 rounded border border-[var(--app-line)] bg-white p-2"
              />
              <p v-else class="text-sm text-[var(--app-muted-color)]">
                QR code will appear once the join code is generated.
              </p>
              <button
                class="app-btn-secondary"
                :disabled="!joinCode?.join_qr_url || joinCodeDownloading"
                @click="downloadJoinQr"
              >
                {{ joinCodeDownloading ? 'Downloading...' : 'Download QR' }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  </section>
</template>
