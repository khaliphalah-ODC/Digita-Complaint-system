<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import MobileDataCardList from '../../components/MobileDataCardList.vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import { useUiToastStore } from '../../stores/uiToast';
import { useSessionStore } from '../../stores/session';

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
      department_id: editingId.value && form.department_id !== '' ? Number(form.department_id) : null,
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
const mobileCardFields = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'organization', label: 'Organization' }
];

const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

const activeUsers = computed(() =>
  users.value.filter((row) => String(row.status || '').toLowerCase() === 'active')
);

const inactiveUsers = computed(() =>
  users.value.filter((row) => String(row.status || '').toLowerCase() !== 'active')
);

const orgAdmins = computed(() =>
  users.value.filter((row) => String(row.role || '').toLowerCase() === 'org_admin')
);

const summaryCards = computed(() => [
  {
    label: 'Total Users',
    value: users.value.length,
    detail: 'organization directory'
  },
  {
    label: 'Active Staff',
    value: activeUsers.value.length,
    detail: 'currently active'
  },
  {
    label: 'Inactive Staff',
    value: inactiveUsers.value.length,
    detail: 'need follow-up'
  },
  {
    label: 'Org Admins',
    value: orgAdmins.value.length,
    detail: 'admin coverage'
  }
]);

onMounted(fetchUsers);
onMounted(normalizeRoleFilters);
watch(assignableRoles, normalizeRoleFilters, { immediate: false });
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <PageHeader
          kicker="Identity Operations"
          title="Organization Users"
          description="Create users inside your organization, update internal access roles, and maintain staff status from one consistent operations workspace."
        >
          <template #actions>
            <button class="app-btn-secondary" @click="fetchUsers">
              Refresh Users
            </button>
            <RouterLink to="/org-admin/departments" class="app-btn-primary">
              Manage Departments
            </RouterLink>
          </template>
        </PageHeader>

        <p v-if="error" class="rounded-[var(--app-radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </p>

        <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="item in summaryCards" :key="item.label" class="app-section-card">
            <p class="app-metric-label">{{ item.label }}</p>
            <p class="app-metric-value">{{ loading ? '...' : item.value }}</p>
            <p class="app-metric-detail">{{ item.detail }}</p>
          </article>
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr),minmax(320px,0.95fr)]">
          <section ref="userFormSection" class="app-section-card">
            <div class="app-section-heading mb-4">
              <p class="app-kicker">User Form</p>
              <h2 class="app-section-title">{{ editingId ? 'Edit User' : 'Create User' }}</h2>
              <p class="app-section-description">Keep role and status updates scoped to your organization while maintaining a clean identity workflow.</p>
            </div>

            <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="saveUser">
              <input v-model="form.full_name" placeholder="Full name" class="app-input">
              <input v-model="form.email" type="email" placeholder="Email" class="app-input">
              <input v-model="form.password" type="password" placeholder="Password" class="app-input">
              <input v-if="isSuperAdmin" v-model="form.organization_id" placeholder="Organization ID" class="app-input">
              <select v-model="form.role" class="app-select">
                <option v-for="role in assignableRoles" :key="role" :value="role">{{ role }}</option>
              </select>
              <select v-model="form.status" class="app-select">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
              <div class="md:col-span-2 flex flex-col gap-2 sm:flex-row">
                <button type="submit" :disabled="saving" class="app-btn-primary">
                  {{ saving ? 'Saving...' : editingId ? 'Update User' : 'Create User' }}
                </button>
                <button type="button" class="app-btn-secondary" @click="resetForm">
                  Clear
                </button>
              </div>
            </form>
          </section>

          <section v-if="isOrgAdmin" class="app-section-card">
            <div class="app-section-heading mb-4">
              <p class="app-kicker">Assign Existing</p>
              <h2 class="app-section-title">Claim Existing User</h2>
              <p class="app-section-description">Attach a self-registered user account to your organization using their email address.</p>
            </div>

            <form class="grid grid-cols-1 gap-3 md:grid-cols-[1fr,auto]" @submit.prevent="assignExistingUser">
              <input
                v-model="assignExistingForm.email"
                type="email"
                placeholder="Existing user email"
                class="app-input"
              >
              <button
                type="submit"
                :disabled="assigningExisting"
                class="app-btn-primary"
              >
                {{ assigningExisting ? 'Assigning...' : 'Assign to Organization' }}
              </button>
            </form>
          </section>
        </section>

        <section class="app-section-card">
          <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div class="app-section-heading">
              <p class="app-kicker">Directory</p>
              <h2 class="app-section-title">User Table</h2>
              <p class="app-section-description">Filter by name, role, and status, then update or remove users directly from the directory.</p>
            </div>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[34rem]">
              <input v-model="search" placeholder="Search name/email" class="app-input">
              <select v-model="roleFilter" class="app-select">
                <option value="all">All roles</option>
                <option v-for="role in filterRoles" :key="role" :value="role">{{ role }}</option>
              </select>
              <select v-model="statusFilter" class="app-select">
                <option value="all">All statuses</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          </div>

          <p v-if="loading" class="text-sm text-[var(--app-muted-color)]">Loading users...</p>
          <p v-else-if="filteredUsers.length === 0" class="app-empty-state">No users match the current filters.</p>

          <MobileDataCardList
            v-else
            :items="paginatedUsers"
            :fields="mobileCardFields"
            key-field="id"
          >
            <template #field-name="{ item }">
              <p class="break-words font-semibold text-[var(--app-title-color)]">{{ item.full_name }}</p>
            </template>
            <template #field-email="{ item }">
              <p class="break-all font-medium text-[var(--app-title-color)]">{{ item.email }}</p>
            </template>
            <template #field-role="{ item }">
              <select
                v-if="canManageRow(item)"
                class="app-select min-h-[36px] px-3 py-1 text-xs"
                :value="item.role"
                @change="updateUserRoleQuick(item, $event.target.value)"
              >
                <option v-for="role in assignableRoles" :key="role" :value="role">{{ role }}</option>
              </select>
              <span v-else class="font-medium text-[var(--app-title-color)]">{{ item.role }}</span>
            </template>
            <template #field-status="{ item }">
              <p class="font-medium text-[var(--app-title-color)]">{{ item.status }}</p>
            </template>
            <template #field-organization="{ item }">
              <p class="font-medium text-[var(--app-title-color)]">{{ item.organization_id ?? 'N/A' }}</p>
            </template>
            <template #actions="{ item }">
              <div class="app-action-row flex flex-wrap gap-2">
                <button
                  type="button"
                  :disabled="!canManageRow(item)"
                  class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  @click="startEdit(item)"
                >
                  <font-awesome-icon :icon="faPenToSquare" class="text-sm" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  :disabled="!canManageRow(item)"
                  class="app-btn-danger min-h-[36px] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  @click="deleteUser(item)"
                >
                  <font-awesome-icon :icon="faTrashCan" class="text-sm" />
                  <span>Delete</span>
                </button>
              </div>
            </template>
          </MobileDataCardList>

          <div v-if="filteredUsers.length > 0" class="hidden md:block app-table-shell overflow-x-auto">
            <table class="app-table app-table-responsive min-w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Organization</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in paginatedUsers" :key="row.id">
                  <td data-label="Name" class="font-medium text-[var(--app-title-color)]">{{ row.full_name }}</td>
                  <td data-label="Email">{{ row.email }}</td>
                  <td data-label="Role">
                    <select
                      v-if="canManageRow(row)"
                      class="app-select min-h-[36px] px-3 py-1 text-xs"
                      :value="row.role"
                      @change="updateUserRoleQuick(row, $event.target.value)"
                    >
                      <option v-for="role in assignableRoles" :key="role" :value="role">{{ role }}</option>
                    </select>
                    <span v-else>{{ row.role }}</span>
                  </td>
                  <td data-label="Status">{{ row.status }}</td>
                  <td data-label="Organization">{{ row.organization_id ?? 'N/A' }}</td>
                  <td data-label="Actions" data-actions="true">
                    <div class="app-action-row flex flex-wrap gap-2">
                      <button
                        type="button"
                        :disabled="!canManageRow(row)"
                        class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                        @click="startEdit(row)"
                      >
                        <font-awesome-icon :icon="faPenToSquare" class="text-sm" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        :disabled="!canManageRow(row)"
                        class="app-btn-danger min-h-[36px] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
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

          <div class="mt-3 flex flex-col gap-2 text-xs text-[var(--app-muted-color)] sm:flex-row sm:items-center sm:justify-between">
            <p>Showing {{ paginatedUsers.length }} of {{ filteredUsers.length }} users</p>
            <div class="flex items-center gap-2">
              <button class="app-btn-secondary min-h-[34px] px-3 py-1 text-xs disabled:opacity-50" :disabled="page <= 1" @click="goToPage(page - 1)">Prev</button>
              <span>Page {{ page }} / {{ totalPages }}</span>
              <button class="app-btn-secondary min-h-[34px] px-3 py-1 text-xs disabled:opacity-50" :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
