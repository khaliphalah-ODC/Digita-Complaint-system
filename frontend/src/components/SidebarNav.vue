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
const isAdminShell = computed(() => isSuperAdmin.value || isOrgAdmin.value);
const isDarkShell = computed(() => isSuperAdmin.value);
const isOrgAdminShell = computed(() => isOrgAdmin.value && !isSuperAdmin.value);
const isUserShell = computed(() => !isSuperAdmin.value && !isOrgAdmin.value);
const asideClass = computed(() => {
  if (props.mobile) {
    if (isDarkShell.value) {
      return 'app-dark-panel flex h-full w-full flex-col overflow-y-auto rounded-none p-4 text-white shadow-2xl sm:p-5';
    }
    if (isOrgAdminShell.value) {
      return 'org-admin-sidebar flex h-full w-full flex-col overflow-y-auto rounded-none p-4 text-white shadow-2xl sm:p-5';
    }
    if (isUserShell.value) {
      return 'user-shell-sidebar flex h-full w-full flex-col overflow-y-auto rounded-none p-4 text-[var(--app-primary-ink)] shadow-2xl sm:p-5';
    }
    return 'app-shell-panel flex h-full w-full flex-col overflow-y-auto rounded-none border-r border-slate-200/90 p-4 text-[var(--app-text-color)] shadow-2xl sm:p-5';
  }

  if (isDarkShell.value) {
    return 'app-dark-panel hidden h-screen w-72 shrink-0 flex-col rounded-none p-6 text-white shadow-[0_18px_44px_rgba(16,33,60,0.2)] lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:flex';
  }
  if (isOrgAdminShell.value) {
    return 'org-admin-sidebar hidden h-screen w-72 shrink-0 flex-col rounded-none p-6 text-white shadow-[0_18px_44px_rgba(16,33,60,0.2)] lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:flex';
  }

  if (isUserShell.value) {
    return 'user-shell-sidebar hidden h-screen w-72 shrink-0 flex-col rounded-none p-6 text-[var(--app-primary-ink)] shadow-[0_18px_44px_rgba(16,33,60,0.12)] lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:flex';
  }
  return 'app-shell-panel hidden h-screen w-72 shrink-0 flex-col rounded-none border-r border-slate-200/90 p-6 text-[var(--app-text-color)] shadow-[0_18px_44px_rgba(16,33,60,0.12)] lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:flex';
});
const navLinkClass = (target) => {
  const isActive = route.path === target || route.fullPath === target;
  if (isDarkShell.value) {
    return isActive
      ? 'flex w-full items-center gap-3 rounded-2xl border border-white/14 bg-white/12 px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,77,183,0.18)]'
      : 'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/72 hover:bg-white/6 hover:text-white';
  }
  if (isOrgAdminShell.value) {
    return isActive
      ? 'flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-[#0f1f39] via-[#163462] to-[#1f4db7] px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_14px_32px_rgba(31,77,183,0.25)]'
      : 'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:text-white hover:bg-white/10';
  }
  if (isUserShell.value) {
    return isActive
      ? 'flex w-full items-center gap-3 rounded-2xl border border-[#c2d7fb] bg-[linear-gradient(135deg,#163462_0%,#1f4db7_100%)] px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,77,183,0.18)]'
      : 'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-[var(--app-primary-ink)] hover:bg-[#eaf2ff] hover:text-[var(--app-primary)]';
  }

  return isActive
    ? 'flex w-full items-center gap-3 rounded-none border-l-4 border-[var(--app-primary)] bg-[var(--app-primary-mist)] px-4 py-3 text-left text-sm font-semibold text-[var(--app-primary-ink)]'
    : 'flex w-full items-center gap-3 rounded-none px-4 py-3 text-left text-sm text-slate-700 hover:bg-[var(--app-primary-mist)] hover:text-[var(--app-primary-ink)]';
};
const handleNavigate = () => emit('navigate');
const handleLogout = () => emit('logout');
</script>

<template>
  <aside :class="asideClass">
    <div>
      <p :class="isDarkShell ? 'text-sm font-semibold uppercase tracking-[0.28em] text-blue-200/90' : 'text-sm font-semibold uppercase tracking-[0.28em] text-[var(--app-primary)]'">Civic Console</p>
      <p :class="isDarkShell ? 'mt-2 text-3xl font-black tracking-tight text-white' : 'mt-2 text-3xl font-black tracking-tight text-slate-900'">Complaint MS</p>
      <p :class="isDarkShell ? 'mt-1 text-sm text-white/62' : 'mt-1 text-sm text-slate-600'">
        {{ workspaceLabel }}
      </p>
    </div>

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
        <span>Users</span>
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

    <button
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
    </button>
  </aside>
</template>
