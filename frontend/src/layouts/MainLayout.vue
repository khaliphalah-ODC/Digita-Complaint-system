<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { RouterLink, RouterView } from 'vue-router';
import SidebarNav from '../components/SidebarNav.vue';
import AppToast from '../components/AppToast.vue';
import { useSessionStore } from '../stores/session';
import { useNotificationStore } from '../stores/notifications.js';

const session = useSessionStore();
const notificationStore = useNotificationStore();
const route = useRoute();
const router = useRouter();
const { unreadCount } = storeToRefs(notificationStore);

const isLoggedIn = computed(() => session.isLoggedIn);
const isSuperAdmin = computed(() => session.currentUser?.role === 'super_admin');
const isOrgAdmin = computed(() => session.currentUser?.role === 'org_admin');
const isAdminWorkspace = computed(() => isSuperAdmin.value || isOrgAdmin.value);
const isStandardUserShell = computed(() => isLoggedIn.value && !isSuperAdmin.value && !isOrgAdmin.value);
const isOrganizationLinkedUser = computed(
  () => session.currentUser?.role === 'user' && Boolean(session.currentUser?.organization_id)
);
const shouldShowUserNotificationBell = computed(
  () => isLoggedIn.value && !isSuperAdmin.value && !isOrgAdmin.value
);

const workspaceLabel = computed(() => {
  if (!isLoggedIn.value) return 'Public Workspace';
  if (isSuperAdmin.value) return 'Super Admin Workspace';
  if (isOrgAdmin.value) return 'Organization Admin Workspace';
  return 'User Workspace';
});

const workspaceTitle = computed(() => {
  if (isOrganizationLinkedUser.value && session.currentOrganizationName) {
    return session.currentOrganizationName;
  }
  return 'Complaint Management System';
});

const paddingClass = computed(() => (
  isLoggedIn.value
    ? 'app-shell-gutter flex-1 pb-4 pt-24 sm:pb-5 sm:pt-24 md:pb-6 md:pt-28 lg:pb-8 lg:pt-24'
    : 'app-shell-gutter flex-1 pb-4 pt-28 sm:pb-5 sm:pt-28 md:pb-6 md:pt-32 lg:pb-8 lg:pt-36'
));

const contentClass = computed(() => (
  `${isAdminWorkspace.value ? 'app-admin-main ' : ''}${isOrgAdmin.value ? 'org-admin-shell ' : ''}${isStandardUserShell.value ? 'user-shell ' : ''}${paddingClass.value}`
));

const mobileNavOpen = ref(false);
const showLogoutConfirm = ref(false);

const confirmLogout = () => {
  showLogoutConfirm.value = false;
  session.logout();
  router.push('/');
};

const profileAvatar = computed(() => {
  return (
    session.currentUser?.avatar_url ||
    session.currentUser?.avatar ||
    session.currentUser?.profile_image ||
    session.currentUser?.photo_url ||
    ''
  );
});

const layoutRootClass = computed(() => (
  `${isAdminWorkspace.value ? 'app-admin-shell ' : ''}${isStandardUserShell.value ? 'user-shell ' : ''}${isOrgAdmin.value ? 'org-admin-shell ' : ''}min-h-screen w-full overflow-x-hidden bg-transparent text-[var(--app-text-color)]`
));

// const mainClass = computed(() => {
//   if (!isLoggedIn.value) {
//     return 'flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden';
//   }

//   if (isSuperAdmin.value) {
//     return 'flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden lg:pl-24 lg:bg-transparent';
//   }

//   return 'flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden lg:pl-[18rem]';
// });
const mainClass = computed(() => {
  if (isLoggedIn.value) {
    return 'flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden lg:pl-[5.5rem]';
  }

  return 'flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden';
});
// const headerWrapClass = computed(() => {
//   if (!isLoggedIn.value) {
//     return 'fixed inset-x-0 top-0 z-40';
//   }

//   if (isSuperAdmin.value) {
//     return 'fixed inset-x-0 top-0 z-40 lg:left-24';
//   }

//   return 'fixed inset-x-0 top-0 z-40 lg:left-[18rem]';
// });
const headerWrapClass = computed(() => {
  if (isLoggedIn.value) {
    return 'fixed inset-x-0 top-0 z-40 lg:left-[5.5rem]';
  }

  return 'fixed inset-x-0 top-0 z-40';
});
const mobileMenuButtonClass = computed(() => (
  'inline-flex min-h-[42px] items-center gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] px-3.5 py-2 text-sm font-semibold text-[var(--app-nav-text)] shadow-sm hover:bg-[var(--app-nav-hover)] hover:text-[var(--app-title-color)] lg:hidden'
));

const mobileOverlayClass = computed(() => 'fixed inset-0 z-50 bg-[rgba(17,28,48,0.26)] backdrop-blur-sm lg:hidden');

const mobileDrawerClass = computed(() => 'app-nav-sidebar h-full w-[86vw] max-w-[20rem] border-r p-4');

const closeMobileNav = () => {
  mobileNavOpen.value = false;
};

const syncNotifications = (force = false) => {
  if (!shouldShowUserNotificationBell.value) {
    notificationStore.reset();
    return;
  }

  void notificationStore.fetchNotifications({
    force,
    silent: !force
  });
};

watch(() => route.fullPath, closeMobileNav);
watch(
  () => [session.isLoggedIn, session.currentUser?.role],
  () => {
    syncNotifications(false);
  },
  { immediate: true }
);
watch(
  () => route.fullPath,
  () => {
    if (shouldShowUserNotificationBell.value) {
      syncNotifications(route.path === '/notifications');
    }
  }
);

