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
        <h1 class="text-2xl font-bold text-slate-900">Department Management</h1>
        <p class="text-sm text-slate-600">
          {{ isOrgAdmin ? 'Create, update, and delete departments inside your organization.' : 'Create, update, and delete departments linked to organizations.' }}
        </p>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="fetchDepartments">
        Refresh
      </button>
    </header>
    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold text-slate-900">{{ editingId ? 'Edit Department' : 'Create Department' }}</h2>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="saveDepartment">
        <select v-if="!isOrgAdmin" v-model="form.organization_id" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Select organization</option>
          <option v-for="row in organizations" :key="row.organization_id" :value="String(row.organization_id)">
            {{ row.name }} (#{{ row.organization_id }})
          </option>
        </select>
        <div v-else class="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Organization ID: {{ session.currentUser?.organization_id || 'N/A' }}
        </div>
        <input v-model="form.name" placeholder="Department name" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <textarea v-model="form.description" placeholder="Description (optional)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows="2" />
        <select v-model="form.accessment_id" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Link accessment (optional)</option>
          <option v-for="row in accessments" :key="row.id" :value="String(row.id)">
            #{{ row.id }} - {{ row.complaint_title || row.findings?.slice(0, 40) || 'Accessment' }}
          </option>
        </select>
        <div class="flex gap-2">
          <button :disabled="saving" type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            {{ saving ? 'Saving...' : editingId ? 'Update Department' : 'Create Department' }}
          </button>
          <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" @click="resetForm">
            Clear
          </button>
        </div>
      </form>
      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-bold text-slate-900">Departments</h2>
        <input v-model="search" placeholder="Search departments..." class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
      </div>

      <p v-if="loading" class="text-sm text-slate-500">Loading departments...</p>
      <p v-else-if="filteredDepartments.length === 0" class="text-sm text-slate-500">No departments found.</p>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="text-slate-500">
            <tr>
              <th class="pb-2 pr-3">Name</th>
              <th class="pb-2 pr-3">Organization</th>
              <th class="pb-2 pr-3">Accessment</th>
              <th class="pb-2 pr-3">Created</th>
              <th class="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginatedDepartments" :key="row.id" class="border-t border-slate-100">
              <td class="py-2 pr-3">{{ row.name }}</td>
              <td class="py-2 pr-3">{{ organizationNameById.get(Number(row.organization_id)) || row.organization_id }}</td>
              <td class="py-2 pr-3">{{ row.accessment_id ?? 'N/A' }}</td>
              <td class="py-2 pr-3">{{ row.created_at }}</td>
              <td class="py-2">
                <div class="flex gap-2">
                  <button class="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700" @click="startEdit(row)">Edit</button>
                  <button class="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" @click="deleteDepartment(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredDepartments.length > 0" class="mt-3 flex items-center justify-between text-xs text-slate-600">
        <p>Showing {{ paginatedDepartments.length }} of {{ filteredDepartments.length }} departments</p>
        <div class="flex items-center gap-2">
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
          <span>Page {{ currentPage }} / {{ totalPages }}</span>
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>
    </section>
  </section>
</template>
