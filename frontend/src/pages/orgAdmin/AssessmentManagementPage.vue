<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import MobileDataCardList from '../../components/MobileDataCardList.vue';
import { useSessionStore } from '../../stores/session';
import { useUiToastStore } from '../../stores/uiToast';

const session = useSessionStore();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const assessments = ref([]);
const complaints = ref([]);
const editingId = ref(null);
const search = ref('');
const statusFilter = ref('all');
const statusOptions = ['pending', 'in_review', 'completed', 'rejected'];
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
const deleteButtonClass = computed(() => (isOrgAdmin.value ? 'app-btn-danger min-h-[30px] px-2 py-1 text-xs' : 'rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700'));

const form = reactive({
  complaint_id: '',
  findings: '',
  recommendation: '',
  status: 'pending',
  admin_response: ''
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const resetForm = () => {
  editingId.value = null;
  form.complaint_id = '';
  form.findings = '';
  form.recommendation = '';
  form.status = 'pending';
  form.admin_response = '';
};

const fetchAssessments = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [assessmentRes, complaintRes] = await Promise.all([api.get('/assessments'), api.get('/complaint')]);
    assessments.value = ensureSuccess(unwrapResponse(assessmentRes), 'Failed to fetch assessments') || [];
    complaints.value = ensureSuccess(unwrapResponse(complaintRes), 'Failed to fetch complaints') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch assessments');
  } finally {
    loading.value = false;
  }
};

const startEdit = (row) => {
  editingId.value = row.id;
  form.complaint_id = String(row.complaint_id ?? '');
  form.findings = row.findings || '';
  form.recommendation = row.recommendation || '';
  form.status = row.status || 'pending';
  form.admin_response = row.admin_response || '';
};

const saveAssessment = async () => {
  if (!form.complaint_id || !form.findings.trim()) {
    error.value = 'complaint_id and findings are required.';
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    const payload = {
      complaint_id: Number(form.complaint_id),
      findings: form.findings.trim(),
      recommendation: form.recommendation.trim() || null,
      status: form.status,
      admin_response: form.admin_response.trim() || null
    };

    if (editingId.value) {
      await api.put(`/assessments/${editingId.value}`, payload);
      uiToast.success('Assessment updated successfully.');
    } else {
      await api.post('/assessments', payload);
      uiToast.success('Assessment created successfully.');
    }

    resetForm();
    await fetchAssessments();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save assessment');
    uiToast.error(error.value);
  } finally {
    saving.value = false;
  }
};

const deleteAssessment = async (row) => {
  const ok = window.confirm(`Delete assessment #${row.id}?`);
  if (!ok) return;
  error.value = '';
  try {
    await api.delete(`/assessments/${row.id}`);
      uiToast.success('Assessment deleted successfully.');
    await fetchAssessments();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete assessment');
    uiToast.error(error.value);
  }
};

const complaintTitleById = computed(() => {
  const map = new Map();
  for (const row of complaints.value) map.set(Number(row.id), row.title);
  return map;
});

const filteredAssessments = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return assessments.value.filter((row) => {
    const matchesText =
      !keyword ||
      String(row.findings || '').toLowerCase().includes(keyword) ||
      String(row.recommendation || '').toLowerCase().includes(keyword) ||
      String(complaintTitleById.value.get(Number(row.complaint_id)) || '')
        .toLowerCase()
        .includes(keyword);
    const matchesStatus = statusFilter.value === 'all' || row.status === statusFilter.value;
    return matchesText && matchesStatus;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredAssessments.value.length / pageSize)));
const currentPage = computed(() => Math.min(page.value, totalPages.value));
const paginatedAssessments = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredAssessments.value.slice(start, start + pageSize);
});
const mobileCardFields = [
  { key: 'id', label: 'ID' },
  { key: 'complaint', label: 'Complaint' },
  { key: 'status', label: 'Status' },
  { key: 'assessor', label: 'Assessor' },
  { key: 'updated', label: 'Updated' }
];
const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

