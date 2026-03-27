<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useSessionStore } from '../stores/session';
import { useNotificationStore } from '../stores/notifications.js';

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['logout', 'navigate']);

const session = useSessionStore();
const notificationStore = useNotificationStore();
const route = useRoute();
const { unreadCount } = storeToRefs(notificationStore);

const isSuperAdmin = computed(() => session.currentUser?.role === 'super_admin');
const isOrgAdmin = computed(() => session.currentUser?.role === 'org_admin');
const isOrganizationMemberUser = computed(
  () => session.currentUser?.role === 'user' && Boolean(session.currentUser?.organization_id)
);

const dashboardRoute = computed(() => {
  if (isSuperAdmin.value) return '/admin/dashboard';
  if (isOrgAdmin.value) return '/org-admin/dashboard';
  return '/user/dashboard';
});

const workspaceLabel = computed(() => {
  if (isSuperAdmin.value) return 'Super Admin';
  if (isOrgAdmin.value) return 'Organization Admin';
  if (isOrganizationMemberUser.value) return 'Organization User';
  return 'Public User';
});
const userDisplayName = computed(() => session.currentUser?.full_name || 'User Account');
const userEmail = computed(() => session.currentUser?.email || '');
const userInitials = computed(() => {
  if (!session.currentUser?.full_name) return 'U';
  return session.currentUser.full_name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
});
const profileAvatar = computed(() => (
  session.currentUser?.avatar_url ||
  session.currentUser?.avatar ||
  session.currentUser?.profile_image ||
  session.currentUser?.photo_url ||
  ''
));

const asideClass = computed(() => {
  if (props.mobile) {
    return 'app-nav-sidebar flex h-full w-full flex-col overflow-y-auto rounded-none p-4 text-[var(--app-text-color)] sm:p-5';
  }
  return 'app-nav-sidebar hidden h-screen w-[5.5rem] shrink-0 flex-col px-3 py-4 text-[var(--app-text-color)] lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:flex';
});

const navLinkClass = (target) => {
  const isActive = route.path === target || route.fullPath === target;
  if (props.mobile) {
    return isActive
      ? 'app-nav-link app-nav-link-active flex min-h-[46px] w-full items-center gap-3 px-4 py-3 text-left'
      : 'app-nav-link flex min-h-[46px] w-full items-center gap-3 px-4 py-3 text-left';
  }

  return isActive
    ? 'app-nav-link app-nav-link-active flex h-11 w-full items-center justify-center'
    : 'app-nav-link flex h-11 w-full items-center justify-center';
};

const handleNavigate = () => emit('navigate');
const handleLogout = () => emit('logout');
const notificationCountForLink = (link) => (
  link.to === '/notifications' && !isSuperAdmin.value && !isOrgAdmin.value ? unreadCount.value : 0
);

const superAdminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: ['fas', 'gauge-high'] },
  { to: '/admin/organizations', label: 'Organizations', icon: ['fas', 'building'] },
  { to: '/admin/triage', label: 'Triage Queue', icon: ['fas', 'clipboard-list'] },
  { to: '/admin/testimonials', label: 'Testimonials', icon: ['fas', 'file-circle-check'] },
  { to: '/admin/reports', label: 'Analytics', icon: ['fas', 'chart-line'] },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ['fas', 'circle-info'] },
  { to: '/admin/settings', label: 'Settings', icon: ['fas', 'gear'] }
];

const orgAdminLinks = [
  { to: '/org-admin/dashboard', label: 'Dashboard', icon: ['fas', 'gauge-high'] },
  { to: '/org-admin/complaints', label: 'Complaints', icon: ['fas', 'file-lines'] },
  { to: '/org-admin/users', label: 'Users', icon: ['fas', 'users'] },
  { to: '/org-admin/organization', label: 'Organization', icon: ['fas', 'building'] },
  { to: '/org-admin/departments', label: 'Departments', icon: ['fas', 'sitemap'] },
  { to: '/org-admin/assessments', label: 'Assessments', icon: ['fas', 'clipboard-list'] },
  { to: '/org-admin/escalations', label: 'Escalations', icon: ['fas', 'triangle-exclamation'] },
  { to: '/org-admin/analytics', label: 'Analytics', icon: ['fas', 'chart-line'] },
  { to: '/org-admin/notifications', label: 'Notifications', icon: ['fas', 'bell'] },
  { to: '/org-admin/status-logs', label: 'Activity Logs', icon: ['fas', 'circle-info'] }
];

