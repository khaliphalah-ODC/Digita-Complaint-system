<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import api, { extractApiError, unwrapResponse } from '../../../services/api';
import { useUiToastStore } from '../../../stores/uiToast';
import { useSessionStore } from '../../../stores/session';

const loading = ref(false);
const saving = ref(false);
const assigningExisting = ref(false);
const error = ref('');
const users = ref([]);
const editingId = ref(null);
const userFormSection = ref(null);

const search = ref('');
const roleFilter = ref('all');
const statusFilter = ref('all');
const page = ref(1);
const pageSize = 10;
const uiToast = useUiToastStore();
const session = useSessionStore();

const form = reactive({
  organization_id: '',
  department_id: '',
  full_name: '',
  email: '',
  password: '',
  role: 'user',
  status: 'active'
});

const assignExistingForm = reactive({
  email: ''
});

const isSuperAdmin = computed(() => session.currentUser?.role === 'super_admin');
const isOrgAdmin = computed(() => session.currentUser?.role === 'org_admin');
const isAdminFamily = computed(() => isSuperAdmin.value || isOrgAdmin.value);
const assignableRoles = computed(() => (isAdminFamily.value ? ['org_admin', 'user'] : ['user']));
const filterRoles = computed(() => (isSuperAdmin.value ? ['super_admin', ...assignableRoles.value] : assignableRoles.value));
const pageTitleClass = computed(() => (isOrgAdmin.value ? 'mt-2 text-3xl font-bold text-white' : 'mt-2 text-3xl font-bold text-slate-900'));
const pageMetaClass = computed(() => (isOrgAdmin.value ? 'text-sm text-white/70' : 'text-sm text-slate-600'));
const panelClass = computed(() => (isOrgAdmin.value ? 'org-admin-panel-card' : 'app-shell-panel rounded-[30px] p-5'));
const inputClass = computed(() => (
  isOrgAdmin.value
    ? 'org-admin-input'
    : 'rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--app-primary)]'
));
const selectClass = computed(() => (
  isOrgAdmin.value
    ? 'org-admin-select'
    : 'rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--app-primary)]'
));
const primaryButtonClass = computed(() => (
  isOrgAdmin.value
    ? 'org-admin-btn disabled:opacity-70'
    : 'rounded-full bg-[var(--app-primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)] disabled:opacity-70'
));
const secondaryButtonClass = computed(() => (
  isOrgAdmin.value
    ? 'org-admin-outline-btn'
    : 'rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700'
));
const toolbarButtonClass = computed(() => (
  isOrgAdmin.value
    ? 'org-admin-outline-btn'
    : 'rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700'
));
const textSoftClass = computed(() => (isOrgAdmin.value ? 'text-sm text-white/70' : 'text-sm text-slate-600'));
const tableClass = computed(() => (isOrgAdmin.value ? 'org-admin-table min-w-full text-left text-sm' : 'min-w-full text-left text-sm'));
const tableHeadClass = computed(() => (isOrgAdmin.value ? 'text-white/60' : 'text-slate-500'));
const tableRowClass = computed(() => (isOrgAdmin.value ? 'border-t border-white/10' : 'border-t border-slate-100'));
const paginationClass = computed(() => (isOrgAdmin.value ? 'mt-3 flex items-center justify-between text-xs text-white/70' : 'mt-3 flex items-center justify-between text-xs text-slate-600'));
const pagerButtonClass = computed(() => (
  isOrgAdmin.value
    ? 'rounded border border-white/20 bg-white/10 px-2 py-1 text-white disabled:opacity-50'
    : 'rounded border border-slate-300 px-2 py-1 disabled:opacity-50'
));
const quickRoleClass = computed(() => (
  isOrgAdmin.value
    ? 'rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white'
    : 'rounded border border-slate-300 px-2 py-1 text-xs'
));
const editActionClass = computed(() => (
  isOrgAdmin.value
    ? 'inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50'
    : 'inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
));
const deleteActionClass = computed(() => (
  isOrgAdmin.value
    ? 'inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-100 disabled:cursor-not-allowed disabled:opacity-50'
    : 'inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50'
));

const canManageRow = (row) => {
  if (!row) return false;
  if (row.role === 'super_admin') return false;
  if (isSuperAdmin.value) return true;
  if (isOrgAdmin.value) {
    return Number(row.organization_id) === Number(session.currentUser?.organization_id);
  }
  return false;
};

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const getUserFormError = (requestError, fallbackMessage) => {
  const payload = requestError?.response?.data || {};
  if (Number(requestError?.response?.status) === 409 && payload?.message) {
    return payload.message;
  }
  return extractApiError(requestError, fallbackMessage);
};

