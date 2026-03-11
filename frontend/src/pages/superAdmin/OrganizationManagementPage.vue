<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import OrganizationCreateForm from '../../components/OrganizationCreateForm.vue';

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const triageLoading = ref(false);
const triageSavingId = ref(null);
const error = ref('');
const organizations = ref([]);
const unassignedComplaints = ref([]);
const resetKey = ref(0);
const search = ref('');
const editingId = ref(null);
const triageAssignments = ref({});

const editForm = reactive({
  name: '',
  organization_type: '',
  email: '',
  phone: '',
  address: '',
  logo: '',
  status: 'active'
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const fetchOrganizations = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/organization');
    organizations.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch organizations') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch organizations');
  } finally {
    loading.value = false;
  }
};

const fetchUnassignedComplaints = async () => {
  triageLoading.value = true;
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
    triageLoading.value = false;
  }
};

const createOrganization = async (payload) => {
  saving.value = true;
  error.value = '';
  try {
    await api.post('/organization', payload);
    resetKey.value += 1;
    await fetchOrganizations();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to create organization');
  } finally {
    saving.value = false;
  }
};

const startEdit = (row) => {
  editingId.value = row.organization_id;
  editForm.name = row.name || '';
  editForm.organization_type = row.organization_type || '';
  editForm.email = row.email || '';
  editForm.phone = row.phone || '';
  editForm.address = row.address || '';
  editForm.logo = row.logo || '';
  editForm.status = row.status || 'active';
};

const cancelEdit = () => {
  editingId.value = null;
};

const saveEdit = async (row) => {
  saving.value = true;
  error.value = '';
  try {
    await api.put(`/organization/${row.organization_id}`, {
      name: editForm.name.trim(),
      organization_type: editForm.organization_type.trim(),
      email: editForm.email.trim().toLowerCase(),
      phone: editForm.phone.trim() || null,
      address: editForm.address.trim(),
      logo: editForm.logo.trim() || null,
      status: editForm.status
    });
    cancelEdit();
    await fetchOrganizations();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to update organization');
  } finally {
    saving.value = false;
  }
};

const deleteOrganization = async (row) => {
  const ok = window.confirm(`Delete organization "${row.name}"?`);
  if (!ok) return;
  error.value = '';
  try {
    await api.delete(`/organization/${row.organization_id}`);
    await fetchOrganizations();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete organization');
  }
};

const assignComplaint = async (row) => {
  const organizationId = Number(triageAssignments.value[row.id] || 0);
  if (!organizationId) {
    error.value = 'Select an organization before assigning the complaint.';
    return;
  }

  triageSavingId.value = row.id;
  error.value = '';
  try {
    await api.patch(`/complaint/${row.id}/assign-organization`, {
      organization_id: organizationId
    });
    await Promise.all([fetchOrganizations(), fetchUnassignedComplaints()]);
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to assign complaint');
  } finally {
    triageSavingId.value = null;
  }
};

const filteredOrganizations = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return organizations.value;
  return organizations.value.filter((row) => {
    return (
      String(row.name || '').toLowerCase().includes(keyword) ||
      String(row.organization_type || '').toLowerCase().includes(keyword) ||
      String(row.email || '').toLowerCase().includes(keyword)
    );
  });
});

onMounted(async () => {
  await Promise.all([fetchOrganizations(), fetchUnassignedComplaints()]);
});
</script>

