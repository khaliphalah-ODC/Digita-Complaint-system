<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  faCircleInfo,
  faFloppyDisk,
  faPenToSquare,
  faTrashCan,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import OrganizationCreateForm from '../../components/OrganizationCreateForm.vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const createFormErrors = reactive({
  general: '',
  email: '',
  admin_email: ''
});
const organizations = ref([]);
const resetKey = ref(0);
const search = ref('');
const editingId = ref(null);
const deleteConflict = reactive({
  visible: false,
  organizationName: '',
  blockers: {},
  message: ''
});

const editForm = reactive({
  name: '',
  organization_type: '',
  email: '',
  phone: '',
  address: '',
  logo: '',
  status: 'active'
});

const normalizeText = (value) => String(value ?? '').trim();

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const resetCreateFormErrors = () => {
  createFormErrors.general = '';
  createFormErrors.email = '';
  createFormErrors.admin_email = '';
};

const applyCreateOrganizationError = (requestError) => {
  resetCreateFormErrors();
  const status = Number(requestError?.response?.status || 0);
  const message = String(requestError?.response?.data?.message || '');

  if (status === 409 && message === 'Organization email already exists') {
    createFormErrors.email = 'This organization email is already in use.';
    return;
  }

  if (status === 409 && message === 'Organization admin email already exists') {
    createFormErrors.admin_email = 'This organization admin email is already in use.';
    return;
  }

  createFormErrors.general = extractApiError(requestError, 'Failed to create organization');
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
  resetCreateFormErrors();
  try {
    await api.post('/organization', payload);
    resetKey.value += 1;
    await fetchOrganizations();
  } catch (requestError) {
    applyCreateOrganizationError(requestError);
  } finally {
    saving.value = false;
  }
};

const startEdit = (row) => {
  editingId.value = Number(row.organization_id);
  editForm.name = String(row.name || '');
  editForm.organization_type = String(row.organization_type || '');
  editForm.email = String(row.email || '');
  editForm.phone = String(row.phone || '');
  editForm.address = String(row.address || '');
  editForm.logo = String(row.logo || '');
  editForm.status = row.status || 'active';
};

const cancelEdit = () => {
  editingId.value = null;
};

const closeDeleteConflict = () => {
  deleteConflict.visible = false;
  deleteConflict.organizationName = '';
  deleteConflict.blockers = {};
  deleteConflict.message = '';
};

const blockerEntries = computed(() => {
  const labels = {
    users: 'Users',
    departments: 'Departments',
    complaints: 'Complaints',
    accessments: 'Assessments',
    escalations: 'Escalations',
    notifications: 'Notifications',
    status_logs: 'Status logs'
  };

  return Object.entries(deleteConflict.blockers || {}).map(([key, count]) => ({
    key,
    label: labels[key] || key,
    count: Number(count || 0)
  }));
});