onMounted(async () => {
  if (!session.currentUser) await session.fetchCurrentUser();
  await fetchAssessments();
});
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 :class="titleClass">Assessment Management</h1>
        <p :class="metaClass">Create and maintain complaint assessments and admin responses.</p>
      </div>
      <button :class="`${refreshButtonClass} w-full sm:w-auto`" @click="fetchAssessments">
        Refresh
      </button>
    </header>
    <section :class="panelClass">
      <h2 :class="isOrgAdmin ? 'mb-3 text-lg font-bold text-white' : 'mb-3 text-lg font-bold text-slate-900'">{{ editingId ? 'Edit Assessment' : 'Create Assessment' }}</h2>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="saveAssessment">
        <select v-model="form.complaint_id" :class="selectClass">
          <option value="">Select complaint</option>
          <option v-for="row in complaints" :key="row.id" :value="String(row.id)">
            #{{ row.id }} - {{ row.title || 'Untitled' }}
          </option>
        </select>
        <select v-model="form.status" :class="selectClass">
          <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
        </select>
        <textarea v-model="form.findings" placeholder="Findings" :class="`${inputClass} md:col-span-2`" rows="2" />
        <textarea v-model="form.recommendation" placeholder="Recommendation (optional)" :class="`${inputClass} md:col-span-2`" rows="2" />
        <textarea v-model="form.admin_response" placeholder="Admin response (optional)" :class="`${inputClass} md:col-span-2`" rows="2" />
        <div class="flex flex-col gap-2 sm:flex-row">
          <button :disabled="saving" type="submit" :class="`${primaryButtonClass} w-full sm:w-auto`">
            {{ saving ? 'Saving...' : editingId ? 'Update Assessment' : 'Create Assessment' }}
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
        <h2 :class="isOrgAdmin ? 'text-lg font-bold text-white' : 'text-lg font-bold text-slate-900'">Assessments</h2>
        <div class="flex flex-col gap-2 sm:flex-row md:w-auto">
          <input v-model="search" placeholder="Search assessments..." :class="`${inputClass} w-full sm:min-w-[14rem]`">
          <select v-model="statusFilter" :class="`${selectClass} w-full sm:min-w-[11rem]`">
            <option value="all">All status</option>
            <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>
      </div>

      <p v-if="loading" :class="infoTextClass">Loading assessments...</p>
      <p v-else-if="filteredAssessments.length === 0" :class="infoTextClass">No assessments found.</p>

      <MobileDataCardList
        v-else
        :items="paginatedAssessments"
        :fields="mobileCardFields"
        key-field="id"
      >
        <template #field-id="{ item }">
          <p class="font-medium text-[var(--app-title-color)]">#{{ item.id }}</p>
        </template>
        <template #field-complaint="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ item.complaint_title || complaintTitleById.get(Number(item.complaint_id)) || item.complaint_id }}</p>
        </template>
        <template #field-status="{ item }">
          <p class="font-medium text-[var(--app-title-color)]">{{ item.status }}</p>
        </template>
        <template #field-assessor="{ item }">
          <p class="font-medium text-[var(--app-title-color)]">{{ item.assessor_id || 'N/A' }}</p>
        </template>
        <template #field-updated="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ item.updated_at || item.created_at }}</p>
        </template>
        <template #actions="{ item }">
          <div class="app-action-row flex flex-wrap gap-2">
            <button :class="editButtonClass" @click="startEdit(item)">Edit</button>
            <button :class="deleteButtonClass" @click="deleteAssessment(item)">Delete</button>
          </div>
        </template>
      </MobileDataCardList>

      <div v-if="filteredAssessments.length > 0" class="hidden md:block app-table-shell overflow-x-auto pb-1">
        <table :class="tableClass">
          <thead :class="tableHeadClass">
            <tr>
              <th class="pb-2 pr-3">ID</th>
              <th class="pb-2 pr-3">Complaint</th>
              <th class="pb-2 pr-3">Status</th>
              <th class="pb-2 pr-3">Assessor</th>
              <th class="pb-2 pr-3">Updated</th>
              <th class="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginatedAssessments" :key="row.id" :class="tableRowClass">
              <td data-label="ID" class="py-2 pr-3" :class="isOrgAdmin ? 'text-white' : ''">#{{ row.id }}</td>
              <td data-label="Complaint" class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.complaint_title || complaintTitleById.get(Number(row.complaint_id)) || row.complaint_id }}</td>
              <td data-label="Status" class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.status }}</td>
              <td data-label="Assessor" class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.assessor_id || 'N/A' }}</td>
              <td data-label="Updated" class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.updated_at || row.created_at }}</td>
              <td data-label="Actions" data-actions="true" class="py-2">
                <div class="app-action-row flex flex-wrap gap-2">
                  <button :class="editButtonClass" @click="startEdit(row)">Edit</button>
                  <button :class="deleteButtonClass" @click="deleteAssessment(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredAssessments.length > 0" :class="`${footerClass} flex-col gap-2 sm:flex-row`">
        <p>Showing {{ paginatedAssessments.length }} of {{ filteredAssessments.length }} assessments</p>
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button :class="pagerButtonClass" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
          <span>Page {{ currentPage }} / {{ totalPages }}</span>
          <button :class="pagerButtonClass" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>
    </section>
      </div>
    </div>
  </section>
</template>
