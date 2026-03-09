<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import { useSessionStore } from '../../stores/session';
import { useUiToastStore } from '../../stores/uiToast';

const session = useSessionStore();
const uiToast = useUiToastStore();
const loadingUsers = ref(false);
const loadingComplaints = ref(false);
const saving = ref(false);
const users = ref([]);
const complaints = ref([]);
const error = ref('');

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  status: 'active'
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) {
    throw new Error(payload?.message || fallbackMessage);
  }
  return payload.data;
};

const fetchUsers = async () => {
  loadingUsers.value = true;
  error.value = '';
  try {
    const response = await api.get('/users');
    users.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch users') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch users');
  } finally {
    loadingUsers.value = false;
  }
};

const fetchComplaints = async () => {
  loadingComplaints.value = true;
  error.value = '';
  try {
    const response = await api.get('/complaint');
    complaints.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch complaints') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch complaints');
  } finally {
    loadingComplaints.value = false;
  }
};

const createUser = async () => {
  error.value = '';

  if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
    error.value = 'full_name, email, and password are required.';
    return;
  }

  saving.value = true;
  try {
    await api.post('/users', {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      status: form.status,
      role: 'user'
    });
    uiToast.success('User created successfully for your organization.');
    form.full_name = '';
    form.email = '';
    form.password = '';
    form.status = 'active';
    await fetchUsers();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to create user');
    uiToast.error(error.value);
  } finally {
    saving.value = false;
  }
};

const myStats = computed(() => {
  const rows = complaints.value || [];
  return {
    totalComplaints: rows.length,
    totalUsers: users.value.length,
    open: rows.filter((row) => row.status === 'submitted' || row.status === 'in_review').length,
    resolved: rows.filter((row) => row.status === 'resolved' || row.status === 'closed').length
  };
});

onMounted(() => {
  fetchUsers();
  fetchComplaints();
});
</script>

<template>
  <section class="w-full space-y-5">
    <header>
      <p class="app-kicker">Organization Admin Workspace</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Welcome, {{ session.currentUser?.full_name || 'Organization Admin' }}</h1>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Manage users in your organization and review organization complaint traffic.
      </p>
    </header>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <article class="app-ink-card rounded-[28px] p-5">
        <p class="text-xs uppercase tracking-wide text-slate-500">Organization Users</p>
        <p class="mt-2 text-3xl font-black text-slate-900">{{ loadingUsers ? '...' : myStats.totalUsers }}</p>
      </article>
      <article class="app-ink-card rounded-[28px] p-5">
        <p class="text-xs uppercase tracking-wide text-slate-500">Organization Complaints</p>
        <p class="mt-2 text-3xl font-black text-[var(--app-accent)]">{{ loadingComplaints ? '...' : myStats.totalComplaints }}</p>
      </article>
      <article class="app-ink-card rounded-[28px] p-5">
        <p class="text-xs uppercase tracking-wide text-slate-500">Resolved</p>
        <p class="mt-2 text-3xl font-black text-emerald-600">{{ loadingComplaints ? '...' : myStats.resolved }}</p>
      </article>
    </section>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr,1.05fr]">
      <section class="space-y-5">
        <section class="app-shell-panel rounded-[30px] p-5">
          <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Create User</h2>
              <p class="text-sm text-slate-600">New users are automatically attached to your organization.</p>
            </div>
            <button class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="fetchUsers">
              Refresh Users
            </button>
          </div>

          <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="createUser">
            <input v-model="form.full_name" placeholder="Full name" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
            <input v-model="form.email" type="email" placeholder="Email" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
            <input v-model="form.password" type="password" placeholder="Password" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 md:col-span-2">
            <select v-model="form.status" class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <div class="flex items-center">
              <span class="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Role: user</span>
            </div>
            <div class="md:col-span-2">
              <button type="submit" :disabled="saving" class="rounded-full bg-[var(--app-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)] disabled:opacity-70">
                {{ saving ? 'Creating...' : 'Create User' }}
              </button>
            </div>
          </form>
        </section>

        <section class="app-shell-panel rounded-[30px] p-5">
          <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Users List</h2>
              <p class="text-sm text-slate-600">Only users in your organization are returned by the backend.</p>
            </div>
          </div>

          <p v-if="loadingUsers" class="text-sm text-slate-500">Loading users...</p>
          <p v-else-if="users.length === 0" class="text-sm text-slate-500">No users found in your organization.</p>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="text-slate-500">
                <tr>
                  <th class="pb-2 pr-3">Name</th>
                  <th class="pb-2 pr-3">Email</th>
                  <th class="pb-2 pr-3">Role</th>
                  <th class="pb-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in users" :key="row.id" class="border-t border-slate-100">
                  <td class="py-2 pr-3">{{ row.full_name }}</td>
                  <td class="py-2 pr-3">{{ row.email }}</td>
                  <td class="py-2 pr-3">{{ row.role }}</td>
                  <td class="py-2 pr-3">{{ row.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section class="app-shell-panel rounded-[30px] p-5">
        <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Complaints List</h2>
            <p class="text-sm text-slate-600">Complaint records limited to your organization scope.</p>
          </div>
          <button class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="fetchComplaints">
            Refresh Complaints
          </button>
        </div>

        <p v-if="loadingComplaints" class="text-sm text-slate-500">Loading complaints...</p>
        <p v-else-if="complaints.length === 0" class="text-sm text-slate-500">No complaints found for your organization.</p>
        <div v-else class="space-y-3">
          <article
            v-for="item in complaints.slice(0, 8)"
            :key="item.id"
            class="app-ink-card rounded-[24px] p-4"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900">{{ item.title || 'Untitled Complaint' }}</h3>
                <p class="mt-1 text-sm text-slate-700">{{ item.complaint }}</p>
                <p class="mt-2 text-xs text-slate-500">Tracking: {{ item.tracking_code || 'N/A' }}</p>
                <p class="text-xs text-slate-500">Reporter: {{ item.user_full_name || item.anonymous_label || 'Anonymous' }}</p>
              </div>
              <div class="flex flex-col gap-2">
                <span class="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">{{ item.priority }}</span>
                <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{{ item.status }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>
  </section>
</template>
