import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api, { extractApiError, unwrapResponse } from '../services/api.js';

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([]);
  const loading = ref(false);
  const error = ref('');
  const markingId = ref(null);
  const initialized = ref(false);
  const lastFetchedAt = ref(0);

  const ensureSuccess = (payload, fallbackMessage) => {
    if (!payload?.success) {
      throw new Error(payload?.message || fallbackMessage);
    }
    return payload.data;
  };

  const unreadNotifications = computed(() =>
    notifications.value.filter((item) => Number(item.is_read) !== 1)
  );

  const readNotifications = computed(() =>
    notifications.value.filter((item) => Number(item.is_read) === 1)
  );

  const unreadCount = computed(() => unreadNotifications.value.length);

  const recentNotifications = computed(() => notifications.value.slice(0, 6));

  const reset = () => {
    notifications.value = [];
    error.value = '';
    loading.value = false;
    markingId.value = null;
    initialized.value = false;
    lastFetchedAt.value = 0;
  };

  const fetchNotifications = async ({ force = false, silent = false } = {}) => {
    const hasToken = Boolean(localStorage.getItem('token'));
    if (!hasToken) {
      reset();
      return [];
    }

    const now = Date.now();
    if (!force && initialized.value && now - lastFetchedAt.value < 30000) {
      return notifications.value;
    }

    if (!silent) {
      loading.value = true;
    }
    error.value = '';

    try {
      const response = await api.get('/notification');
      notifications.value = ensureSuccess(
        unwrapResponse(response),
        'Failed to fetch notifications'
      ) || [];
      initialized.value = true;
      lastFetchedAt.value = Date.now();
      return notifications.value;
    } catch (requestError) {
      error.value = extractApiError(requestError, 'Failed to fetch notifications');
      throw requestError;
    } finally {
      loading.value = false;
    }
  };

  const markAsRead = async (itemOrId) => {
    const id = typeof itemOrId === 'object' ? itemOrId?.id : itemOrId;
    const item = notifications.value.find((row) => Number(row.id) === Number(id));

    if (!id || Number(item?.is_read) === 1) {
      return item || null;
    }

    markingId.value = Number(id);
    error.value = '';

    try {
      const response = await api.patch(`/notification/${id}/read`);
      const updated = ensureSuccess(
        unwrapResponse(response),
        'Failed to mark notification as read'
      );

      notifications.value = notifications.value.map((row) =>
        Number(row.id) === Number(updated.id) ? updated : row
      );
      lastFetchedAt.value = Date.now();
      return updated;
    } catch (requestError) {
      error.value = extractApiError(requestError, 'Failed to mark notification as read');
      throw requestError;
    } finally {
      markingId.value = null;
    }
  };

  return {
    notifications,
    loading,
    error,
    markingId,
    initialized,
    unreadNotifications,
    readNotifications,
    unreadCount,
    recentNotifications,
    fetchNotifications,
    markAsRead,
    reset
  };
});
