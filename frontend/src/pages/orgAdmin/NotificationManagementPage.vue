<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import { useUiToastStore } from '../../stores/uiToast';
import { useSessionStore } from '../../stores/session';

const loading = ref(false);
const saving = ref(false);
const error = ref('');
const notifications = ref([]);
const complaints = ref([]);
const users = ref([]);
const search = ref('');
const readFilter = ref('all');
const page = ref(1);
const pageSize = 8;
const uiToast = useUiToastStore();
const session = useSessionStore();
const isOrgAdmin = computed(() => session.currentUser?.role === 'org_admin');
const titleClass = computed(() => (isOrgAdmin.value ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-slate-900'));
const metaClass = computed(() => (isOrgAdmin.value ? 'text-sm text-white/70' : 'text-sm text-slate-600'));
const panelClass = computed(() => (isOrgAdmin.value ? 'org-admin-panel-card' : 'rounded-2xl border border-slate-200 bg-white p-4'));
const inputClass = computed(() => (isOrgAdmin.value ? 'org-admin-input' : 'rounded-lg border border-slate-300 px-3 py-2 text-sm'));
const selectClass = computed(() => (isOrgAdmin.value ? 'org-admin-select' : 'rounded-lg border border-slate-300 px-3 py-2 text-sm'));
const refreshButtonClass = computed(() => (isOrgAdmin.value ? 'org-admin-outline-btn' : 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700'));
const primaryButtonClass = computed(() => (isOrgAdmin.value ? 'org-admin-btn disabled:opacity-70' : 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white'));
const secondaryButtonClass = computed(() => (isOrgAdmin.value ? 'org-admin-outline-btn' : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700'));
const tableClass = computed(() => (isOrgAdmin.value ? 'org-admin-table min-w-full text-left text-sm' : 'min-w-full text-left text-sm'));
const tableHeadClass = computed(() => (isOrgAdmin.value ? 'text-white/60' : 'text-slate-500'));
const tableRowClass = computed(() => (isOrgAdmin.value ? 'border-t border-white/10' : 'border-t border-slate-100'));
const infoTextClass = computed(() => (isOrgAdmin.value ? 'text-sm text-white/70' : 'text-sm text-slate-500'));
const footerClass = computed(() => (isOrgAdmin.value ? 'mt-3 flex items-center justify-between text-xs text-white/70' : 'mt-3 flex items-center justify-between text-xs text-slate-600'));
const pagerButtonClass = computed(() => (isOrgAdmin.value ? 'rounded border border-white/20 bg-white/10 px-2 py-1 text-white disabled:opacity-50' : 'rounded border border-slate-300 px-2 py-1 disabled:opacity-50'));
const successActionClass = computed(() => (
  isOrgAdmin.value
    ? 'rounded border border-emerald-700 bg-emerald-600 px-2 py-1 text-xs font-semibold text-white shadow-sm'
    : 'rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700'
));
const deleteButtonClass = computed(() => (
  isOrgAdmin.value
    ? 'rounded border border-red-700 bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow-sm'
    : 'rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700'
));

const form = reactive({
  user_id: '',
  complaint_id: '',
  type: '',
  message: '',
  is_read: false
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const resetForm = () => {
  form.user_id = '';
  form.complaint_id = '';
  form.type = '';
  form.message = '';
  form.is_read = false;
};

const fetchNotifications = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [notificationRes, complaintRes, userRes] = await Promise.all([
      api.get('/notification'),
      api.get('/complaint'),
      api.get('/users')
    ]);
    notifications.value = ensureSuccess(unwrapResponse(notificationRes), 'Failed to fetch notifications') || [];
    complaints.value = ensureSuccess(unwrapResponse(complaintRes), 'Failed to fetch complaints') || [];
    users.value = ensureSuccess(unwrapResponse(userRes), 'Failed to fetch users') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch notifications');
  } finally {
    loading.value = false;
  }
};

const createNotification = async () => {
  if (!form.type.trim() || !form.message.trim()) {
    error.value = 'type and message are required.';
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    await api.post('/notification', {
      user_id: form.user_id ? Number(form.user_id) : null,
      complaint_id: form.complaint_id ? Number(form.complaint_id) : null,
      type: form.type.trim(),
      message: form.message.trim(),
      is_read: form.is_read ? 1 : 0
    });
    resetForm();
    uiToast.success('Notification created successfully.');
    await fetchNotifications();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to create notification');
    uiToast.error(error.value);
  } finally {
    saving.value = false;
  }
};

const markAsRead = async (row) => {
  error.value = '';
  try {
    await api.patch(`/notification/${row.id}/read`);
    uiToast.success('Notification marked as read.');
    await fetchNotifications();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to mark notification as read');
    uiToast.error(error.value);
  }
};

const deleteNotification = async (row) => {
  const ok = window.confirm(`Delete notification #${row.id}?`);
  if (!ok) return;
  error.value = '';
  try {
    await api.delete(`/notification/${row.id}`);
    uiToast.success('Notification deleted successfully.');
    await fetchNotifications();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete notification');
    uiToast.error(error.value);
  }
};

const userNameById = computed(() => {
  const map = new Map();
  for (const row of users.value) map.set(Number(row.id), row.full_name || row.email || `User #${row.id}`);
  return map;
});

const complaintTitleById = computed(() => {
  const map = new Map();
  for (const row of complaints.value) map.set(Number(row.id), row.title || `Complaint #${row.id}`);
  return map;
});

const filteredNotifications = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return notifications.value.filter((row) => {
    const matchesText =
      !keyword ||
      String(row.type || '').toLowerCase().includes(keyword) ||
      String(row.message || '').toLowerCase().includes(keyword);
    const matchesRead =
      readFilter.value === 'all' ||
      (readFilter.value === 'read' && Number(row.is_read) === 1) ||
      (readFilter.value === 'unread' && Number(row.is_read) === 0);
    return matchesText && matchesRead;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredNotifications.value.length / pageSize)));
const currentPage = computed(() => Math.min(page.value, totalPages.value));
const paginatedNotifications = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredNotifications.value.slice(start, start + pageSize);
});
const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

onMounted(fetchNotifications);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 :class="titleClass">Notification Management</h1>
        <p :class="metaClass">Monitor notifications generated automatically for users and complaints.</p>
      </div>
      <button :class="`${refreshButtonClass} w-full sm:w-auto`" @click="fetchNotifications">
        Refresh
      </button>
    </header>
    <section v-if="!isOrgAdmin" :class="panelClass">
      <h2 :class="isOrgAdmin ? 'mb-3 text-lg font-bold text-white' : 'mb-3 text-lg font-bold text-slate-900'">Create Notification</h2>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="createNotification">
        <select v-model="form.user_id" :class="selectClass">
          <option value="">Target user (optional)</option>
          <option v-for="row in users" :key="row.id" :value="String(row.id)">
            {{ row.full_name }} (#{{ row.id }})
          </option>
        </select>
        <select v-model="form.complaint_id" :class="selectClass">
          <option value="">Linked complaint (optional)</option>
          <option v-for="row in complaints" :key="row.id" :value="String(row.id)">
            #{{ row.id }} - {{ row.title || 'Untitled' }}
          </option>
        </select>
        <input v-model="form.type" placeholder="Type (e.g. complaint_update)" :class="inputClass">
        <label :class="isOrgAdmin ? 'inline-flex items-center gap-2 text-sm text-white/80' : 'inline-flex items-center gap-2 text-sm text-slate-700'">
          <input v-model="form.is_read" type="checkbox" class="h-4 w-4 rounded border-slate-300">
          Mark as read on create
        </label>
        <textarea v-model="form.message" placeholder="Message" :class="`${inputClass} md:col-span-2`" rows="2" />
        <div class="flex flex-col gap-2 sm:flex-row">
          <button :disabled="saving" type="submit" :class="`${primaryButtonClass} w-full sm:w-auto`">
            {{ saving ? 'Saving...' : 'Create Notification' }}
          </button>
          <button type="button" :class="`${secondaryButtonClass} w-full sm:w-auto`" @click="resetForm">
            Clear
          </button>
        </div>
      </form>
      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
    </section>

    <section v-else :class="panelClass">
      <h2 :class="isOrgAdmin ? 'mb-3 text-lg font-bold text-white' : 'mb-3 text-lg font-bold text-slate-900'">Automatic Notifications</h2>
      <p :class="infoTextClass">
        Notifications are generated automatically from complaint activity. Use the table below to mark items as read or delete them.
      </p>
    </section>

    <section :class="panelClass">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 :class="isOrgAdmin ? 'text-lg font-bold text-white' : 'text-lg font-bold text-slate-900'">Notifications</h2>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model="search" placeholder="Search type/message..." :class="`${inputClass} w-full sm:min-w-[14rem]`">
          <select v-model="readFilter" :class="`${selectClass} w-full sm:min-w-[11rem]`">
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      <p v-if="loading" :class="infoTextClass">Loading notifications...</p>
      <p v-else-if="filteredNotifications.length === 0" :class="infoTextClass">No notifications found.</p>

      <div v-else class="-mx-1 overflow-x-auto pb-1">
        <table :class="tableClass">
          <thead :class="tableHeadClass">
            <tr>
              <th class="pb-2 pr-3">ID</th>
              <th class="pb-2 pr-3">Type</th>
              <th class="pb-2 pr-3">Message</th>
              <th class="pb-2 pr-3">User</th>
              <th class="pb-2 pr-3">Complaint</th>
              <th class="pb-2 pr-3">Status</th>
              <th class="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginatedNotifications" :key="row.id" :class="tableRowClass">
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white' : ''">#{{ row.id }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.type }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.message }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ userNameById.get(Number(row.user_id)) || row.user_id || 'All users' }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ complaintTitleById.get(Number(row.complaint_id)) || row.complaint_id || 'N/A' }}</td>
              <td class="py-2 pr-3" :class="isOrgAdmin ? 'text-white/80' : ''">{{ Number(row.is_read) === 1 ? 'read' : 'unread' }}</td>
              <td class="py-2">
                <div class="app-action-row flex flex-wrap gap-2">
                  <button
                    v-if="Number(row.is_read) === 0"
                    :class="successActionClass"
                    @click="markAsRead(row)"
                  >
                    Mark Read
                  </button>
                  <button :class="deleteButtonClass" @click="deleteNotification(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredNotifications.length > 0" :class="`${footerClass} flex-col gap-2 sm:flex-row`">
        <p>Showing {{ paginatedNotifications.length }} of {{ filteredNotifications.length }} notifications</p>
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button :class="pagerButtonClass" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
          <span>Page {{ currentPage }} / {{ totalPages }}</span>
          <button :class="pagerButtonClass" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>
    </section>
      </div>
    </div>
  </section>
</template>
