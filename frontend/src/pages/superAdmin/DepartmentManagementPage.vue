<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import { useUiToastStore } from '../../stores/uiToast';
import { useSessionStore } from '../../stores/session';

const session = useSessionStore();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const departments = ref([]);
const organizations = ref([]);
const accessments = ref([]);
const editingId = ref(null);
const search = ref('');
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
const tableClass = computed(() => (isOrgAdmin.value ? 'org-admin-table min-w-full text-left text-sm' : 'min-w-full text-left text-sm'));
const tableHeadClass = computed(() => (isOrgAdmin.value ? 'text-white/60' : 'text-slate-500'));
const tableRowClass = computed(() => (isOrgAdmin.value ? 'border-t border-white/10' : 'border-t border-slate-100'));
const infoTextClass = computed(() => (isOrgAdmin.value ? 'text-sm text-white/70' : 'text-sm text-slate-500'));
const footerClass = computed(() => (isOrgAdmin.value ? 'mt-3 flex items-center justify-between text-xs text-white/70' : 'mt-3 flex items-center justify-between text-xs text-slate-600'));
const pagerButtonClass = computed(() => (isOrgAdmin.value ? 'rounded border border-white/20 bg-white/10 px-2 py-1 text-white disabled:opacity-50' : 'rounded border border-slate-300 px-2 py-1 disabled:opacity-50'));
const editButtonClass = computed(() => (isOrgAdmin.value ? 'rounded bg-white/10 px-2 py-1 text-xs font-semibold text-white' : 'rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700'));
const deleteButtonClass = computed(() => (isOrgAdmin.value ? 'rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-100' : 'rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700'));

const form = reactive({
  organization_id: '',
  name: '',
  description: '',
  accessment_id: ''
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const resetForm = () => {
  editingId.value = null;
  form.organization_id = isOrgAdmin.value ? String(session.currentUser?.organization_id || '') : '';
  form.name = '';
  form.description = '';
  form.accessment_id = '';
};

const fetchDependencies = async () => {
  const [orgRes, accessmentRes] = await Promise.all([api.get('/organization'), api.get('/accessments')]);
  organizations.value = ensureSuccess(unwrapResponse(orgRes), 'Failed to fetch organizations') || [];
  accessments.value = ensureSuccess(unwrapResponse(accessmentRes), 'Failed to fetch accessments') || [];
};

const fetchDepartments = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/department');
    departments.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch departments') || [];
    await fetchDependencies();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch departments');
  } finally {
    loading.value = false;
  }
};

const startEdit = (row) => {
  editingId.value = row.id;
  form.organization_id = String(row.organization_id ?? '');
  form.name = row.name || '';
  form.description = row.description || '';
  form.accessment_id = String(row.accessment_id ?? '');
};

const saveDepartment = async () => {
  if (!form.organization_id || !form.name.trim()) {
    error.value = 'organization_id and name are required.';
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    const payload = {
      organization_id: Number(form.organization_id),
      name: form.name.trim(),
      description: form.description.trim() || null,
      accessment_id: form.accessment_id ? Number(form.accessment_id) : null
    };

    if (editingId.value) {
      await api.put(`/department/${editingId.value}`, payload);
      uiToast.success('Department updated successfully.');
    } else {
      await api.post('/department', payload);
      uiToast.success('Department created successfully.');
    }

    resetForm();
    await fetchDepartments();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save department');
    uiToast.error(error.value);
  } finally {
    saving.value = false;
  }
};

const deleteDepartment = async (row) => {
  const ok = window.confirm(`Delete department "${row.name}"?`);
  if (!ok) return;
  error.value = '';
  try {
    await api.delete(`/department/${row.id}`);
    uiToast.success('Department deleted successfully.');
    await fetchDepartments();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete department');
    uiToast.error(error.value);
  }
};

const organizationNameById = computed(() => {
  const map = new Map();
  for (const row of organizations.value) map.set(Number(row.organization_id), row.name);
  return map;
});

