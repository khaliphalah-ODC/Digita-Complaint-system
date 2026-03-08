<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import { useSessionStore } from '../../stores/session';
import { useUiToastStore } from '../../stores/uiToast';

const session = useSessionStore();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const escalations = ref([]);
const accessments = ref([]);
const users = ref([]);
const editingId = ref(null);
const search = ref('');
const statusFilter = ref('all');
const statusOptions = ['pending', 'in_progress', 'resolved', 'rejected'];
const levelOptions = ['level_1', 'level_2', 'level_3'];
const page = ref(1);
const pageSize = 8;
const uiToast = useUiToastStore();

const form = reactive({
  accessment_id: '',
  escalated_by: '',
  assigned_to: '',
  escalation_level: 'level_1',
  reason: '',
  notes: '',
  status: 'pending',
  resolved_at: ''
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const resetForm = () => {
  editingId.value = null;
  form.accessment_id = '';
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
    const [escalationRes, accessmentRes, userRes] = await Promise.all([
      api.get('/escalations'),
      api.get('/accessments'),
      api.get('/users')
    ]);
    escalations.value = ensureSuccess(unwrapResponse(escalationRes), 'Failed to fetch escalations') || [];
    accessments.value = ensureSuccess(unwrapResponse(accessmentRes), 'Failed to fetch accessments') || [];
    users.value = ensureSuccess(unwrapResponse(userRes), 'Failed to fetch users') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch escalations');
  } finally {
    loading.value = false;
  }
};

const startEdit = (row) => {
  editingId.value = row.id;
  form.accessment_id = String(row.accessment_id ?? '');
  form.escalated_by = String(row.escalated_by ?? (session.currentUser?.id || ''));
  form.assigned_to = row.assigned_to ? String(row.assigned_to) : '';
  form.escalation_level = row.escalation_level || 'level_1';
  form.reason = row.reason || '';
  form.notes = row.notes || '';
  form.status = row.status || 'pending';
  form.resolved_at = row.resolved_at || '';
};

const saveEscalation = async () => {
  if (!form.accessment_id || !form.reason.trim()) {
    error.value = 'accessment_id and reason are required.';
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    const payload = {
      accessment_id: Number(form.accessment_id),
      escalated_by: Number(form.escalated_by),
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      escalation_level: form.escalation_level,
      reason: form.reason.trim(),
      notes: form.notes.trim() || null,
      status: form.status,
      resolved_at: form.resolved_at || null
    };

    if (editingId.value) {
      await api.put(`/escalations/${editingId.value}`, payload);
      uiToast.success('Escalation updated successfully.');
    } else {
      await api.post('/escalations', payload);
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
    await api.delete(`/escalations/${row.id}`);
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
    await api.patch(`/escalations/${row.id}/status`, {
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

const accessmentTitleById = computed(() => {
  const map = new Map();
  for (const row of accessments.value) {
    map.set(Number(row.id), row.complaint_title || `Accessment #${row.id}`);
  }
  return map;
});

const userNameById = computed(() => {
  const map = new Map();
  for (const row of users.value) map.set(Number(row.id), row.full_name || row.email || `User #${row.id}`);
  return map;
});

const adminUsers = computed(() => users.value.filter((row) => row.role === 'admin'));

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
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Escalation Management</h1>
        <p class="text-sm text-slate-600">Track escalation levels, ownership, and resolution progress.</p>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="fetchEscalations">
        Refresh
      </button>
    </header>
    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold text-slate-900">{{ editingId ? 'Edit Escalation' : 'Create Escalation' }}</h2>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="saveEscalation">
        <select v-model="form.accessment_id" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Select accessment</option>
          <option v-for="row in accessments" :key="row.id" :value="String(row.id)">
            #{{ row.id }} - {{ row.complaint_title || row.findings?.slice(0, 40) || 'Accessment' }}
          </option>
        </select>
        <select v-model="form.escalated_by" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option :value="String(session.currentUser?.id || '')">
            {{ session.currentUser?.full_name || 'Current User' }} (#{{ session.currentUser?.id || 'N/A' }})
          </option>
        </select>
        <select v-model="form.assigned_to" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Assigned to admin (optional)</option>
          <option v-for="row in adminUsers" :key="`assigned-${row.id}`" :value="String(row.id)">
            {{ row.full_name }} (#{{ row.id }})
          </option>
        </select>
        <select v-model="form.escalation_level" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option v-for="level in levelOptions" :key="level" :value="level">{{ level }}</option>
        </select>
        <select v-model="form.status" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
        </select>
        <input v-model="form.resolved_at" placeholder="resolved_at (ISO or datetime, optional)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <textarea v-model="form.reason" placeholder="Reason" class="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows="2" />
        <textarea v-model="form.notes" placeholder="Notes (optional)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows="2" />
        <div class="flex gap-2">
          <button :disabled="saving" type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            {{ saving ? 'Saving...' : editingId ? 'Update Escalation' : 'Create Escalation' }}
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
        <h2 class="text-lg font-bold text-slate-900">Escalations</h2>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model="search" placeholder="Search reason/notes..." class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <select v-model="statusFilter" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All status</option>
            <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>
      </div>

      <p v-if="loading" class="text-sm text-slate-500">Loading escalations...</p>
      <p v-else-if="filteredEscalations.length === 0" class="text-sm text-slate-500">No escalations found.</p>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="text-slate-500">
            <tr>
              <th class="pb-2 pr-3">ID</th>
              <th class="pb-2 pr-3">Accessment</th>
              <th class="pb-2 pr-3">Level</th>
              <th class="pb-2 pr-3">Status</th>
              <th class="pb-2 pr-3">Assigned To</th>
              <th class="pb-2 pr-3">Updated</th>
              <th class="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginatedEscalations" :key="row.id" class="border-t border-slate-100">
              <td class="py-2 pr-3">#{{ row.id }}</td>
              <td class="py-2 pr-3">{{ accessmentTitleById.get(Number(row.accessment_id)) || row.accessment_id }}</td>
              <td class="py-2 pr-3">{{ row.escalation_level }}</td>
              <td class="py-2 pr-3">{{ row.status }}</td>
              <td class="py-2 pr-3">{{ userNameById.get(Number(row.assigned_to)) || row.assigned_to || 'N/A' }}</td>
              <td class="py-2 pr-3">{{ row.updated_at || row.created_at }}</td>
              <td class="py-2">
                <div class="flex gap-2">
                  <button class="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700" @click="startEdit(row)">Edit</button>
                  <button
                    v-if="row.status !== 'resolved'"
                    class="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                    @click="markResolvedNow(row)"
                  >
                    Resolve
                  </button>
                  <button class="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" @click="deleteEscalation(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredEscalations.length > 0" class="mt-3 flex items-center justify-between text-xs text-slate-600">
        <p>Showing {{ paginatedEscalations.length }} of {{ filteredEscalations.length }} escalations</p>
        <div class="flex items-center gap-2">
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
          <span>Page {{ currentPage }} / {{ totalPages }}</span>
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>
    </section>
  </section>
</template>
