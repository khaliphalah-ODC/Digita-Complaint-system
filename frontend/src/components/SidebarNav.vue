<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '../stores/session';

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['logout', 'navigate']);

const session = useSessionStore();
const route = useRoute();

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

const superAdminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: ['fas', 'gauge-high'] },
  { to: '/admin/organizations', label: 'Organizations', icon: ['fas', 'building'] },
  { to: '/admin/triage', label: 'Triage Queue', icon: ['fas', 'file-lines'] },
  { to: '/admin/reports', label: 'Analytics', icon: ['fas', 'chart-line'] },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ['fas', 'clipboard-list'] },
  { to: '/admin/settings', label: 'Settings', icon: ['fas', 'gear'] }
];

const orgAdminLinks = [
  { to: '/org-admin/dashboard', label: 'Dashboard', icon: ['fas', 'gauge-high'] },
  { to: '/org-admin/complaints', label: 'Complaints', icon: ['fas', 'file-lines'] },
  { to: '/org-admin/users', label: 'Users', icon: ['fas', 'users'] },
  { to: '/org-admin/departments', label: 'Departments', icon: ['fas', 'sitemap'] },
  { to: '/org-admin/assessments', label: 'Assessments', icon: ['fas', 'clipboard-list'] },
  { to: '/org-admin/escalations', label: 'Escalations', icon: ['fas', 'triangle-exclamation'] },
  { to: '/org-admin/testimonials', label: 'Testimonials', icon: ['fas', 'file-circle-check'] },
  { to: '/org-admin/analytics', label: 'Analytics', icon: ['fas', 'chart-line'] },
  { to: '/org-admin/notifications', label: 'Notifications', icon: ['fas', 'bell'] },
  { to: '/org-admin/status-logs', label: 'Status Logs', icon: ['fas', 'chart-line'] },
  { to: '/organizations', label: 'Organization', icon: ['fas', 'building'] }
];