const saveEdit = async (row) => {
  saving.value = true;
  error.value = '';
  try {
    await api.put(`/organization/${row.organization_id}`, {
      name: normalizeText(editForm.name),
      organization_type: normalizeText(editForm.organization_type),
      email: normalizeText(editForm.email).toLowerCase(),
      phone: normalizeText(editForm.phone) || null,
      address: normalizeText(editForm.address),
      logo: normalizeText(editForm.logo) || null,
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
  closeDeleteConflict();
  try {
    await api.delete(`/organization/${row.organization_id}`);
    await fetchOrganizations();
  } catch (requestError) {
    const payload = requestError?.response?.data || {};
    if (Number(requestError?.response?.status) === 409 && payload?.error && typeof payload.error === 'object') {
      deleteConflict.visible = true;
      deleteConflict.organizationName = row.name || 'this organization';
      deleteConflict.blockers = payload.error;
      deleteConflict.message = payload.message || 'Cannot delete organization while related records still exist.';
      return;
    }
    error.value = extractApiError(requestError, 'Failed to delete organization');
  }
};

const filteredOrganizations = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return organizations.value;
  return organizations.value.filter((row) => (
    String(row.name || '').toLowerCase().includes(keyword) ||
    String(row.organization_type || '').toLowerCase().includes(keyword) ||
    String(row.email || '').toLowerCase().includes(keyword)
  ));
});

const managementSummary = computed(() => {
  const active = organizations.value.filter((row) => String(row.status).toLowerCase() === 'active').length;
  const withoutAdmin = organizations.value.filter((row) => !row.organization_admin?.full_name && !row.organization_admin?.email).length;

  return {
    total: organizations.value.length,
    active,
    inactive: organizations.value.length - active,
    withoutAdmin
  };
});

onMounted(fetchOrganizations);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
    <PageHeader
      title="Organization Management"
      description="Create, review, and update organization records that control platform coverage and org-admin assignment."
    >
      <template #actions>
        <button
          class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="fetchOrganizations"
        >
          Refresh
        </button>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="app-section-card app-metric-card">
        <p class="text-sm font-medium text-slate-500">Total organizations</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ managementSummary.total }}</p>
        <p class="mt-2 text-sm text-slate-600">Current platform directory size.</p>
      </article>
      <article class="app-section-card app-metric-card">
        <p class="text-sm font-medium text-slate-500">Active</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ managementSummary.active }}</p>
        <p class="mt-2 text-sm text-slate-600">Organizations available for complaint routing.</p>
      </article>
      <article class="app-section-card app-metric-card">
        <p class="text-sm font-medium text-slate-500">Inactive</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ managementSummary.inactive }}</p>
        <p class="mt-2 text-sm text-slate-600">Records currently suspended or unavailable.</p>
      </article>
      <article class="app-section-card app-metric-card">
        <p class="text-sm font-medium text-slate-500">Missing org-admin</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">{{ managementSummary.withoutAdmin }}</p>
        <p class="mt-2 text-sm text-slate-600">Organizations that still need admin assignment.</p>
      </article>
    </section>

    <OrganizationCreateForm
      :loading="saving"
      :show-status="true"
      :reset-key="resetKey"
      :errors="createFormErrors"
      title="Create Organization"
      @submit="createOrganization"
    />

    <section class="app-section-card">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Organization directory</h2>
          <p class="mt-1 text-sm text-slate-600">Search records, review status, and update organization details inline.</p>
        </div>
        <div class="w-full max-w-sm">
          <label class="mb-2 block text-sm font-medium text-slate-700">Search</label>
          <input
            v-model="search"
            placeholder="Search by name, type, or email"
            class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
          >
        </div>
      </div>

      <p v-if="loading" class="mt-4 text-sm text-slate-500">Loading organizations...</p>
      <p v-else-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
      <p v-else-if="filteredOrganizations.length === 0" class="mt-4 text-sm text-slate-500">No organizations found.</p>

      <div v-else class="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="px-4 py-3 font-medium">Name</th>
              <th class="px-4 py-3 font-medium">Type</th>
              <th class="px-4 py-3 font-medium">Email</th>
              <th class="px-4 py-3 font-medium">Org Admin</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredOrganizations" :key="row.organization_id" class="border-t border-slate-200 align-top text-slate-700 first:border-t-0">
              <template v-if="Number(editingId) === Number(row.organization_id)">
                <td class="px-4 py-3">
                  <input v-model="editForm.name" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500">
                </td>
                <td class="px-4 py-3">
                  <input v-model="editForm.organization_type" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500">
                </td>
                <td class="px-4 py-3">
                  <input v-model="editForm.email" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500">
                </td>
                <td class="px-4 py-3">{{ row.organization_admin?.full_name || 'Not assigned' }}</td>
                <td class="px-4 py-3">
                  <select v-model="editForm.status" class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500">
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      :disabled="saving"
                    class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                      @click="saveEdit(row)"
                    >
                      <font-awesome-icon :icon="faFloppyDisk" class="text-sm" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      @click="cancelEdit"
                    >
                      <font-awesome-icon :icon="faXmark" class="text-sm" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </td>
              </template>
              <template v-else>
                <td class="px-4 py-3 font-medium text-slate-900">{{ row.name }}</td>
                <td class="px-4 py-3">{{ row.organization_type }}</td>
                <td class="px-4 py-3">{{ row.email }}</td>
                <td class="px-4 py-3">{{ row.organization_admin?.full_name || 'Not assigned' }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex rounded-lg px-2.5 py-1 text-xs font-medium"
                    :class="String(row.status).toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'"
                  >
                    {{ row.status }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      title="View details"
                      aria-label="View organization details"
                      @click="router.push(`/admin/organizations/${row.organization_id}`)"
                    >
                      <font-awesome-icon :icon="faCircleInfo" class="text-sm" />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      title="Update organization"
                      aria-label="Update organization"
                      @click="startEdit(row)"
                    >
                      <font-awesome-icon :icon="faPenToSquare" class="text-sm" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                      title="Delete organization"
                      aria-label="Delete organization"
                      @click="deleteOrganization(row)"
                    >
                      <font-awesome-icon :icon="faTrashCan" class="text-sm" />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="deleteConflict.visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      @click.self="closeDeleteConflict"
    >
      <section class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-red-600">Delete blocked</p>
            <h3 class="mt-1 text-xl font-semibold text-slate-900">{{ deleteConflict.organizationName }}</h3>
          </div>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Close delete conflict modal"
            @click="closeDeleteConflict"
          >
            <font-awesome-icon :icon="faXmark" class="text-sm" />
          </button>
        </div>

        <p class="mt-4 text-sm leading-6 text-slate-600">{{ deleteConflict.message }}</p>

        <div class="mt-5 space-y-3">
          <article
            v-for="item in blockerEntries"
            :key="item.key"
            class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <span class="text-sm font-medium text-slate-800">{{ item.label }}</span>
            <span class="rounded-lg bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">{{ item.count }}</span>
          </article>
        </div>

        <p class="mt-5 text-sm text-slate-600">
          Reassign or remove the linked records first, or keep the organization inactive instead of deleting it.
        </p>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            class="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            @click="closeDeleteConflict"
          >
            Close
          </button>
        </div>
      </section>
    </div>
      </div>
    </div>
  </section>
</template>
