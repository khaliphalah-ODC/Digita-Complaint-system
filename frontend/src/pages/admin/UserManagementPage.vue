<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import { useUiToastStore } from '../../stores/uiToast';

const loading = ref(false);
const saving = ref(false);
const error = ref('');
const users = ref([]);
const editingId = ref(null);

const search = ref('');
const roleFilter = ref('all');
const statusFilter = ref('all');
const page = ref(1);
const pageSize = 10;
const uiToast = useUiToastStore();

const form = reactive({
  organization_id: '',
  department_id: '',
  full_name: '',
  email: '',
  password: '',
  role: 'user',
  status: 'active'
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const resetForm = () => {
  editingId.value = null;
  form.organization_id = '';
  form.department_id = '';
  form.full_name = '';
  form.email = '';
  form.password = '';
  form.role = 'user';
  form.status = 'active';
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
  editingId.value = row.id;
  form.organization_id = row.organization_id ?? '';
  form.department_id = row.department_id ?? '';
  form.full_name = row.full_name ?? '';
  form.email = row.email ?? '';
  form.password = '';
  form.role = row.role ?? 'user';
  form.status = row.status ?? 'active';
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
      organization_id: form.organization_id === '' ? null : Number(form.organization_id),
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
    error.value = extractApiError(requestError, 'Failed to save user');
    uiToast.error(error.value);
  } finally {
    saving.value = false;
  }
};

const deleteUser = async (row) => {
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
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">User Management</h1>
        <p class="text-sm text-slate-600">Create and maintain user accounts and access roles.</p>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="fetchUsers">
        Refresh
      </button>
    </header>

    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold text-slate-900">{{ editingId ? 'Edit User' : 'Create User' }}</h2>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="saveUser">
        <input v-model="form.full_name" placeholder="Full name" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
        <input v-model="form.email" type="email" placeholder="Email" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
        <input v-model="form.password" type="password" placeholder="Password" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
        <input v-model="form.organization_id" placeholder="Organization ID (optional)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
        <input v-model="form.department_id" placeholder="Department ID (optional)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
        <select v-model="form.role" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <select v-model="form.status" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
        <div class="md:col-span-2 flex gap-2">
          <button type="submit" :disabled="saving" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
            {{ saving ? 'Saving...' : editingId ? 'Update User' : 'Create User' }}
          </button>
          <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700" @click="resetForm">
            Clear
          </button>
        </div>
      </form>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-bold text-slate-900">Users</h2>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model="search" placeholder="Search name/email" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <select v-model="roleFilter" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All roles</option>
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
          <select v-model="statusFilter" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All statuses</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </div>

      <p v-if="loading" class="text-sm text-slate-500">Loading users...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="filteredUsers.length === 0" class="text-sm text-slate-500">No users found.</p>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="text-slate-500">
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
            <tr v-for="row in paginatedUsers" :key="row.id" class="border-t border-slate-100">
              <td class="py-2 pr-3">{{ row.full_name }}</td>
              <td class="py-2 pr-3">{{ row.email }}</td>
              <td class="py-2 pr-3">
                <select
                  class="rounded border border-slate-300 px-2 py-1 text-xs"
                  :value="row.role"
                  @change="updateUserRoleQuick(row, $event.target.value)"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td class="py-2 pr-3">{{ row.status }}</td>
              <td class="py-2 pr-3">{{ row.organization_id ?? 'N/A' }}</td>
              <td class="py-2 pr-3">{{ row.department_id ?? 'N/A' }}</td>
              <td class="py-2">
                <div class="flex gap-2">
                  <button class="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700" @click="startEdit(row)">Edit</button>
                  <button class="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" @click="deleteUser(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 flex items-center justify-between text-xs text-slate-600">
        <p>Showing {{ paginatedUsers.length }} of {{ filteredUsers.length }} users</p>
        <div class="flex items-center gap-2">
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="page <= 1" @click="goToPage(page - 1)">Prev</button>
          <span>Page {{ page }} / {{ totalPages }}</span>
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</button>
        </div>
      </div>
    </section>
  </section>
</template>
