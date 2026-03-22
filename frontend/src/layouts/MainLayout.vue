<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { RouterLink, RouterView } from 'vue-router';
import SidebarNav from '../components/SidebarNav.vue';
import AppToast from '../components/AppToast.vue';
import AppFooter from '../components/AppFooter.vue';
import { useSessionStore } from '../stores/session';

const session = useSessionStore();
const route = useRoute();

const isLoggedIn = computed(() => session.isLoggedIn);
const isSuperAdmin = computed(() => session.currentUser?.role === 'super_admin');
const isOrgAdmin = computed(() => session.currentUser?.role === 'org_admin');
const isStandardUserShell = computed(() => isLoggedIn.value && !isSuperAdmin.value && !isOrgAdmin.value);
const isOrganizationLinkedUser = computed(
  () => session.currentUser?.role === 'user' && Boolean(session.currentUser?.organization_id)
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
    ? 'flex-1 px-3 pb-4 pt-24 sm:px-4 sm:pb-5 sm:pt-24 md:px-6 md:pb-6 md:pt-28 lg:px-8 lg:pb-8 lg:pt-24'
    : 'flex-1 px-3 pb-4 pt-28 sm:px-4 sm:pb-5 sm:pt-28 md:px-6 md:pb-6 md:pt-32 lg:px-8 lg:pb-8 lg:pt-36'
));

const contentClass = computed(() => (
  `${isOrgAdmin.value ? 'org-admin-shell ' : ''}${isStandardUserShell.value ? 'user-shell ' : ''}${paddingClass.value}`
));

const mobileNavOpen = ref(false);

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
  `${isStandardUserShell.value ? 'user-shell ' : ''}${isOrgAdmin.value ? 'org-admin-shell ' : ''}min-h-screen w-full overflow-x-hidden bg-transparent text-[var(--app-text-color)]`
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

watch(() => route.fullPath, closeMobileNav);

onMounted(session.fetchCurrentUser);
</script>

<template>
  <div :class="layoutRootClass">
    <AppToast />

    <div class="relative flex min-h-screen w-full">
      <SidebarNav v-if="isLoggedIn" @logout="session.logout" />

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

          <SidebarNav mobile @logout="session.logout" @navigate="closeMobileNav" />
        </div>
      </div>

      <main :class="mainClass">
        <div :class="headerWrapClass">
          <header class="border-b border-[var(--app-nav-border)] bg-[rgba(255,255,255,0.88)] px-3 py-3 shadow-[0_14px_40px_rgba(17,28,48,0.06)] backdrop-blur-2xl sm:px-4 md:px-6 lg:px-7">
            <div class="flex flex-wrap items-center justify-between gap-3">
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
                <div class="hidden min-w-0 text-right sm:block">
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
                  class="h-9 w-9 rounded-full border border-[var(--app-line)] object-cover sm:h-10 sm:w-10"
                >

                <div
                  v-else
                  class="h-9 w-9 rounded-full bg-[var(--app-primary)] text-center text-sm font-bold leading-9 text-white sm:h-10 sm:w-10 sm:leading-10"
                >
                  {{ session.userInitials }}
                </div>

                <button
                  class="inline-flex min-h-[40px] items-center rounded-[var(--app-radius-md)] border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-nav-text)] hover:bg-[var(--app-nav-hover)]"
                  @click="session.logout"
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

        <AppFooter />
      </main>
    </div>
  </div>
</template>
