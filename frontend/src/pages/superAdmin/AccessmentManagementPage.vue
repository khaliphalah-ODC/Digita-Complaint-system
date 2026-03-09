<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import { useSessionStore } from '../../stores/session';
import { useUiToastStore } from '../../stores/uiToast';

const session = useSessionStore();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const accessments = ref([]);
const complaints = ref([]);
const editingId = ref(null);
const search = ref('');
const statusFilter = ref('all');
const statusOptions = ['pending', 'in_review', 'completed', 'rejected'];
const page = ref(1);
const pageSize = 8;
const uiToast = useUiToastStore();

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

const fetchAccessments = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [accessmentRes, complaintRes] = await Promise.all([api.get('/accessments'), api.get('/complaint')]);
    accessments.value = ensureSuccess(unwrapResponse(accessmentRes), 'Failed to fetch accessments') || [];
    complaints.value = ensureSuccess(unwrapResponse(complaintRes), 'Failed to fetch complaints') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch accessments');
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

const saveAccessment = async () => {
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
      await api.put(`/accessments/${editingId.value}`, payload);
      uiToast.success('Accessment updated successfully.');
    } else {
      await api.post('/accessments', payload);
      uiToast.success('Accessment created successfully.');
    }

    resetForm();
    await fetchAccessments();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save accessment');
    uiToast.error(error.value);
  } finally {
    saving.value = false;
  }
};

const deleteAccessment = async (row) => {
  const ok = window.confirm(`Delete accessment #${row.id}?`);
  if (!ok) return;
  error.value = '';
  try {
    await api.delete(`/accessments/${row.id}`);
    uiToast.success('Accessment deleted successfully.');
    await fetchAccessments();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete accessment');
    uiToast.error(error.value);
  }
};

const complaintTitleById = computed(() => {
  const map = new Map();
  for (const row of complaints.value) map.set(Number(row.id), row.title);
  return map;
});

const filteredAccessments = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return accessments.value.filter((row) => {
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

const totalPages = computed(() => Math.max(1, Math.ceil(filteredAccessments.value.length / pageSize)));
const currentPage = computed(() => Math.min(page.value, totalPages.value));
const paginatedAccessments = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredAccessments.value.slice(start, start + pageSize);
});
const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

onMounted(async () => {
  if (!session.currentUser) await session.fetchCurrentUser();
  await fetchAccessments();
});
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Accessment Management</h1>
        <p class="text-sm text-slate-600">Create and maintain complaint accessments and admin responses.</p>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="fetchAccessments">
        Refresh
      </button>
    </header>
    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold text-slate-900">{{ editingId ? 'Edit Accessment' : 'Create Accessment' }}</h2>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="saveAccessment">
        <select v-model="form.complaint_id" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Select complaint</option>
          <option v-for="row in complaints" :key="row.id" :value="String(row.id)">
            #{{ row.id }} - {{ row.title || 'Untitled' }}
          </option>
        </select>
        <select v-model="form.status" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
        </select>
        <textarea v-model="form.findings" placeholder="Findings" class="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows="2" />
        <textarea v-model="form.recommendation" placeholder="Recommendation (optional)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows="2" />
        <textarea v-model="form.admin_response" placeholder="Admin response (optional)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows="2" />
        <div class="flex gap-2">
          <button :disabled="saving" type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            {{ saving ? 'Saving...' : editingId ? 'Update Accessment' : 'Create Accessment' }}
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
        <h2 class="text-lg font-bold text-slate-900">Accessments</h2>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model="search" placeholder="Search accessments..." class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <select v-model="statusFilter" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All status</option>
            <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>
      </div>

      <p v-if="loading" class="text-sm text-slate-500">Loading accessments...</p>
      <p v-else-if="filteredAccessments.length === 0" class="text-sm text-slate-500">No accessments found.</p>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="text-slate-500">
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
            <tr v-for="row in paginatedAccessments" :key="row.id" class="border-t border-slate-100">
              <td class="py-2 pr-3">#{{ row.id }}</td>
              <td class="py-2 pr-3">{{ row.complaint_title || complaintTitleById.get(Number(row.complaint_id)) || row.complaint_id }}</td>
              <td class="py-2 pr-3">{{ row.status }}</td>
              <td class="py-2 pr-3">{{ row.assessor_id || 'N/A' }}</td>
              <td class="py-2 pr-3">{{ row.updated_at || row.created_at }}</td>
              <td class="py-2">
                <div class="flex gap-2">
                  <button class="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700" @click="startEdit(row)">Edit</button>
                  <button class="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" @click="deleteAccessment(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredAccessments.length > 0" class="mt-3 flex items-center justify-between text-xs text-slate-600">
        <p>Showing {{ paginatedAccessments.length }} of {{ filteredAccessments.length }} accessments</p>
        <div class="flex items-center gap-2">
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
          <span>Page {{ currentPage }} / {{ totalPages }}</span>
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>
    </section>
  </section>
</template>
