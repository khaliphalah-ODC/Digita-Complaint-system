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
const isAdminShell = computed(() => isSuperAdmin.value || isOrgAdmin.value);
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
    ? 'flex-1 px-3 pb-4 pt-24 sm:p-4 sm:pt-24 md:p-6 md:pt-28 lg:p-7 lg:pt-24'
    : 'flex-1 px-3 pb-4 pt-28 sm:p-4 sm:pt-28 md:p-6 md:pt-32 lg:p-7 lg:pt-36'
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
  isSuperAdmin.value
    ? 'app-dark-page min-h-screen w-full overflow-x-hidden text-white'
    : isStandardUserShell.value
      ? 'user-shell min-h-screen w-full overflow-x-hidden'
      : 'min-h-screen w-full overflow-x-hidden'
));
const mainClass = computed(() => (
  isLoggedIn.value
    ? `flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden lg:pl-[18rem] ${isSuperAdmin.value ? 'lg:bg-transparent' : ''}`
    : 'flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden'
));
const headerWrapClass = computed(() => (
  isLoggedIn.value
    ? 'fixed inset-x-0 top-0 z-40 lg:left-[18rem]'
    : 'fixed inset-x-0 top-0 z-40'
));
const mobileMenuButtonClass = computed(() => (
  isOrgAdmin.value
    ? 'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/16 lg:hidden'
    : isSuperAdmin.value
      ? 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 lg:hidden'
      : isStandardUserShell.value
        ? 'inline-flex items-center gap-2 rounded-full border border-[#c6d8f8] bg-white/90 px-3 py-2 text-xs font-semibold text-[var(--app-primary-ink)] hover:bg-[#eef4ff] lg:hidden'
        : 'inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 lg:hidden'
));
const mobileOverlayClass = computed(() => (
  isOrgAdmin.value
    ? 'fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden'
    : 'fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm lg:hidden'
));
const mobileDrawerClass = computed(() => (
  isOrgAdmin.value
    ? 'h-full w-[86vw] max-w-[20rem] border-r border-white/15 bg-[linear-gradient(180deg,rgba(15,31,57,0.98),rgba(22,52,98,0.96)_54%,rgba(31,77,183,0.94)_100%)] p-4 shadow-[0_24px_60px_rgba(2,6,23,0.45)]'
    : isSuperAdmin.value
      ? 'h-full w-[86vw] max-w-[20rem] border-r border-white/10 bg-[rgba(10,28,54,0.98)] p-4 shadow-[0_24px_60px_rgba(2,6,23,0.45)]'
      : isStandardUserShell.value
        ? 'h-full w-[86vw] max-w-[20rem] border-r border-[#c9daf8] bg-[linear-gradient(180deg,rgba(245,249,255,0.98),rgba(226,237,255,0.97))] p-4 shadow-[0_24px_60px_rgba(2,6,23,0.2)]'
        : 'h-full w-[86vw] max-w-[20rem] border-r border-slate-200/80 bg-white p-4 shadow-[0_24px_60px_rgba(2,6,23,0.2)]'
));

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
              <p :class="isOrgAdmin ? 'text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/70' : isSuperAdmin ? 'text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80' : 'text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)]'">
                Navigation
              </p>
              <p :class="isOrgAdmin || isSuperAdmin ? 'truncate text-sm font-semibold text-white' : 'truncate text-sm font-semibold text-slate-900'">
                {{ workspaceLabel }}
              </p>
            </div>
            <button
              :class="isOrgAdmin || isSuperAdmin
                ? 'rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white'
                : 'rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm'"
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
          <header :class="`${isSuperAdmin ? 'border-white/10 bg-[rgba(10,28,54,0.82)] shadow-[0_14px_40px_rgba(2,6,23,0.12)] backdrop-blur-2xl' : isStandardUserShell ? 'user-shell-header' : 'border-slate-200/90 bg-[rgba(255,255,255,0.94)] shadow-[0_14px_40px_rgba(2,6,23,0.12)] backdrop-blur-2xl'} rounded-none px-3 py-3 sm:px-4 md:px-6 lg:px-7`">
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
                  <p :class="isSuperAdmin ? 'text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-blue-200/90' : (isOrgAdmin ? 'text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]' : isStandardUserShell ? 'text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]' : 'app-kicker')">{{ workspaceLabel }}</p>
                  <p :class="isAdminShell ? (isSuperAdmin ? 'truncate text-sm font-semibold text-white sm:text-base' : 'truncate text-sm font-semibold text-slate-800 sm:text-base') : isStandardUserShell ? 'truncate text-sm font-semibold text-[var(--app-primary-ink)] sm:text-base' : 'truncate text-sm font-semibold text-slate-700 sm:text-base'">{{ workspaceTitle }}</p>
                </div>
              </div>

              <div v-if="isLoggedIn" class="flex min-w-0 items-center gap-2 sm:gap-3">
                <div class="hidden min-w-0 text-right sm:block">
                  <p :class="isAdminShell ? (isSuperAdmin ? 'truncate text-sm font-semibold text-white' : 'truncate text-sm font-semibold text-slate-900') : isStandardUserShell ? 'truncate text-sm font-semibold text-[var(--app-primary-ink)]' : 'truncate text-sm font-semibold text-slate-900'">{{ session.currentUser?.full_name || 'User' }}</p>
                  <p :class="isAdminShell ? (isSuperAdmin ? 'truncate text-xs text-white/55' : 'truncate text-xs text-slate-500') : isStandardUserShell ? 'truncate text-xs text-[var(--app-muted-color)]' : 'truncate text-xs text-slate-500'">{{ session.currentUser?.email || 'No email' }}</p>
                </div>

                <img
                  v-if="profileAvatar"
                  :src="profileAvatar"
                  alt="User Avatar"
                  :class="isSuperAdmin ? 'h-9 w-9 rounded-full border border-white/10 object-cover sm:h-10 sm:w-10' : 'h-9 w-9 rounded-full border border-slate-200 object-cover sm:h-10 sm:w-10'"
                >
                <div
                  v-else
                  :class="isSuperAdmin ? 'h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-[var(--app-primary)] text-center text-sm font-bold leading-9 text-white sm:h-10 sm:w-10 sm:leading-10' : 'h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-[var(--app-primary-ink)] text-center text-sm font-bold leading-9 text-white sm:h-10 sm:w-10 sm:leading-10'"
                >
                  {{ session.userInitials }}
                </div>

                <button
                  :class="isSuperAdmin ? 'rounded-none border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10' : isStandardUserShell ? 'rounded-none border border-[#c8d9f7] bg-white/90 px-3 py-2 text-xs font-semibold text-[var(--app-primary-ink)] hover:bg-[#eef4ff]' : 'rounded-none border border-slate-300/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'"
                  @click="session.logout"
                >
                  Logout
                </button>
              </div>
              <div v-else class="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <RouterLink
                  to="/signin"
                  class="rounded-none border border-slate-300/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Login
                </RouterLink>
                <RouterLink
                  to="/signup"
                  class="rounded-none bg-[var(--app-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--app-primary-ink)]"
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