const filteredDepartments = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return departments.value;
  return departments.value.filter((row) => {
    return (
      String(row.name || '').toLowerCase().includes(keyword) ||
      String(row.description || '').toLowerCase().includes(keyword) ||
      String(organizationNameById.value.get(Number(row.organization_id)) || '')
        .toLowerCase()
        .includes(keyword)
    );
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredDepartments.value.length / pageSize)));
const currentPage = computed(() => Math.min(page.value, totalPages.value));
const paginatedDepartments = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredDepartments.value.slice(start, start + pageSize);
});
const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

onMounted(fetchDepartments);
onMounted(async () => {
  if (!session.currentUser) await session.fetchCurrentUser();
  resetForm();
});
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 :class="titleClass">Department Management</h1>
        <p :class="metaClass">
          {{ isOrgAdmin ? 'Create, update, and delete departments inside your organization.' : 'Create, update, and delete departments linked to organizations.' }}
        </p>
      </div>
      <button :class="`${refreshButtonClass} w-full sm:w-auto`" @click="fetchDepartments">
        Refresh
      </button>
    </header>
    <section :class="panelClass">
      <h2 :class="isOrgAdmin ? 'mb-3 text-lg font-bold text-white' : 'mb-3 text-lg font-bold text-slate-900'">{{ editingId ? 'Edit Department' : 'Create Department' }}</h2>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="saveDepartment">
        <select v-if="!isOrgAdmin" v-model="form.organization_id" :class="selectClass">
          <option value="">Select organization</option>
          <option v-for="row in organizations" :key="row.organization_id" :value="String(row.organization_id)">
            {{ row.name }} (#{{ row.organization_id }})
          </option>
        </select>
        <div v-else :class="isOrgAdmin ? 'flex items-center rounded-[18px] border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/80' : 'flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600'">
          Organization ID: {{ session.currentUser?.organization_id || 'N/A' }}
        </div>
        <input v-model="form.name" placeholder="Department name" :class="inputClass">
        <textarea v-model="form.description" placeholder="Description (optional)" :class="`${inputClass} md:col-span-2`" rows="2" />
        <select v-model="form.accessment_id" :class="selectClass">
          <option value="">Link accessment (optional)</option>
          <option v-for="row in accessments" :key="row.id" :value="String(row.id)">
            #{{ row.id }} - {{ row.complaint_title || row.findings?.slice(0, 40) || 'Accessment' }}
          </option>
        </select>
        <div class="flex flex-col gap-2 sm:flex-row">
          <button :disabled="saving" type="submit" :class="`${primaryButtonClass} w-full sm:w-auto`">
            {{ saving ? 'Saving...' : editingId ? 'Update Department' : 'Create Department' }}
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
        <h2 :class="isOrgAdmin ? 'text-lg font-bold text-white' : 'text-lg font-bold text-slate-900'">Departments</h2>
        <input v-model="search" placeholder="Search departments..." :class="`${inputClass} w-full md:max-w-sm`">
      </div>

      <p v-if="loading" :class="infoTextClass">Loading departments...</p>
      <p v-else-if="filteredDepartments.length === 0" :class="infoTextClass">No departments found.</p>

      <div v-else class="-mx-1 overflow-x-auto pb-1">
        <table :class="tableClass">
          <thead :class="tableHeadClass">
            <tr>
              <th class="pb-2 pr-3">Name</th>
              <th class="pb-2 pr-3">Organization</th>
              <th class="pb-2 pr-3">Accessment</th>
              <th class="pb-2 pr-3">Created</th>
              <th class="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginatedDepartments" :key="row.id" :class="tableRowClass">
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white' : ''">{{ row.name }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ organizationNameById.get(Number(row.organization_id)) || row.organization_id }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.accessment_id ?? 'N/A' }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.created_at }}</td>
              <td class="py-2">
                <div class="flex flex-wrap gap-2">
                  <button :class="editButtonClass" @click="startEdit(row)">Edit</button>
                  <button :class="deleteButtonClass" @click="deleteDepartment(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredDepartments.length > 0" :class="`${footerClass} flex-col gap-2 sm:flex-row`">
        <p>Showing {{ paginatedDepartments.length }} of {{ filteredDepartments.length }} departments</p>
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button :class="pagerButtonClass" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
          <span>Page {{ currentPage }} / {{ totalPages }}</span>
          <button :class="pagerButtonClass" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>
    </section>
  </section>
</template>