onMounted(() => {
  session.fetchCurrentUser();
  syncNotifications(false);
});
</script>

<template>
  <div :class="layoutRootClass">
    <AppToast />

    <div class="relative flex min-h-screen w-full">
      <SidebarNav v-if="isLoggedIn" @logout="showLogoutConfirm = true" />

      <div
        v-if="isLoggedIn && mobileNavOpen"
        :class="mobileOverlayClass"
        @click.self="closeMobileNav"
      >
        <div :class="mobileDrawerClass">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)]">
                Navigation
              </p>
              <p class="truncate text-sm font-semibold text-[var(--app-title-color)]">
                {{ workspaceLabel }}
              </p>
            </div>

            <button
              class="inline-flex min-h-[40px] items-center rounded-[var(--app-radius-md)] border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-nav-text)] shadow-sm hover:bg-[var(--app-nav-hover)]"
              @click="closeMobileNav"
            >
              Close
            </button>
          </div>

          <SidebarNav mobile @logout="showLogoutConfirm = true" @navigate="closeMobileNav" />
        </div>
      </div>

      <main :class="mainClass">
        <div :class="headerWrapClass">
          <header class="app-shell-gutter border-b border-[var(--app-nav-border)] bg-[rgba(255,255,255,0.88)] py-3 shadow-[var(--app-shadow-sm)] backdrop-blur-2xl md:shadow-[var(--app-shadow)]">
            <div class="app-content-wrap flex flex-wrap items-center justify-between gap-3">
              <div class="flex min-w-0 items-start gap-3">
                <button
                  v-if="isLoggedIn"
                  :class="mobileMenuButtonClass"
                  @click="mobileNavOpen = true"
                >
                  <font-awesome-icon :icon="['fas', 'bars']" />
                  Menu
                </button>

                <div class="min-w-0">
                  <p class="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">
                    {{ workspaceLabel }}
                  </p>
                  <p class="truncate text-sm font-semibold text-[var(--app-title-color)] sm:text-base">
                    {{ workspaceTitle }}
                  </p>
                </div>
              </div>

              <div v-if="isLoggedIn" class="flex min-w-0 items-center gap-2 sm:gap-3">
                <RouterLink
                  v-if="shouldShowUserNotificationBell"
                  to="/notifications"
                  class="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-nav-border)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(239,244,249,0.92))] text-[var(--app-primary)] shadow-[var(--app-shadow-sm)] hover:-translate-y-0.5 hover:border-[var(--app-primary)]/20 hover:text-[var(--app-primary-ink)]"
                  title="Notifications"
                >
                  <font-awesome-icon :icon="['fas', 'bell']" class="text-sm" />
                  <span
                    v-if="unreadCount > 0"
                    class="absolute -right-1.5 -top-1.5 inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--app-primary),var(--app-accent))] px-1.5 py-0.5 text-[0.64rem] font-bold leading-none text-white shadow-[var(--app-shadow-sm)] ring-2 ring-white"
                  >
                    {{ unreadCount > 99 ? '99+' : unreadCount }}
                  </span>
                  <span
                    v-if="unreadCount > 0"
                    class="absolute inset-0 rounded-full border border-[var(--app-primary)]/10 opacity-0 transition group-hover:opacity-100"
                  ></span>
                </RouterLink>

                <div class="hidden min-w-0 text-right md:block">
                  <p class="truncate text-sm font-semibold text-[var(--app-title-color)]">
                    {{ session.currentUser?.full_name || 'User' }}
                  </p>
                  <p class="truncate text-xs text-[var(--app-muted-color)]">
                    {{ session.currentUser?.email || 'No email' }}
                  </p>
                </div>

                <img
                  v-if="profileAvatar"
                  :src="profileAvatar"
                  alt="User Avatar"
                  class="hidden h-9 w-9 rounded-full border border-[var(--app-line)] object-cover md:block md:h-10 md:w-10"
                >

                <div
                  v-else
                  class="hidden h-9 w-9 rounded-full bg-[var(--app-primary)] text-center text-sm font-bold leading-9 text-white md:block md:h-10 md:w-10 md:leading-10"
                >
                  {{ session.userInitials }}
                </div>

                <button
                  class="hidden min-h-[40px] items-center rounded-[var(--app-radius-md)] border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-nav-text)] hover:bg-[var(--app-nav-hover)] xl:inline-flex"
                  @click="showLogoutConfirm = true"
                >
                  Logout
                </button>
              </div>

              <div v-else class="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <RouterLink
                  to="/signin"
                  class="inline-flex min-h-[40px] items-center rounded-[var(--app-radius-md)] border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-nav-text)] hover:bg-[var(--app-nav-hover)]"
                >
                  Login
                </RouterLink>
                <RouterLink
                  to="/signup"
                  class="inline-flex min-h-[40px] items-center rounded-[var(--app-radius-md)] bg-[var(--app-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--app-primary-ink)]"
                >
                  Sign Up
                </RouterLink>
              </div>
            </div>
          </header>
        </div>

        <section :class="contentClass">
          <RouterView />
        </section>
      </main>
    </div>

    <div v-if="showLogoutConfirm" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4">
      <div class="app-modal-panel w-full max-w-sm p-6">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Confirm Logout</h3>
            <p class="mt-0.5 text-sm text-slate-500">Are you sure you want to log out?</p>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            class="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            @click="showLogoutConfirm = false"
          >
            Cancel
          </button>
          <button
            class="flex-1 rounded-full bg-[var(--app-primary)] py-2.5 text-sm font-semibold text-white shadow-[var(--app-shadow-sm)] transition hover:bg-[var(--app-primary-ink)]"
            @click="confirmLogout"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
