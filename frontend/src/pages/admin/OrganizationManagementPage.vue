<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import OrganizationCreateForm from '../../components/OrganizationCreateForm.vue';

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const organizations = ref([]);
const resetKey = ref(0);
const search = ref('');
const editingId = ref(null);

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

onMounted(fetchOrganizations);
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Organization Management</h1>
        <p class="text-sm text-slate-600">Admin CRUD for organization records.</p>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="fetchOrganizations">
        Refresh
      </button>
    </header>

    <OrganizationCreateForm :loading="saving" :show-status="true" :reset-key="resetKey" title="Create Organization (Admin)" @submit="createOrganization" />

    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-bold text-slate-900">Organizations</h2>
        <input v-model="search" placeholder="Search organization..." class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
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
              <th class="pb-2 pr-3">Status</th>
              <th class="pb-2 pr-3">Complaints</th>
              <th class="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredOrganizations" :key="row.organization_id" class="border-t border-slate-100">
              <template v-if="editingId === row.organization_id">
                <td class="py-2 pr-3"><input v-model="editForm.name" class="w-full rounded border border-slate-300 px-2 py-1"></td>
                <td class="py-2 pr-3"><input v-model="editForm.organization_type" class="w-full rounded border border-slate-300 px-2 py-1"></td>
                <td class="py-2 pr-3"><input v-model="editForm.email" class="w-full rounded border border-slate-300 px-2 py-1"></td>
                <td class="py-2 pr-3">
                  <select v-model="editForm.status" class="rounded border border-slate-300 px-2 py-1">
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </td>
                <td class="py-2 pr-3">{{ row.complaints_count ?? 0 }}</td>
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
                <td class="py-2 pr-3">{{ row.status }}</td>
                <td class="py-2 pr-3">{{ row.complaints_count ?? 0 }}</td>
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