const resetForm = () => {
  editingId.value = null;
  form.organization_id = '';
  form.department_id = '';
  form.full_name = '';
  form.email = '';
  form.password = '';
  form.role = assignableRoles.value.includes('user') ? 'user' : (assignableRoles.value[0] || 'user');
  form.status = 'active';
};

const resetAssignExistingForm = () => {
  assignExistingForm.email = '';
};

const normalizeRoleFilters = () => {
  if (!assignableRoles.value.includes(form.role)) {
    form.role = assignableRoles.value[0];
  }
  if (roleFilter.value !== 'all' && !filterRoles.value.includes(roleFilter.value)) {
    roleFilter.value = 'all';
  }
};

const fetchUsers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/users');
    users.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch users') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch users');
  } finally {
    loading.value = false;
  }
};

const startEdit = (row) => {
  if (!canManageRow(row)) return;

  editingId.value = row.id;
  form.organization_id = row.organization_id ?? '';
  form.department_id = row.department_id ?? '';
  form.full_name = row.full_name ?? '';
  form.email = row.email ?? '';
  form.password = '';
  form.role = assignableRoles.value.includes(row.role) ? row.role : 'user';
  form.status = row.status ?? 'active';

  nextTick(() => {
    userFormSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

const saveUser = async () => {
  error.value = '';
  if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
    error.value = 'full_name, email, and password are required.';
    return;
  }

  saving.value = true;
  try {
    const payload = {
      organization_id: isSuperAdmin.value && form.organization_id !== '' ? Number(form.organization_id) : null,
      department_id: form.department_id === '' ? null : Number(form.department_id),
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      status: form.status
    };

    if (editingId.value) {
      await api.put(`/users/${editingId.value}`, payload);
      uiToast.success('User updated successfully.');
    } else {
      await api.post('/users', payload);
      uiToast.success('User created successfully.');
    }

    resetForm();
    await fetchUsers();
  } catch (requestError) {
    error.value = getUserFormError(requestError, editingId.value ? 'Failed to update user' : 'Failed to create user');
    uiToast.error(error.value);
  } finally {
    saving.value = false;
  }
};

const assignExistingUser = async () => {
  error.value = '';
  if (!assignExistingForm.email.trim()) {
    error.value = 'Existing user email is required.';
    return;
  }

  assigningExisting.value = true;
  try {
    await api.post('/users/assign-existing', {
      email: assignExistingForm.email.trim().toLowerCase()
    });
    uiToast.success('Existing user assigned to your organization.');
    resetAssignExistingForm();
    await fetchUsers();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to assign existing user');
    uiToast.error(error.value);
  } finally {
    assigningExisting.value = false;
  }
};

const deleteUser = async (row) => {
  if (!canManageRow(row)) {
    error.value = 'This user cannot be deleted from this panel.';
    uiToast.error(error.value);
    return;
  }

  const ok = window.confirm(`Delete user "${row.full_name}" (${row.email})?`);
  if (!ok) return;
  error.value = '';
  try {
    await api.delete(`/users/${row.id}`);
    uiToast.success('User deleted successfully.');
    await fetchUsers();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete user');
    uiToast.error(error.value);
  }
};

const updateUserRoleQuick = async (row, nextRole) => {
  if (!canManageRow(row)) return;
  if (!nextRole || row.role === nextRole) return;
  error.value = '';
  try {
    await api.patch(`/users/${row.id}/role`, { role: nextRole });
    uiToast.success(`Role updated to ${nextRole}.`);
    await fetchUsers();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to update role');
    uiToast.error(error.value);
  }
};

const filteredUsers = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return users.value.filter((row) => {
    const matchesText =
      !keyword ||
      row.full_name?.toLowerCase().includes(keyword) ||
      row.email?.toLowerCase().includes(keyword);
    const matchesRole = roleFilter.value === 'all' || row.role === roleFilter.value;
    const matchesStatus = statusFilter.value === 'all' || row.status === statusFilter.value;
    return matchesText && matchesRole && matchesStatus;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize)));

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredUsers.value.slice(start, start + pageSize);
});

const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

onMounted(fetchUsers);
onMounted(normalizeRoleFilters);
watch(assignableRoles, normalizeRoleFilters, { immediate: false });
</script>