const userLinks = computed(() => {
  const links = [
    { to: '/user/dashboard', label: 'Dashboard', icon: ['fas', 'gauge-high'] },
    { to: '/submit-complaint', label: 'Submit Complaint', icon: ['fas', 'file-lines'] },
    { to: '/track-complaint', label: 'Track Complaint', icon: ['fas', 'eye'] },
    { to: '/notifications', label: 'Notifications', icon: ['fas', 'bell'] },
    { to: '/feedback', label: 'Feedback', icon: ['fas', 'comments'] },
    { to: '/testimonial', label: 'Testimonials', icon: ['fas', 'file-circle-check'] }
  ];

  if (isOrganizationMemberUser.value) {
    links.splice(3, 0, { to: '/organizations', label: 'My Organization', icon: ['fas', 'building'] });
  }

  return links;
});
</script>

<template>
  <aside :class="asideClass">
    <!-- SUPER ADMIN -->
    <template v-if="isSuperAdmin">
      <template v-if="mobile">
        <div class="rounded-[22px] border border-[var(--app-line)] bg-white/88 p-4 shadow-[var(--app-shadow-xs)]">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Civic Console</p>
          <p class="mt-2 text-[1.8rem] font-black tracking-tight text-[var(--app-title-color)]">Complaint MS</p>
          <p class="mt-1 text-sm text-[var(--app-nav-text-muted)]">{{ workspaceLabel }}</p>

          <div class="mt-4 flex items-center gap-3 rounded-[18px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-3 py-3">
            <img
              v-if="profileAvatar"
              :src="profileAvatar"
              alt="User avatar"
              class="h-11 w-11 rounded-full border border-[var(--app-line)] object-cover"
            >
            <div
              v-else
              class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--app-primary)] text-sm font-bold text-white"
            >
              {{ userInitials }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-[var(--app-title-color)]">{{ userDisplayName }}</p>
              <p class="truncate text-xs text-[var(--app-nav-text-muted)]">{{ userEmail || workspaceLabel }}</p>
            </div>
            <button
              class="inline-flex min-h-[36px] items-center rounded-full border border-[var(--app-nav-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-nav-text)] shadow-[var(--app-shadow-xs)] hover:bg-[var(--app-nav-hover)]"
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </div>

        <nav class="mt-6 space-y-1.5 pb-6">
          <RouterLink
            v-for="link in superAdminLinks"
            :key="link.to"
            :to="link.to"
            :class="navLinkClass(link.to)"
            @click="handleNavigate"
          >
            <font-awesome-icon :icon="link.icon" />
            <span>{{ link.label }}</span>
          </RouterLink>
        </nav>

      </template>

      <template v-else>
        <div class="flex items-center justify-center pb-4">
          <div class="app-nav-sidebar-logo flex h-[3.15rem] w-[3.15rem] items-center justify-center text-center text-sm font-bold leading-tight">
            MS
          </div>
        </div>

        <nav class="mt-4 flex flex-1 flex-col items-center gap-2.5">
          <RouterLink
            v-for="link in superAdminLinks"
            :key="link.to"
            :to="link.to"
            :class="navLinkClass(link.to)"
            :title="link.label"
            @click="handleNavigate"
          >
            <font-awesome-icon :icon="link.icon" class="text-base" />
          </RouterLink>
        </nav>

        <button
          class="app-nav-link mt-auto flex h-11 w-full items-center justify-center border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] hover:bg-[var(--app-nav-hover)]"
          title="Logout"
          @click="handleLogout"
        >
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" class="text-base" />
        </button>
      </template>
    </template>

    <!-- ORG ADMIN -->
    <template v-else-if="isOrgAdmin">
      <template v-if="mobile">
        <div class="rounded-[22px] border border-[var(--app-line)] bg-white/88 p-4 shadow-[var(--app-shadow-xs)]">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Civic Console</p>
          <p class="mt-2 text-[1.8rem] font-black tracking-tight text-[var(--app-title-color)]">Complaint MS</p>
          <p class="mt-1 text-sm text-[var(--app-nav-text-muted)]">{{ workspaceLabel }}</p>

          <div class="mt-4 flex items-center gap-3 rounded-[18px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-3 py-3">
            <img
              v-if="profileAvatar"
              :src="profileAvatar"
              alt="User avatar"
              class="h-11 w-11 rounded-full border border-[var(--app-line)] object-cover"
            >
            <div
              v-else
              class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--app-primary)] text-sm font-bold text-white"
            >
              {{ userInitials }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-[var(--app-title-color)]">{{ userDisplayName }}</p>
              <p class="truncate text-xs text-[var(--app-nav-text-muted)]">{{ userEmail || workspaceLabel }}</p>
            </div>
            <button
              class="inline-flex min-h-[36px] items-center rounded-full border border-[var(--app-nav-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-nav-text)] shadow-[var(--app-shadow-xs)] hover:bg-[var(--app-nav-hover)]"
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </div>

        <nav class="mt-6 space-y-1.5 pb-6">
          <RouterLink
            v-for="link in orgAdminLinks"
            :key="link.to"
            :to="link.to"
            :class="navLinkClass(link.to)"
            @click="handleNavigate"
          >
            <font-awesome-icon :icon="link.icon" />
            <span>{{ link.label }}</span>
          </RouterLink>
        </nav>

      </template>

      <template v-else>
        <div class="flex items-center justify-center pb-4">
          <div class="app-nav-sidebar-logo flex h-[3.15rem] w-[3.15rem] items-center justify-center text-center text-sm font-bold leading-tight">
            OG
          </div>
        </div>

        <nav class="mt-4 flex flex-1 flex-col items-center gap-2.5 overflow-y-auto">
          <RouterLink
            v-for="link in orgAdminLinks"
            :key="link.to"
            :to="link.to"
            :class="navLinkClass(link.to)"
            :title="link.label"
            @click="handleNavigate"
          >
            <font-awesome-icon :icon="link.icon" class="text-base" />
          </RouterLink>
        </nav>

        <button
          class="app-nav-link mt-auto flex h-11 w-full items-center justify-center border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] hover:bg-[var(--app-nav-hover)]"
          title="Logout"
          @click="handleLogout"
        >
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" class="text-base" />
        </button>
      </template>
    </template>

    <!-- USER -->
    <template v-else>
      <template v-if="mobile">
        <div class="rounded-[22px] border border-[var(--app-line)] bg-white/88 p-4 shadow-[var(--app-shadow-xs)]">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Civic Console</p>
          <p class="mt-2 text-[1.8rem] font-black tracking-tight text-slate-900">Complaint MS</p>
          <p class="mt-1 text-sm text-slate-600">{{ workspaceLabel }}</p>

          <div class="mt-4 flex items-center gap-3 rounded-[18px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-3 py-3">
            <img
              v-if="profileAvatar"
              :src="profileAvatar"
              alt="User avatar"
              class="h-11 w-11 rounded-full border border-[var(--app-line)] object-cover"
            >
            <div
              v-else
              class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--app-primary)] text-sm font-bold text-white"
            >
              {{ userInitials }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-[var(--app-title-color)]">{{ userDisplayName }}</p>
              <p class="truncate text-xs text-[var(--app-nav-text-muted)]">{{ userEmail || workspaceLabel }}</p>
            </div>
            <button
              class="inline-flex min-h-[36px] items-center rounded-full border border-[var(--app-nav-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-nav-text)] shadow-[var(--app-shadow-xs)] hover:bg-[var(--app-nav-hover)]"
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </div>

        <nav class="mt-6 space-y-1.5 pb-6">
          <RouterLink
            v-for="link in userLinks"
            :key="link.to"
            :to="link.to"
            :class="navLinkClass(link.to)"
            @click="handleNavigate"
          >
            <span class="relative inline-flex">
              <font-awesome-icon :icon="link.icon" />
              <span
                v-if="notificationCountForLink(link) > 0"
                class="ml-2 inline-flex min-w-[1.55rem] items-center justify-center rounded-full bg-[var(--app-primary)] px-1.5 py-0.5 text-[0.68rem] font-bold leading-none text-white shadow-[0_8px_18px_rgba(24,58,99,0.32)]"
              >
                {{ notificationCountForLink(link) > 99 ? '99+' : notificationCountForLink(link) }}
              </span>
            </span>
            <span>{{ link.label }}</span>
          </RouterLink>
        </nav>

      </template>

      <template v-else>
        <div class="flex items-center justify-center pb-4">
          <div class="app-nav-sidebar-logo flex h-[3.15rem] w-[3.15rem] items-center justify-center text-center text-sm font-bold leading-tight">
            US
          </div>
        </div>

        <nav class="mt-4 flex flex-1 flex-col items-center gap-2.5">
          <RouterLink
            v-for="link in userLinks"
            :key="link.to"
            :to="link.to"
            :class="navLinkClass(link.to)"
            :title="link.label"
            @click="handleNavigate"
          >
            <span class="relative inline-flex">
              <font-awesome-icon :icon="link.icon" class="text-base" />
              <span
                v-if="notificationCountForLink(link) > 0"
                class="absolute -right-2 -top-2 inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--app-primary),var(--app-accent))] px-1 text-[0.62rem] font-bold leading-5 text-white shadow-[0_10px_20px_rgba(24,58,99,0.3)] ring-2 ring-white"
              >
                {{ notificationCountForLink(link) > 9 ? '9+' : notificationCountForLink(link) }}
              </span>
            </span>
          </RouterLink>
        </nav>

        <button
          class="app-nav-link mt-auto flex h-11 w-full items-center justify-center border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] hover:bg-[var(--app-nav-hover)]"
          title="Logout"
          @click="handleLogout"
        >
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" class="text-base" />
        </button>
      </template>
    </template>
  </aside>
</template>
