<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useNotificationStore } from '../../stores/notifications.js';

const notificationStore = useNotificationStore();
const {
  loading,
  markingId,
  error,
  notifications,
  unreadNotifications,
  readNotifications
} = storeToRefs(notificationStore);

const fetchNotifications = () => notificationStore.fetchNotifications({ force: true });
const markAsRead = (item) => notificationStore.markAsRead(item);

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

onMounted(() => {
  void notificationStore.fetchNotifications({ force: true });
});
</script>

<template>
  <section class="w-full space-y-5">
    <header>
      <p class="app-kicker">User Workspace</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
        Notifications
      </h1>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Review updates about your complaints, responses, and support activity.
      </p>
    </header>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <article class="app-ink-card rounded-[28px] p-5">
        <p class="text-xs uppercase tracking-wide text-slate-500">Unread</p>
        <p class="mt-2 text-3xl font-black text-[var(--app-primary)]">
          {{ loading ? '...' : unreadNotifications.length }}
        </p>
      </article>

      <article class="app-ink-card rounded-[28px] p-5">
        <p class="text-xs uppercase tracking-wide text-slate-500">Read</p>
        <p class="mt-2 text-3xl font-black text-slate-900">
          {{ loading ? '...' : readNotifications.length }}
        </p>
      </article>
    </section>

    <section class="app-shell-panel rounded-[30px] p-5">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Inbox</h2>
          <p class="text-sm text-slate-600">Your latest complaint updates appear here.</p>
        </div>

        <button class="app-btn-secondary" @click="fetchNotifications">
          Refresh
        </button>
      </div>

      <p v-if="loading" class="text-sm text-slate-500">Loading notifications...</p>
      <p v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ error }}
      </p>
      <p v-else-if="notifications.length === 0" class="text-sm text-slate-500">
        No notifications yet.
      </p>

      <div v-else class="space-y-3">
        <article
          v-for="item in notifications"
          :key="item.id"
          class="rounded-[24px] border p-4"
          :class="Number(item.is_read) === 1
            ? 'border-slate-200 bg-slate-50'
            : 'border-[var(--app-primary)]/15 bg-white shadow-[0_10px_24px_rgba(17,28,48,0.06)]'"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="app-badge"
                  :class="Number(item.is_read) === 1
                    ? 'app-badge-neutral'
                    : 'bg-[var(--app-primary-mist)] text-[var(--app-primary-ink)]'"
                >
                  {{ Number(item.is_read) === 1 ? 'Read' : 'Unread' }}
                </span>

                <span class="app-badge app-badge-neutral">
                  {{ item.type || 'notification' }}
                </span>
              </div>

              <p class="mt-3 text-sm font-semibold text-slate-900">
                {{ item.message }}
              </p>

              <p class="mt-2 text-xs text-slate-500">
                {{ formatDate(item.created_at) }}
              </p>
            </div>

            <button
              v-if="Number(item.is_read) !== 1"
              class="app-btn-primary min-h-[36px] px-3 py-1.5 text-xs"
              :disabled="markingId === item.id"
              @click="markAsRead(item)"
            >
              {{ markingId === item.id ? 'Saving...' : 'Mark Read' }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
