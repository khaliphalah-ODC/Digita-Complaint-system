<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { authApi, complaintsApi, extractApiError, notificationsApi } from '../../services/api';
import MobileDataCardList from '../../components/MobileDataCardList.vue';
import DataTable from '../../components/ui/DataTable.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import FormField from '../../components/ui/FormField.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { useUiToastStore } from '../../stores/uiToast';
import { useNotificationStore } from '../../stores/notifications.js';
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
const notificationStore = useNotificationStore();
const isOrgAdmin = computed(() => session.currentUser?.role === 'org_admin');
const titleClass = computed(() => (isOrgAdmin.value ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-slate-900'));
const metaClass = computed(() => (isOrgAdmin.value ? 'text-sm text-white/70' : 'text-sm text-slate-600'));
const panelClass = computed(() => (isOrgAdmin.value ? 'org-admin-panel-card' : 'rounded-2xl border border-slate-200 bg-white p-4'));
const inputClass = computed(() => (isOrgAdmin.value ? 'org-admin-input' : 'rounded-lg border border-slate-300 px-3 py-2 text-sm'));
const selectClass = computed(() => (isOrgAdmin.value ? 'org-admin-select' : 'rounded-lg border border-slate-300 px-3 py-2 text-sm'));
const refreshButtonClass = computed(() => (isOrgAdmin.value ? 'org-admin-outline-btn' : 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700'));
const primaryButtonClass = computed(() => (isOrgAdmin.value ? 'org-admin-btn disabled:opacity-70' : 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white'));
const secondaryButtonClass = computed(() => (isOrgAdmin.value ? 'org-admin-outline-btn' : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700'));
const tableClass = computed(() => (isOrgAdmin.value ? 'org-admin-table org-admin-table-responsive min-w-full text-left text-sm' : 'app-table-responsive min-w-full text-left text-sm'));
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
    const [notificationRows, complaintRows, userRows] = await Promise.all([
      notificationsApi.list(),
      complaintsApi.list(),
      authApi.listUsers()
    ]);
    notifications.value = notificationRows || [];
    complaints.value = complaintRows || [];
    users.value = userRows || [];
    if (isOrgAdmin.value) {
      notificationStore.notifications = [...notifications.value];
      notificationStore.initialized = true;
    }
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
    await notificationsApi.create({
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
    await notificationsApi.markRead(row.id);
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
    await notificationsApi.remove(row.id);
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
const mobileCardFields = [
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
  { key: 'message', label: 'Message' },
  { key: 'user', label: 'User' },
  { key: 'complaint', label: 'Complaint' },
  { key: 'status', label: 'Status' }
];
const tableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
  { key: 'message', label: 'Message' },
  { key: 'user', label: 'User' },
  { key: 'complaint', label: 'Complaint' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' }
];
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
        <FormField v-model="form.user_id" as="select" label="Target User" :input-class="selectClass">
          <template #options>
            <option value="">Target user (optional)</option>
            <option v-for="row in users" :key="row.id" :value="String(row.id)">
              {{ row.full_name }} (#{{ row.id }})
            </option>
          </template>
        </FormField>
        <FormField v-model="form.complaint_id" as="select" label="Complaint" :input-class="selectClass">
          <template #options>
            <option value="">Linked complaint (optional)</option>
            <option v-for="row in complaints" :key="row.id" :value="String(row.id)">
              #{{ row.id }} - {{ row.title || 'Untitled' }}
            </option>
          </template>
        </FormField>
        <FormField v-model="form.type" label="Type" placeholder="Type (e.g. complaint_update)" :input-class="inputClass" />
        <label :class="isOrgAdmin ? 'inline-flex items-center gap-2 text-sm text-white/80' : 'inline-flex items-center gap-2 text-sm text-slate-700'">
          <input v-model="form.is_read" type="checkbox" class="h-4 w-4 rounded border-slate-300">
          Mark as read on create
        </label>
        <FormField v-model="form.message" as="textarea" label="Message" placeholder="Message" :input-class="inputClass" wrapper-class="md:col-span-2" :rows="2" />
        <div class="flex flex-col gap-2 sm:flex-row">
          <button :disabled="saving" type="submit" :class="`${primaryButtonClass} w-full sm:w-auto`">
            {{ saving ? 'Saving...' : 'Create Notification' }}
          </button>
          <button type="button" :class="`${secondaryButtonClass} w-full sm:w-auto`" @click="resetForm">
            Clear
          </button>
        </div>
      </form>
      <ErrorState v-if="error" title="Could not save notification" :description="error" />
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
          <FormField v-model="search" placeholder="Search type/message..." :input-class="`${inputClass} w-full sm:min-w-[14rem]`" />
          <FormField v-model="readFilter" as="select" :input-class="`${selectClass} w-full sm:min-w-[11rem]`">
            <template #options>
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </template>
          </FormField>
        </div>
      </div>

      <LoadingSpinner v-if="loading" label="Loading notifications..." :label-class="infoTextClass" />
      <ErrorState v-else-if="error && isOrgAdmin" title="Could not load notifications" :description="error" />
      <EmptyState
        v-else-if="filteredNotifications.length === 0"
        title="No notifications found."
        description="Automatic complaint updates will appear here once activity starts."
        :title-class="isOrgAdmin ? 'font-semibold text-white' : 'font-semibold text-[var(--app-title-color)]'"
        :description-class="infoTextClass"
      />

      <MobileDataCardList
        v-else
        :items="paginatedNotifications"
        :fields="mobileCardFields"
        key-field="id"
      >
        <template #field-id="{ item }">
          <p class="font-medium text-[var(--app-title-color)]">#{{ item.id }}</p>
        </template>
        <template #field-type="{ item }">
          <p class="font-medium text-[var(--app-title-color)]">{{ item.type }}</p>
        </template>
        <template #field-message="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ item.message }}</p>
        </template>
        <template #field-user="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ userNameById.get(Number(item.user_id)) || item.user_id || 'All users' }}</p>
        </template>
        <template #field-complaint="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ complaintTitleById.get(Number(item.complaint_id)) || item.complaint_id || 'N/A' }}</p>
        </template>
        <template #field-status="{ item }">
          <StatusBadge :value="Number(item.is_read) === 1 ? 'read' : 'unread'" :tone="Number(item.is_read) === 1 ? 'neutral' : 'warning'" />
        </template>
        <template #actions="{ item }">
          <div class="app-action-row flex flex-wrap gap-2">
            <button
              v-if="Number(item.is_read) === 0"
              :class="successActionClass"
              @click="markAsRead(item)"
            >
              Mark Read
            </button>
            <button :class="deleteButtonClass" @click="deleteNotification(item)">Delete</button>
          </div>
        </template>
      </MobileDataCardList>

      <DataTable
        :columns="tableColumns"
        :rows="paginatedNotifications"
        :page="currentPage"
        :total-pages="totalPages"
        :total-items="filteredNotifications.length"
        :visible-count="paginatedNotifications.length"
        pagination-label="notifications"
        :table-class="tableClass"
        shell-class="app-table-shell overflow-x-auto pb-1"
        :footer-class="`${footerClass} flex-col gap-2 sm:flex-row`"
        :pager-button-class="pagerButtonClass"
        @update:page="goToPage"
      >
        <template #cell-id="{ row }">
          <span :class="isOrgAdmin ? 'text-white' : ''">#{{ row.id }}</span>
        </template>
        <template #cell-type="{ row }">
          <span :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.type }}</span>
        </template>
        <template #cell-message="{ row }">
          <span :class="isOrgAdmin ? 'text-white/80' : ''">{{ row.message }}</span>
        </template>
        <template #cell-user="{ row }">
          <span :class="isOrgAdmin ? 'text-white/80' : ''">{{ userNameById.get(Number(row.user_id)) || row.user_id || 'All users' }}</span>
        </template>
        <template #cell-complaint="{ row }">
          <span :class="isOrgAdmin ? 'text-white/80' : ''">{{ complaintTitleById.get(Number(row.complaint_id)) || row.complaint_id || 'N/A' }}</span>
        </template>
        <template #cell-status="{ row }">
          <StatusBadge :value="Number(row.is_read) === 1 ? 'read' : 'unread'" :tone="Number(row.is_read) === 1 ? 'neutral' : 'warning'" />
        </template>
        <template #cell-actions="{ row }">
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
        </template>
      </DataTable>
    </section>
      </div>
    </div>
  </section>
</template>
