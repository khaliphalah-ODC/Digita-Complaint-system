<script setup>
import { computed, onMounted, ref } from 'vue';
import { complaintsApi, extractApiError, organizationsApi } from '../../services/api';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import FormField from '../../components/ui/FormField.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';

const loading = ref(false);
const assigningId = ref(null);
const error = ref('');
const organizations = ref([]);
const unassignedComplaints = ref([]);
const triageAssignments = ref({});

const fetchOrganizations = async () => {
  organizations.value = await organizationsApi.list() || [];
};

const fetchUnassignedComplaints = async () => {
  loading.value = true;
  error.value = '';

  try {
    const rows = await complaintsApi.listUnassigned() || [];
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
    await complaintsApi.assignOrganization(row.id, {
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
  if (value === 'urgent' || value === 'high') return 'danger';
  if (value === 'medium') return 'warning';
  return 'neutral';
};

onMounted(async () => {
  await Promise.all([fetchOrganizations(), fetchUnassignedComplaints()]);
});
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <PageHeader
          title="Triage Queue"
          description="Assign anonymous complaints to the correct organization so they can enter the normal review flow."
        >
          <template #actions>
            <button class="app-btn-secondary" @click="fetchUnassignedComplaints">
              Refresh
            </button>
          </template>
        </PageHeader>

        <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="app-section-card">
        <p class="text-sm font-medium text-slate-500">Waiting in queue</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ triageSummary.total }}</p>
        <p class="mt-2 text-sm text-slate-600">Complaints still waiting for organization assignment.</p>
          </article>
          <article class="app-section-card">
        <p class="text-sm font-medium text-slate-500">Active organizations</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ triageSummary.activeOrganizations }}</p>
        <p class="mt-2 text-sm text-slate-600">Available destinations for routing.</p>
          </article>
          <article class="app-section-card">
        <p class="text-sm font-medium text-slate-500">Urgent complaints</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ triageSummary.urgent }}</p>
        <p class="mt-2 text-sm text-slate-600">Queue items marked with urgent priority.</p>
          </article>
          <article class="app-section-card">
        <p class="text-sm font-medium text-slate-500">Anonymous</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ triageSummary.anonymous }}</p>
        <p class="mt-2 text-sm text-slate-600">Complaints submitted without a visible reporter identity.</p>
          </article>
        </section>

        <section class="app-section-card">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-slate-900">Queue Items</h2>
            <p class="mt-1 text-sm text-slate-600">Review each complaint summary, choose the destination organization, and assign it into the main workflow.</p>
          </div>

          <LoadingSpinner v-if="loading" label="Loading unassigned complaints..." />
          <ErrorState v-else-if="error" title="Could not load triage queue" :description="error" />
          <EmptyState
            v-else-if="unassignedComplaints.length === 0"
            title="No unassigned anonymous complaints."
            description="New triage items will appear here when complaints need platform routing."
          />

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
                <StatusBadge :value="row.priority || 'medium'" :tone="priorityClass(row.priority)" />
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
              <FormField v-model="triageAssignments[row.id]" as="select" label="Assign organization">
                <template #options>
                  <option value="">Select organization</option>
                  <option
                    v-for="organization in activeOrganizations"
                    :key="organization.organization_id"
                    :value="organization.organization_id"
                  >
                    {{ organization.name }}
                  </option>
                </template>
              </FormField>

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
      </div>
    </div>
  </section>
</template>