const userLinks = computed(() => {
  const links = [
    { to: '/user/dashboard', label: 'Dashboard', icon: ['fas', 'gauge-high'] },
    { to: '/submit-complaint', label: 'Submit Complaint', icon: ['fas', 'file-lines'] },
    { to: '/track-complaint', label: 'Track Complaint', icon: ['fas', 'chart-line'] },
    { to: '/feedback', label: 'Feedback', icon: ['fas', 'comments'] },
    { to: '/testimonial', label: 'Testimonial', icon: ['fas', 'file-circle-check'] }
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
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Civic Console</p>
          <p class="mt-2 text-[1.8rem] font-black tracking-tight text-[var(--app-title-color)]">Complaint MS</p>
          <p class="mt-1 text-sm text-[var(--app-nav-text-muted)]">{{ workspaceLabel }}</p>
        </div>

<<<<<<< Updated upstream
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

        <button
          class="app-nav-link mt-auto flex min-h-[46px] w-full items-center gap-3 border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] px-4 py-3 text-left hover:bg-[var(--app-nav-hover)]"
          @click="handleLogout"
        >
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
          <span>Logout</span>
        </button>
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
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Civic Console</p>
          <p class="mt-2 text-[1.8rem] font-black tracking-tight text-[var(--app-title-color)]">Complaint MS</p>
          <p class="mt-1 text-sm text-[var(--app-nav-text-muted)]">{{ workspaceLabel }}</p>
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

        <button
          class="app-nav-link mt-auto flex min-h-[46px] w-full items-center gap-3 border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] px-4 py-3 text-left hover:bg-[var(--app-nav-hover)]"
          @click="handleLogout"
        >
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
          <span>Logout</span>
        </button>
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
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Civic Console</p>
          <p class="mt-2 text-[1.8rem] font-black tracking-tight text-slate-900">Complaint MS</p>
          <p class="mt-1 text-sm text-slate-600">{{ workspaceLabel }}</p>
        </div>

        <nav class="mt-6 space-y-1.5 pb-6">
          <RouterLink
            v-for="link in userLinks"
            :key="link.to"
            :to="link.to"
            :class="navLinkClass(link.to)"
            @click="handleNavigate"
          >
            <font-awesome-icon :icon="link.icon" />
            <span>{{ link.label }}</span>
          </RouterLink>
        </nav>

        <button
          class="app-nav-link mt-auto flex min-h-[46px] w-full items-center gap-3 border border-[var(--app-nav-border)] bg-[var(--app-nav-surface-strong)] px-4 py-3 text-left hover:bg-[var(--app-nav-hover)]"
          @click="handleLogout"
        >
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
          <span>Logout</span>
        </button>
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
=======
    <nav :class="props.mobile ? 'mt-6 space-y-1.5 pb-6' : 'mt-10 space-y-2'">
      <RouterLink :to="dashboardRoute" :class="navLinkClass(dashboardRoute)" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'gauge-high']" />
        <span>Dashboard</span>
      </RouterLink>
      <RouterLink v-if="isSuperAdmin" to="/admin/organizations" :class="navLinkClass('/admin/organizations')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'building']" />
        <span>Organizations</span>
      </RouterLink>
      <RouterLink v-if="isSuperAdmin" to="/admin/triage" :class="navLinkClass('/admin/triage')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'file-lines']" />
        <span>Triage Queue</span>
      </RouterLink>
      <RouterLink v-if="isSuperAdmin" to="/admin/reports" :class="navLinkClass('/admin/reports')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'chart-line']" />
        <span>Analytics</span>
      </RouterLink>
      <RouterLink v-if="isSuperAdmin" to="/admin/audit-logs" :class="navLinkClass('/admin/audit-logs')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'clipboard-list']" />
        <span>Audit Logs</span>
      </RouterLink>
      <RouterLink v-if="isSuperAdmin" to="/admin/settings" :class="navLinkClass('/admin/settings')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'gear']" />
        <span>Settings</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/complaints" :class="navLinkClass('/org-admin/complaints')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'file-lines']" />
        <span>Complaints</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/users" :class="navLinkClass('/org-admin/users')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'users']" />
        <span>Create New User</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/departments" :class="navLinkClass('/org-admin/departments')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'sitemap']" />
        <span>Departments</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/accessments" :class="navLinkClass('/org-admin/accessments')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'clipboard-list']" />
        <span>Accessment</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/escalations" :class="navLinkClass('/org-admin/escalations')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
        <span>Escalations</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/analytics" :class="navLinkClass('/org-admin/analytics')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'chart-line']" />
        <span>Analytics</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/notifications" :class="navLinkClass('/org-admin/notifications')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'bell']" />
        <span>Notifications</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/status-logs" :class="navLinkClass('/org-admin/status-logs')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'chart-line']" />
        <span>Status Logs</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/organizations" :class="navLinkClass('/organizations')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'building']" />
        <span>Organization</span>
      </RouterLink>
      <RouterLink v-if="!isSuperAdmin && !isOrgAdmin" to="/submit-complaint" :class="navLinkClass('/submit-complaint')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'file-lines']" />
        <span>Submit Complaint</span>
      </RouterLink>
      <RouterLink v-if="!isSuperAdmin && !isOrgAdmin" to="/track-complaint" :class="navLinkClass('/track-complaint')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'chart-line']" />
        <span>Track Complaint</span>
      </RouterLink>
      <RouterLink v-if="isOrganizationMemberUser" to="/organizations" :class="navLinkClass('/organizations')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'building']" />
        <span>My Organization</span>
      </RouterLink>
      <RouterLink v-if="!isSuperAdmin && !isOrgAdmin" to="/feedback" :class="navLinkClass('/feedback')" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'comments']" />
        <span>Feedback</span>
      </RouterLink>
    </nav>

   <!-- <button
      :class="isDarkShell
        ? 'mt-auto flex items-center gap-3 rounded-none border border-white/10 bg-white/6 px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10'
        : isOrgAdminShell
          ? 'mt-auto flex items-center gap-3 rounded-none org-admin-logout-btn'
      : isUserShell
        ? 'mt-auto flex items-center gap-3 rounded-none border border-[#c8d9f7] bg-white/88 px-4 py-3 text-left text-sm text-[var(--app-primary-ink)] hover:bg-[#eaf2ff] hover:text-[var(--app-primary)]'
        : 'mt-auto flex items-center gap-3 rounded-none border border-slate-300/90 bg-white px-4 py-3 text-left text-sm text-slate-700 hover:bg-[var(--app-primary-mist)] hover:text-[var(--app-primary-ink)]'"
      @click="handleLogout"
    >
      <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
      <span>Logout</span>
    </button>-->
>>>>>>> Stashed changes
  </aside>
</template>
