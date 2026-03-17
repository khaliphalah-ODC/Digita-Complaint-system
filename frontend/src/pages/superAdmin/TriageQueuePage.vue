<script setup>
import { computed, onMounted, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import PageHeader from '../../components/superAdmin/PageHeader.vue';

const loading = ref(false);
const assigningId = ref(null);
const error = ref('');
const organizations = ref([]);
const unassignedComplaints = ref([]);
const triageAssignments = ref({});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const fetchOrganizations = async () => {
  const response = await api.get('/organization');
  organizations.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch organizations') || [];
};

const fetchUnassignedComplaints = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.get('/complaint/unassigned');
    const rows = ensureSuccess(unwrapResponse(response), 'Failed to fetch unassigned complaints') || [];
    unassignedComplaints.value = rows;

    const nextAssignments = {};
    for (const row of rows) {
      nextAssignments[row.id] = '';
    }
    triageAssignments.value = nextAssignments;
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch unassigned complaints');
  } finally {
    loading.value = false;
  }
};

const assignComplaint = async (row) => {
  const organizationId = Number(triageAssignments.value[row.id] || 0);
  if (!organizationId) {
    error.value = 'Select an organization before assigning the complaint.';
    return;
  }

  assigningId.value = row.id;
  error.value = '';

  try {
    await api.patch(`/complaint/${row.id}/assign-organization`, {
      organization_id: organizationId
    });
    await Promise.all([fetchOrganizations(), fetchUnassignedComplaints()]);
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to assign complaint');
  } finally {
    assigningId.value = null;
  }
};

const triageSummary = computed(() => ({
  total: unassignedComplaints.value.length,
  activeOrganizations: organizations.value.filter((item) => String(item.status).toLowerCase() === 'active').length,
  urgent: unassignedComplaints.value.filter((item) => String(item.priority).toLowerCase() === 'urgent').length,
  anonymous: unassignedComplaints.value.filter((item) => Number(item.is_anonymous || 0) === 1).length
}));

onMounted(async () => {
  await Promise.all([fetchOrganizations(), fetchUnassignedComplaints()]);
});
</script>

<template>
  <section class="app-dark-stage w-full space-y-5 rounded-[34px] p-4 sm:p-6">
    <PageHeader
      theme="dark"
      kicker="Complaint Routing"
      title="Triage Queue"
      description="Assign anonymous complaints that were submitted without an organization so they can enter the correct tenant workflow."
    >
      <template #actions>
        <button class="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/84" @click="fetchUnassignedComplaints">
          Refresh Queue
        </button>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Unassigned</p>
        <p class="mt-2 text-3xl font-black text-white">{{ triageSummary.total }}</p>
        <p class="text-sm text-white/58">Complaints still waiting to be routed.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Active Organizations</p>
        <p class="mt-2 text-3xl font-black text-emerald-300">{{ triageSummary.activeOrganizations }}</p>
        <p class="text-sm text-white/58">Available destinations for complaint assignment.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Urgent</p>
        <p class="mt-2 text-3xl font-black text-blue-200">{{ triageSummary.urgent }}</p>
        <p class="text-sm text-white/58">Queue items marked with urgent priority.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Anonymous</p>
        <p class="mt-2 text-3xl font-black text-blue-200">{{ triageSummary.anonymous }}</p>
        <p class="text-sm text-white/58">Anonymous complaints currently visible in the queue.</p>
      </article>
    </section>

    <section class="app-dark-panel rounded-[30px] p-5">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-lg font-bold text-white">Unassigned Anonymous Complaints</h2>
          <p class="text-sm text-white/58">Choose the correct active organization for each complaint so it can move into the normal review flow.</p>
        </div>
      </div>

      <p v-if="loading" class="text-sm text-white/58">Loading unassigned complaints...</p>
      <p v-else-if="error" class="text-sm text-red-400">{{ error }}</p>
      <p v-else-if="unassignedComplaints.length === 0" class="text-sm text-white/58">No unassigned anonymous complaints.</p>

      <div v-else class="space-y-3">
        <article
          v-for="row in unassignedComplaints"
          :key="row.id"
          class="rounded-[24px] border border-white/8 bg-white/[0.04] p-4"
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-bold text-white">{{ row.title || 'Untitled Complaint' }}</h3>
                <span class="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/68">{{ row.priority || 'medium' }}</span>
              </div>
              <p class="text-sm text-white/72">{{ row.complaint }}</p>
              <p class="text-xs text-white/46">Tracking: {{ row.tracking_code || 'N/A' }}</p>
              <p class="text-xs text-white/46">Reporter: {{ row.anonymous_label || 'Anonymous Reporter' }}</p>
            </div>

            <div class="w-full max-w-sm space-y-2">
              <select
                v-model="triageAssignments[row.id]"
                class="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white"
              >
                <option value="">Select organization</option>
                <option
                  v-for="organization in organizations.filter((item) => String(item.status).toLowerCase() === 'active')"
                  :key="organization.organization_id"
                  :value="organization.organization_id"
                >
                  {{ organization.name }}
                </option>
              </select>
              <button
                :disabled="assigningId === row.id || !triageAssignments[row.id]"
                class="rounded-full bg-[linear-gradient(90deg,#163462_0%,#1f4db7_58%,#4f8df7_100%)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                @click="assignComplaint(row)"
              >
                {{ assigningId === row.id ? 'Assigning...' : 'Assign to Organization' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