<template>
  <section class="w-full space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="app-kicker">Directory Operations</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-900">Organization Management</h1>
        <p class="text-sm text-slate-600">Admin CRUD for organization records.</p>
      </div>
      <button class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700" @click="fetchOrganizations">
        Refresh
      </button>
    </header>

    <OrganizationCreateForm :loading="saving" :show-status="true" :reset-key="resetKey" title="Create Organization (Admin)" @submit="createOrganization" />

    <section class="app-shell-panel rounded-[30px] p-5">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Unassigned Anonymous Complaints</h2>
          <p class="text-sm text-slate-600">Triage queue for anonymous complaints that were submitted without an organization.</p>
        </div>
        <button class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700" @click="fetchUnassignedComplaints">
          Refresh Triage
        </button>
      </div>

      <p v-if="triageLoading" class="text-sm text-slate-500">Loading unassigned complaints...</p>
      <p v-else-if="unassignedComplaints.length === 0" class="text-sm text-slate-500">No unassigned anonymous complaints.</p>

      <div v-else class="space-y-3">
        <article
          v-for="row in unassignedComplaints"
          :key="row.id"
          class="app-ink-card rounded-[24px] p-4"
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-1">
              <h3 class="text-base font-bold text-slate-900">{{ row.title || 'Untitled Complaint' }}</h3>
              <p class="text-sm text-slate-700">{{ row.complaint }}</p>
              <p class="text-xs text-slate-500">Tracking: {{ row.tracking_code || 'N/A' }}</p>
              <p class="text-xs text-slate-500">Reporter: {{ row.anonymous_label || 'Anonymous Reporter' }}</p>
            </div>

            <div class="w-full max-w-sm space-y-2">
              <select
                v-model="triageAssignments[row.id]"
                class="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm"
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
                :disabled="triageSavingId === row.id || !triageAssignments[row.id]"
                class="rounded-full bg-[var(--app-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                @click="assignComplaint(row)"
              >
                {{ triageSavingId === row.id ? 'Assigning...' : 'Assign to Organization' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="app-shell-panel rounded-[30px] p-5">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-bold text-slate-900">Organizations</h2>
        <input v-model="search" placeholder="Search organization..." class="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm">
      </div>

      <p v-if="loading" class="text-sm text-slate-500">Loading organizations...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="filteredOrganizations.length === 0" class="text-sm text-slate-500">No organizations found.</p>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="text-slate-500">
            <tr>
              <th class="pb-2 pr-3">Name</th>
              <th class="pb-2 pr-3">Type</th>
              <th class="pb-2 pr-3">Email</th>
              <th class="pb-2 pr-3">Organization Admin</th>
              <th class="pb-2 pr-3">Status</th>
              <th class="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredOrganizations" :key="row.organization_id" class="border-t border-slate-100">
              <template v-if="editingId === row.organization_id">
                <td class="py-2 pr-3"><input v-model="editForm.name" class="w-full rounded border border-slate-300 px-2 py-1"></td>
                <td class="py-2 pr-3"><input v-model="editForm.organization_type" class="w-full rounded border border-slate-300 px-2 py-1"></td>
                <td class="py-2 pr-3"><input v-model="editForm.email" class="w-full rounded border border-slate-300 px-2 py-1"></td>
                <td class="py-2 pr-3">{{ row.organization_admin?.full_name || 'Not assigned' }}</td>
                <td class="py-2 pr-3">
                  <select v-model="editForm.status" class="rounded border border-slate-300 px-2 py-1">
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </td>
                <td class="py-2">
                  <div class="flex gap-2">
                    <button :disabled="saving" class="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white" @click="saveEdit(row)">Save</button>
                    <button class="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700" @click="cancelEdit">Cancel</button>
                  </div>
                </td>
              </template>
              <template v-else>
                <td class="py-2 pr-3">{{ row.name }}</td>
                <td class="py-2 pr-3">{{ row.organization_type }}</td>
                <td class="py-2 pr-3">{{ row.email }}</td>
                <td class="py-2 pr-3">{{ row.organization_admin?.full_name || 'Not assigned' }}</td>
                <td class="py-2 pr-3">{{ row.status }}</td>
                <td class="py-2">
                  <div class="flex gap-2">
                    <button class="rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700" @click="router.push(`/admin/organizations/${row.organization_id}`)">Details</button>
                    <button class="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700" @click="startEdit(row)">Edit</button>
                    <button class="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" @click="deleteOrganization(row)">Delete</button>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
