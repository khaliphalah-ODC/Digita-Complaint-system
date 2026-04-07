<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { assessmentsApi, authApi, escalationsApi, extractApiError } from '../../services/api';
import MobileDataCardList from '../../components/MobileDataCardList.vue';
import DataTable from '../../components/ui/DataTable.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import FormField from '../../components/ui/FormField.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { useSessionStore } from '../../stores/session';
import { useUiToastStore } from '../../stores/uiToast';

const session = useSessionStore();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const escalations = ref([]);
const assessments = ref([]);
const users = ref([]);
const editingId = ref(null);
const search = ref('');
const statusFilter = ref('all');
const statusOptions = ['pending', 'in_progress', 'resolved', 'rejected'];
const levelOptions = ['level_1', 'level_2', 'level_3'];
const page = ref(1);
const pageSize = 8;
const uiToast = useUiToastStore();
const isOrgAdmin = computed(() => session.currentUser?.role === 'org_admin');
const titleClass = computed(() => (isOrgAdmin.value ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-slate-900'));
const metaClass = computed(() => (isOrgAdmin.value ? 'text-sm text-white/70' : 'text-sm text-slate-600'));
const panelClass = computed(() => (isOrgAdmin.value ? 'org-admin-panel-card' : 'rounded-2xl border border-slate-200 bg-white p-4'));
const inputClass = computed(() => (isOrgAdmin.value ? 'org-admin-input' : 'rounded-lg border border-slate-300 px-3 py-2 text-sm'));
const selectClass = computed(() => (isOrgAdmin.value ? 'org-admin-select' : 'rounded-lg border border-slate-300 px-3 py-2 text-sm'));
const refreshButtonClass = computed(() => (isOrgAdmin.value ? 'org-admin-outline-btn' : 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700'));
const primaryButtonClass = computed(() => (isOrgAdmin.value ? 'org-admin-btn disabled:opacity-70' : 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white'));
const secondaryButtonClass = computed(() => (isOrgAdmin.value ? 'org-admin-outline-btn' : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700'));
const tableClass = computed(() => (isOrgAdmin.value ? 'org-admin-table org-admin-table-responsive min-w-full text-left text-sm' : 'app-table-responsive min-w-full text-left text-sm'));
const tableHeadClass = computed(() => (isOrgAdmin.value ? 'text-white/60' : 'text-slate-500'));
const tableRowClass = computed(() => (isOrgAdmin.value ? 'border-t border-white/10' : 'border-t border-slate-100'));
const infoTextClass = computed(() => (isOrgAdmin.value ? 'text-sm text-white/70' : 'text-sm text-slate-500'));
const footerClass = computed(() => (isOrgAdmin.value ? 'mt-3 flex items-center justify-between text-xs text-white/70' : 'mt-3 flex items-center justify-between text-xs text-slate-600'));
const pagerButtonClass = computed(() => (isOrgAdmin.value ? 'rounded border border-white/20 bg-white/10 px-2 py-1 text-white disabled:opacity-50' : 'rounded border border-slate-300 px-2 py-1 disabled:opacity-50'));
const editButtonClass = computed(() => (isOrgAdmin.value ? 'rounded bg-white/10 px-2 py-1 text-xs font-semibold text-white' : 'rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700'));
const resolveButtonClass = computed(() => (isOrgAdmin.value ? 'rounded bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-100' : 'rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700'));
const deleteButtonClass = computed(() => (isOrgAdmin.value ? 'app-btn-danger min-h-[30px] px-2 py-1 text-xs' : 'rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700'));

const form = reactive({
  assessment_id: '',
  escalated_by: '',
  assigned_to: '',
  escalation_level: 'level_1',
  reason: '',
  notes: '',
  status: 'pending',
  resolved_at: ''
});

const resetForm = () => {
  editingId.value = null;
  form.assessment_id = '';
  form.escalated_by = String(session.currentUser?.id || '');
  form.assigned_to = '';
  form.escalation_level = 'level_1';
  form.reason = '';
  form.notes = '';
  form.status = 'pending';
  form.resolved_at = '';
};

const fetchEscalations = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [escalationRows, assessmentRows, userRows] = await Promise.all([
      escalationsApi.list(),
      assessmentsApi.list(),
      authApi.listUsers()
    ]);
    escalations.value = escalationRows || [];
    assessments.value = assessmentRows || [];
    users.value = userRows || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch escalations');
  } finally {
    loading.value = false;
  }
};

const startEdit = (row) => {
  editingId.value = row.id;
  form.assessment_id = String(row.assessment_id ?? '');
  form.escalated_by = String(row.escalated_by ?? (session.currentUser?.id || ''));
  form.assigned_to = row.assigned_to ? String(row.assigned_to) : '';
  form.escalation_level = row.escalation_level || 'level_1';
  form.reason = row.reason || '';
  form.notes = row.notes || '';
  form.status = row.status || 'pending';
  form.resolved_at = row.resolved_at ? String(row.resolved_at).slice(0, 16) : '';
};

watch(() => form.status, (nextStatus) => {
  if (nextStatus !== 'resolved') {
    form.resolved_at = '';
  }
});

const saveEscalation = async () => {
  if (!form.assessment_id || !form.reason.trim()) {
    error.value = 'assessment_id and reason are required.';
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    const payload = {
      assessment_id: Number(form.assessment_id),
      escalated_by: Number(form.escalated_by),
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      escalation_level: form.escalation_level,
      reason: form.reason.trim(),
      notes: form.notes.trim() || null,
      status: form.status,
      resolved_at: form.status === 'resolved' ? (form.resolved_at || null) : null
    };

    if (editingId.value) {
      await escalationsApi.update(editingId.value, payload);
      uiToast.success('Escalation updated successfully.');
    } else {
      await escalationsApi.create(payload);
      uiToast.success('Escalation created successfully.');
    }

    resetForm();
    await fetchEscalations();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save escalation');
    uiToast.error(error.value);
  } finally {
    saving.value = false;
  }
};

const deleteEscalation = async (row) => {
  const ok = window.confirm(`Delete escalation #${row.id}?`);
  if (!ok) return;
  error.value = '';
  try {
    await escalationsApi.remove(row.id);
    uiToast.success('Escalation deleted successfully.');
    await fetchEscalations();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete escalation');
    uiToast.error(error.value);
  }
};

const markResolvedNow = async (row) => {
  error.value = '';
  try {
    await escalationsApi.updateStatus(row.id, {
      status: 'resolved',
      resolved_at: new Date().toISOString()
    });
    uiToast.success('Escalation marked as resolved.');
    await fetchEscalations();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to mark escalation resolved');
    uiToast.error(error.value);
  }
};

const assessmentTitleById = computed(() => {
  const map = new Map();
  for (const row of assessments.value) {
    map.set(Number(row.id), row.complaint_title || `Assessment #${row.id}`);
  }
  return map;
});

const userNameById = computed(() => {
  const map = new Map();
  for (const row of users.value) map.set(Number(row.id), row.full_name || row.email || `User #${row.id}`);
  return map;
});

const adminUsers = computed(() => users.value.filter((row) => row.role === 'org_admin'));

const filteredEscalations = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return escalations.value.filter((row) => {
    const matchesText =
      !keyword ||
      String(row.reason || '').toLowerCase().includes(keyword) ||
      String(row.notes || '').toLowerCase().includes(keyword);
    const matchesStatus = statusFilter.value === 'all' || row.status === statusFilter.value;
    return matchesText && matchesStatus;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredEscalations.value.length / pageSize)));
const currentPage = computed(() => Math.min(page.value, totalPages.value));
const paginatedEscalations = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredEscalations.value.slice(start, start + pageSize);
});
const mobileCardFields = [
  { key: 'id', label: 'ID' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'level', label: 'Level' },
  { key: 'status', label: 'Status' },
  { key: 'assigned', label: 'Assigned To' },
  { key: 'updated', label: 'Updated' }
];
const tableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'level', label: 'Level' },
  { key: 'status', label: 'Status' },
  { key: 'assigned', label: 'Assigned To' },
  { key: 'updated', label: 'Updated' },
  { key: 'actions', label: 'Actions' }
];
const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

onMounted(async () => {
  if (!session.currentUser) await session.fetchCurrentUser();
  resetForm();
  await fetchEscalations();
});
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 :class="titleClass">Escalation Management</h1>
        <p :class="metaClass">
          {{ isOrgAdmin ? 'Track escalation levels, ownership, and resolution progress in your organization.' : 'Track escalation levels, ownership, and resolution progress.' }}
        </p>
      </div>
      <button :class="`${refreshButtonClass} w-full sm:w-auto`" @click="fetchEscalations">
        Refresh
      </button>
    </header>
    <section :class="panelClass">
      <h2 :class="isOrgAdmin ? 'mb-3 text-lg font-bold text-white' : 'mb-3 text-lg font-bold text-slate-900'">{{ editingId ? 'Edit Escalation' : 'Create Escalation' }}</h2>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="saveEscalation">
        <FormField v-model="form.assessment_id" as="select" label="Assessment" :input-class="selectClass">
          <template #options>
            <option value="">Select assessment</option>
            <option v-for="row in assessments" :key="row.id" :value="String(row.id)">
              #{{ row.id }} - {{ row.complaint_title || row.findings?.slice(0, 40) || 'Assessment' }}
            </option>
          </template>
        </FormField>
        <FormField v-model="form.escalated_by" as="select" label="Escalated By" :input-class="selectClass">
          <template #options>
            <option :value="String(session.currentUser?.id || '')">
              {{ session.currentUser?.full_name || 'Current User' }} (#{{ session.currentUser?.id || 'N/A' }})
            </option>
          </template>
        </FormField>
        <FormField v-model="form.assigned_to" as="select" label="Assigned To" :input-class="selectClass">
          <template #options>
            <option value="">Assigned to admin (optional)</option>
            <option v-for="row in adminUsers" :key="`assigned-${row.id}`" :value="String(row.id)">
              {{ row.full_name }} (#{{ row.id }})
            </option>
          </template>
        </FormField>
        <FormField v-model="form.escalation_level" as="select" label="Escalation Level" :options="levelOptions" :input-class="selectClass" />
        <FormField v-model="form.status" as="select" label="Status" :options="statusOptions" :input-class="selectClass" />
        <FormField
          v-model="form.resolved_at"
          label="Resolved At"
          type="datetime-local"
          :disabled="form.status !== 'resolved'"
          :help="form.status === 'resolved' ? 'Optional. Leave blank to let the system use the current time.' : 'Available only when the escalation status is resolved.'"
          :input-class="inputClass"
        />
        <FormField v-model="form.reason" as="textarea" label="Reason" placeholder="Reason" :input-class="inputClass" wrapper-class="md:col-span-2" :rows="2" />
        <FormField v-model="form.notes" as="textarea" label="Notes" placeholder="Notes (optional)" :input-class="inputClass" wrapper-class="md:col-span-2" :rows="2" />
        <div class="flex flex-col gap-2 sm:flex-row">
          <button :disabled="saving" type="submit" :class="`${primaryButtonClass} w-full sm:w-auto`">
            {{ saving ? 'Saving...' : editingId ? 'Update Escalation' : 'Create Escalation' }}
          </button>
          <button type="button" :class="`${secondaryButtonClass} w-full sm:w-auto`" @click="resetForm">
            Clear
          </button>
        </div>
      </form>
      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
    </section>

    <section :class="panelClass">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 :class="isOrgAdmin ? 'text-lg font-bold text-white' : 'text-lg font-bold text-slate-900'">Escalations</h2>
        <div class="flex flex-col gap-2 sm:flex-row">
          <FormField v-model="search" placeholder="Search reason/notes..." :input-class="`${inputClass} w-full sm:min-w-[14rem]`" />
          <FormField v-model="statusFilter" as="select" :input-class="`${selectClass} w-full sm:min-w-[11rem]`">
            <template #options>
              <option value="all">All status</option>
              <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
            </template>
          </FormField>
        </div>
      </div>

      <LoadingSpinner v-if="loading" label="Loading escalations..." :label-class="infoTextClass" />
      <EmptyState
        v-else-if="filteredEscalations.length === 0"
        title="No escalations found."
        description="Create an escalation or widen the current search."
        :title-class="isOrgAdmin ? 'font-semibold text-white' : 'font-semibold text-[var(--app-title-color)]'"
        :description-class="infoTextClass"
      />

      <MobileDataCardList
        v-else
        :items="paginatedEscalations"
        :fields="mobileCardFields"
        key-field="id"
      >
        <template #field-id="{ item }">
          <p class="font-medium text-[var(--app-title-color)]">#{{ item.id }}</p>
        </template>
        <template #field-assessment="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ assessmentTitleById.get(Number(item.assessment_id)) || item.assessment_id }}</p>
        </template>
        <template #field-level="{ item }">
          <p class="font-medium text-[var(--app-title-color)]">{{ item.escalation_level }}</p>
        </template>
        <template #field-status="{ item }">
          <StatusBadge :value="item.status" />
        </template>
        <template #field-assigned="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ userNameById.get(Number(item.assigned_to)) || item.assigned_to || 'N/A' }}</p>
        </template>
        <template #field-updated="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ item.updated_at || item.created_at }}</p>
        </template>
        <template #actions="{ item }">
          <div class="app-action-row flex flex-wrap gap-2">
            <button :class="editButtonClass" @click="startEdit(item)">Edit</button>
            <button
              v-if="item.status !== 'resolved'"
              :class="resolveButtonClass"
              @click="markResolvedNow(item)"
            >
              Resolve
            </button>
            <button :class="deleteButtonClass" @click="deleteEscalation(item)">Delete</button>
          </div>
        </template>
      </MobileDataCardList>

      <DataTable
        :columns="tableColumns"
        :rows="paginatedEscalations"
        :page="currentPage"
        :total-pages="totalPages"
        :total-items="filteredEscalations.length"
        :visible-count="paginatedEscalations.length"
        pagination-label="escalations"
        :table-class="tableClass"
        shell-class="app-table-shell overflow-x-auto pb-1"
        :footer-class="`${footerClass} flex-col gap-2 sm:flex-row`"
        :pager-button-class="pagerButtonClass"
        @update:page="goToPage"
      >
        <template #cell-id="{ row }">
          <span :class="isOrgAdmin ? 'text-white' : ''">#{{ row.id }}</span>
        </template>
        <template #cell-assessment="{ row }">
          <span :class="isOrgAdmin ? 'text-white/80' : ''">{{ assessmentTitleById.get(Number(row.assessment_id)) || row.assessment_id }}</span>
        </template>
        <template #cell-level="{ row }">
          <span :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.escalation_level }}</span>
        </template>
        <template #cell-status="{ row }">
          <StatusBadge :value="row.status" />
        </template>
        <template #cell-assigned="{ row }">
          <span :class="isOrgAdmin ? 'text-white/80' : ''">{{ userNameById.get(Number(row.assigned_to)) || row.assigned_to || 'N/A' }}</span>
        </template>
        <template #cell-updated="{ row }">
          <span :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.updated_at || row.created_at }}</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="app-action-row flex flex-wrap gap-2">
            <button :class="editButtonClass" @click="startEdit(row)">Edit</button>
            <button
              v-if="row.status !== 'resolved'"
              :class="resolveButtonClass"
              @click="markResolvedNow(row)"
            >
              Resolve
            </button>
            <button :class="deleteButtonClass" @click="deleteEscalation(row)">Delete</button>
          </div>
        </template>
      </DataTable>
    </section>
      </div>
    </div>
  </section>
</template>
