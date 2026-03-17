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
    status_logs: 'Status Logs'
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
  return organizations.value.filter((row) => {
    return (
      String(row.name || '').toLowerCase().includes(keyword) ||
      String(row.organization_type || '').toLowerCase().includes(keyword) ||
      String(row.email || '').toLowerCase().includes(keyword)
    );
  });
});

const managementSummary = computed(() => {
  const activeOrganizations = organizations.value.filter((row) => String(row.status).toLowerCase() === 'active').length;
  const inactiveOrganizations = organizations.value.length - activeOrganizations;
  return {
    total: organizations.value.length,
    active: activeOrganizations,
    inactive: inactiveOrganizations
  };
});

onMounted(async () => {
  await fetchOrganizations();
});
</script>

<template>
  <section class="app-dark-stage w-full space-y-5 rounded-[34px] p-4 sm:p-6">
    <PageHeader
      theme="dark"
      kicker="Directory Operations"
      title="Organization Management"
      description="Manage organization records, monitor the triage queue, and keep platform directory data clean."
    >
      <template #actions>
        <button class="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/84" @click="fetchOrganizations">
          Refresh Directory
        </button>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Total Organizations</p>
        <p class="mt-2 text-3xl font-black text-white">{{ managementSummary.total }}</p>
        <p class="text-sm text-white/58">All organizations in the platform directory.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Active</p>
        <p class="mt-2 text-3xl font-black text-emerald-300">{{ managementSummary.active }}</p>
        <p class="text-sm text-white/58">Organizations currently able to receive routed complaints.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Inactive</p>
        <p class="mt-2 text-3xl font-black text-white">{{ managementSummary.inactive }}</p>
        <p class="text-sm text-white/58">Organizations currently suspended or inactive.</p>
      </article>
    </section>

    <OrganizationCreateForm :loading="saving" :show-status="true" :reset-key="resetKey" title="Create Organization (Admin)" theme="dark" @submit="createOrganization" />

    <section class="app-dark-panel rounded-[30px] p-5">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-bold text-white">Organizations</h2>
        <input v-model="search" placeholder="Search organization..." class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/36">
      </div>

      <p v-if="loading" class="text-sm text-white/58">Loading organizations...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="filteredOrganizations.length === 0" class="text-sm text-white/58">No organizations found.</p>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="text-white/46">
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
            <tr v-for="row in filteredOrganizations" :key="row.organization_id" class="border-t border-white/8 align-top text-white/82">
              <template v-if="Number(editingId) === Number(row.organization_id)">
                <td class="py-2 pr-3"><input v-model="editForm.name" class="w-full rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-white"></td>
                <td class="py-2 pr-3"><input v-model="editForm.organization_type" class="w-full rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-white"></td>
                <td class="py-2 pr-3"><input v-model="editForm.email" class="w-full rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-white"></td>
                <td class="py-2 pr-3">{{ row.organization_admin?.full_name || 'Not assigned' }}</td>
                <td class="py-2 pr-3">
                  <select v-model="editForm.status" class="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-white">
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </td>
                <td class="py-2">
                  <div class="flex items-center gap-2">
                    <button type="button" :disabled="saving" class="inline-flex items-center gap-2 rounded bg-[var(--app-primary)] px-2.5 py-1.5 text-xs font-semibold text-white" @click="saveEdit(row)">
                      <font-awesome-icon :icon="faFloppyDisk" class="text-sm" />
                      <span>Save</span>
                    </button>
                    <button type="button" class="inline-flex items-center gap-2 rounded border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/78" @click="cancelEdit">
                      <font-awesome-icon :icon="faXmark" class="text-sm" />
                      <span>Cancel</span>
                    </button>
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
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-blue-200 transition hover:bg-white/[0.12]"
                      title="View details"
                      aria-label="View organization details"
                      @click="router.push(`/admin/organizations/${row.organization_id}`)"
                    >
                      <font-awesome-icon :icon="faCircleInfo" class="text-sm" />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-blue-200 transition hover:bg-white/[0.12]"
                      title="Update organization"
                      aria-label="Update organization"
                      @click="startEdit(row)"
                    >
                      <font-awesome-icon :icon="faPenToSquare" class="text-sm" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-full bg-red-500/14 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/24"
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4"
      @click.self="closeDeleteConflict"
    >
      <section class="w-full max-w-lg rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,33,61,0.98),rgba(20,52,99,0.96))] p-6 text-white shadow-[0_30px_90px_rgba(2,6,23,0.45)]">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[0.74rem] font-bold uppercase tracking-[0.18em] text-blue-200/90">Delete Blocked</p>
            <h3 class="mt-2 text-2xl font-black text-white">{{ deleteConflict.organizationName }}</h3>
          </div>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/74 hover:bg-white/10"
            aria-label="Close delete conflict modal"
            @click="closeDeleteConflict"
          >
            <font-awesome-icon :icon="faXmark" class="text-sm" />
          </button>
        </div>

        <p class="mt-4 text-sm leading-6 text-white/72">
          {{ deleteConflict.message }}
        </p>

        <div class="mt-5 space-y-3">
          <article
            v-for="item in blockerEntries"
            :key="item.key"
            class="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3"
          >
            <span class="text-sm font-semibold text-white/84">{{ item.label }}</span>
            <span class="rounded-full bg-blue-200 px-3 py-1 text-xs font-black text-[var(--app-primary-ink)]">
              {{ item.count }}
            </span>
          </article>
        </div>

        <p class="mt-5 text-sm text-white/60">
          Reassign or remove the linked records first, or keep the organization inactive instead of deleting it.
        </p>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            class="rounded-full bg-[var(--app-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)]"
            @click="closeDeleteConflict"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
