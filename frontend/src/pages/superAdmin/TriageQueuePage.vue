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
      nextAssignments[row.id] = triageAssignments.value[row.id] || '';
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

const activeOrganizations = computed(() => organizations.value.filter((item) => String(item.status).toLowerCase() === 'active'));
const triageSummary = computed(() => ({
  total: unassignedComplaints.value.length,
  activeOrganizations: activeOrganizations.value.length,
  urgent: unassignedComplaints.value.filter((item) => String(item.priority).toLowerCase() === 'urgent').length,
  anonymous: unassignedComplaints.value.filter((item) => Number(item.is_anonymous || 0) === 1).length
}));

const priorityClass = (priority) => {
  const value = String(priority || '').toLowerCase();
  if (value === 'urgent') return 'bg-red-50 text-red-700';
  if (value === 'high') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};

onMounted(async () => {
  await Promise.all([fetchOrganizations(), fetchUnassignedComplaints()]);
});
</script>

<template>
  <section class="space-y-6 bg-slate-50 p-4 sm:p-6">
    <PageHeader
      title="Triage Queue"
      description="Assign anonymous complaints to the correct organization so they can enter the normal review flow."
    >
      <template #actions>
        <button class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="fetchUnassignedComplaints">
          Refresh
        </button>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Waiting in queue</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ triageSummary.total }}</p>
        <p class="mt-2 text-sm text-slate-600">Complaints still waiting for organization assignment.</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Active organizations</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ triageSummary.activeOrganizations }}</p>
        <p class="mt-2 text-sm text-slate-600">Available destinations for routing.</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Urgent complaints</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ triageSummary.urgent }}</p>
        <p class="mt-2 text-sm text-slate-600">Queue items marked with urgent priority.</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Anonymous</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ triageSummary.anonymous }}</p>
        <p class="mt-2 text-sm text-slate-600">Complaints submitted without a visible reporter identity.</p>
      </article>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-slate-900">Queue Items</h2>
        <p class="mt-1 text-sm text-slate-600">Review each complaint summary, choose the destination organization, and assign it into the main workflow.</p>
      </div>

      <p v-if="loading" class="text-sm text-slate-500">Loading unassigned complaints...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="unassignedComplaints.length === 0" class="text-sm text-slate-500">No unassigned anonymous complaints.</p>

      <div v-else class="space-y-3">
        <article
          v-for="row in unassignedComplaints"
          :key="row.id"
          class="rounded-xl border border-slate-200 p-4"
        >
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr,0.8fr]">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-semibold text-slate-900">{{ row.title || 'Untitled Complaint' }}</h3>
                <span class="inline-flex rounded-lg px-2.5 py-1 text-xs font-medium" :class="priorityClass(row.priority)">
                  {{ row.priority || 'medium' }}
                </span>
              </div>
              <p class="mt-2 text-sm text-slate-600">{{ row.complaint }}</p>

              <div class="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <p class="font-medium text-slate-900">Tracking code</p>
                  <p class="mt-1">{{ row.tracking_code || 'N/A' }}</p>
                </div>
                <div>
                  <p class="font-medium text-slate-900">Reporter</p>
                  <p class="mt-1">{{ row.anonymous_label || 'Anonymous Reporter' }}</p>
                </div>
                <div>
                  <p class="font-medium text-slate-900">Complaint ID</p>
                  <p class="mt-1">{{ row.id }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label class="mb-2 block text-sm font-medium text-slate-700">Assign organization</label>
              <select
                v-model="triageAssignments[row.id]"
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="">Select organization</option>
                <option
                  v-for="organization in activeOrganizations"
                  :key="organization.organization_id"
                  :value="organization.organization_id"
                >
                  {{ organization.name }}
                </option>
              </select>

              <button
                :disabled="assigningId === row.id || !triageAssignments[row.id]"
                class="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                @click="assignComplaint(row)"
              >
                {{ assigningId === row.id ? 'Assigning...' : 'Assign complaint' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
