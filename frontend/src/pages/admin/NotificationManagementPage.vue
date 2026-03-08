<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import { useUiToastStore } from '../../stores/uiToast';

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
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Notification Management</h1>
        <p class="text-sm text-slate-600">Create and manage platform notifications for users and complaints.</p>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="fetchNotifications">
        Refresh
      </button>
    </header>
    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold text-slate-900">Create Notification</h2>
      <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="createNotification">
        <select v-model="form.user_id" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Target user (optional)</option>
          <option v-for="row in users" :key="row.id" :value="String(row.id)">
            {{ row.full_name }} (#{{ row.id }})
          </option>
        </select>
        <select v-model="form.complaint_id" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Linked complaint (optional)</option>
          <option v-for="row in complaints" :key="row.id" :value="String(row.id)">
            #{{ row.id }} - {{ row.title || 'Untitled' }}
          </option>
        </select>
        <input v-model="form.type" placeholder="Type (e.g. complaint_update)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <label class="inline-flex items-center gap-2 text-sm text-slate-700">
          <input v-model="form.is_read" type="checkbox" class="h-4 w-4 rounded border-slate-300">
          Mark as read on create
        </label>
        <textarea v-model="form.message" placeholder="Message" class="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows="2" />
        <div class="flex gap-2">
          <button :disabled="saving" type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            {{ saving ? 'Saving...' : 'Create Notification' }}
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
        <h2 class="text-lg font-bold text-slate-900">Notifications</h2>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model="search" placeholder="Search type/message..." class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <select v-model="readFilter" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      <p v-if="loading" class="text-sm text-slate-500">Loading notifications...</p>
      <p v-else-if="filteredNotifications.length === 0" class="text-sm text-slate-500">No notifications found.</p>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="text-slate-500">
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
            <tr v-for="row in paginatedNotifications" :key="row.id" class="border-t border-slate-100">
              <td class="py-2 pr-3">#{{ row.id }}</td>
              <td class="py-2 pr-3">{{ row.type }}</td>
              <td class="py-2 pr-3">{{ row.message }}</td>
              <td class="py-2 pr-3">{{ userNameById.get(Number(row.user_id)) || row.user_id || 'All users' }}</td>
              <td class="py-2 pr-3">{{ complaintTitleById.get(Number(row.complaint_id)) || row.complaint_id || 'N/A' }}</td>
              <td class="py-2 pr-3">{{ Number(row.is_read) === 1 ? 'read' : 'unread' }}</td>
              <td class="py-2">
                <div class="flex gap-2">
                  <button
                    v-if="Number(row.is_read) === 0"
                    class="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                    @click="markAsRead(row)"
                  >
                    Mark Read
                  </button>
                  <button class="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" @click="deleteNotification(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredNotifications.length > 0" class="mt-3 flex items-center justify-between text-xs text-slate-600">
        <p>Showing {{ paginatedNotifications.length }} of {{ filteredNotifications.length }} notifications</p>
        <div class="flex items-center gap-2">
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
          <span>Page {{ currentPage }} / {{ totalPages }}</span>
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>
    </section>
  </section>
</template>