<template>
  <section class="w-full space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="app-kicker">Identity Operations</p>
        <h1 :class="pageTitleClass">{{ isOrgAdmin ? 'Organization Users' : 'User Management' }}</h1>
        <p :class="pageMetaClass">
          {{ isOrgAdmin ? 'Create users in your organization and promote staff to organization admin when needed.' : 'Create and maintain user accounts and organization-level access roles.' }}
        </p>
      </div>
      <button :class="toolbarButtonClass" @click="fetchUsers">
        Refresh
      </button>
    </header>

    <section ref="userFormSection" :class="panelClass">
      <h2 :class="isOrgAdmin ? 'mb-3 text-lg font-bold text-white' : 'mb-3 text-lg font-bold text-slate-900'">{{ editingId ? 'Edit User' : 'Create User' }}</h2>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="saveUser">
        <input v-model="form.full_name" placeholder="Full name" :class="inputClass">
        <input v-model="form.email" type="email" placeholder="Email" :class="inputClass">
        <input v-model="form.password" type="password" placeholder="Password" :class="inputClass">
        <input v-if="isSuperAdmin" v-model="form.organization_id" placeholder="Organization ID" :class="inputClass">
        <input v-model="form.department_id" placeholder="Department ID (optional)" :class="inputClass">
        <select v-model="form.role" :class="selectClass">
          <option v-for="role in assignableRoles" :key="role" :value="role">{{ role }}</option>
        </select>
        <select v-model="form.status" :class="selectClass">
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
        <div class="md:col-span-2 flex gap-2">
          <button type="submit" :disabled="saving" :class="primaryButtonClass">
            {{ saving ? 'Saving...' : editingId ? 'Update User' : 'Create User' }}
          </button>
          <button type="button" :class="secondaryButtonClass" @click="resetForm">
            Clear
          </button>
        </div>
      </form>
    </section>

    <section v-if="isOrgAdmin" :class="panelClass">
      <h2 class="mb-2 text-lg font-bold text-white">Assign Existing User</h2>
      <p class="mb-3 text-sm text-white/70">
        Claim a self-signed-up user account into your organization by email address.
      </p>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-[1fr,auto]" @submit.prevent="assignExistingUser">
        <input
          v-model="assignExistingForm.email"
          type="email"
          placeholder="Existing user email"
          :class="inputClass"
        >
        <button
          type="submit"
          :disabled="assigningExisting"
          :class="primaryButtonClass"
        >
          {{ assigningExisting ? 'Assigning...' : 'Assign to Organization' }}
        </button>
      </form>
    </section>

    <section :class="panelClass">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 :class="isOrgAdmin ? 'text-lg font-bold text-white' : 'text-lg font-bold text-slate-900'">Users</h2>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model="search" placeholder="Search name/email" :class="inputClass">
          <select v-model="roleFilter" :class="selectClass">
            <option value="all">All roles</option>
            <option v-for="role in filterRoles" :key="role" :value="role">{{ role }}</option>
          </select>
          <select v-model="statusFilter" :class="selectClass">
            <option value="all">All statuses</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </div>

      <p v-if="loading" :class="textSoftClass">Loading users...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="filteredUsers.length === 0" :class="textSoftClass">No users found.</p>

      <div v-else class="overflow-x-auto">
        <table :class="tableClass">
          <thead :class="tableHeadClass">
            <tr>
              <th class="pb-2 pr-3">Name</th>
              <th class="pb-2 pr-3">Email</th>
              <th class="pb-2 pr-3">Role</th>
              <th class="pb-2 pr-3">Status</th>
              <th class="pb-2 pr-3">Organization</th>
              <th class="pb-2 pr-3">Department</th>
              <th class="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginatedUsers" :key="row.id" :class="tableRowClass">
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white' : ''">{{ row.full_name }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.email }}</td>
              <td class="py-2 pr-3">
                <select
                  v-if="canManageRow(row)"
                  :class="quickRoleClass"
                  :value="row.role"
                  @change="updateUserRoleQuick(row, $event.target.value)"
                >
                  <option v-for="role in assignableRoles" :key="role" :value="role">{{ role }}</option>
                </select>
                <span :class="isOrgAdmin ? 'text-white/80' : ''" v-else>{{ row.role }}</span>
              </td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.status }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.organization_id ?? 'N/A' }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.department_id ?? 'N/A' }}</td>
              <td class="py-2">
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    :disabled="!canManageRow(row)"
                    :class="editActionClass"
                    @click="startEdit(row)"
                  >
                    <font-awesome-icon :icon="faPenToSquare" class="text-sm" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    :disabled="!canManageRow(row)"
                    :class="deleteActionClass"
                    @click="deleteUser(row)"
                  >
                    <font-awesome-icon :icon="faTrashCan" class="text-sm" />
                    <span>Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div :class="paginationClass">
        <p>Showing {{ paginatedUsers.length }} of {{ filteredUsers.length }} users</p>
        <div class="flex items-center gap-2">
          <button :class="pagerButtonClass" :disabled="page <= 1" @click="goToPage(page - 1)">Prev</button>
          <span>Page {{ page }} / {{ totalPages }}</span>
          <button :class="pagerButtonClass" :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</button>
        </div>
      </div>
    </section>
  </section>
</template>
