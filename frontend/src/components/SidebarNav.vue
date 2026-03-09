<script setup>
import { computed } from 'vue';
import { useSessionStore } from '../stores/session';

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['logout', 'navigate']);

const session = useSessionStore();
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
const asideClass = computed(() => (
  props.mobile
    ? 'flex h-full w-full flex-col rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,#10213c_0%,#1c365f_54%,#274976_100%)] p-6 text-white shadow-2xl'
    : 'hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,#10213c_0%,#1c365f_54%,#274976_100%)] p-6 text-white shadow-[0_22px_60px_rgba(16,33,60,0.28)] lg:fixed lg:left-4 lg:top-4 lg:z-30 lg:flex'
));
const handleNavigate = () => emit('navigate');
const handleLogout = () => emit('logout');
</script>

<template>
  <aside :class="asideClass">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.28em] text-amber-200/90">Civic Console</p>
      <p class="mt-2 text-3xl font-black tracking-tight">Complaint MS</p>
      <p class="mt-1 text-sm text-white/70">
        {{ workspaceLabel }}
      </p>
    </div>

    <nav class="mt-10 space-y-2">
      <RouterLink :to="dashboardRoute" class="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-left text-sm text-white/85 hover:bg-white/12" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'gauge-high']" />
        <span>Dashboard</span>
      </RouterLink>
      <RouterLink v-if="isSuperAdmin" to="/admin/organizations" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'building']" />
        <span>Organization</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/complaints" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'file-lines']" />
        <span>Complaints</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/users" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'users']" />
        <span>Users</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/departments" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'sitemap']" />
        <span>Departments</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/accessments" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'clipboard-list']" />
        <span>Accessment</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/escalations" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
        <span>Escalations</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/notifications" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'bell']" />
        <span>Notifications</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/org-admin/status-logs" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'chart-line']" />
        <span>Status Logs</span>
      </RouterLink>
      <RouterLink v-if="isOrgAdmin" to="/organizations" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'building']" />
        <span>Organization</span>
      </RouterLink>
      <RouterLink v-if="!isSuperAdmin && !isOrgAdmin" to="/submit-complaint" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'file-lines']" />
        <span>Submit Complaint</span>
      </RouterLink>
      <RouterLink v-if="!isSuperAdmin && !isOrgAdmin" to="/track-complaint" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'chart-line']" />
        <span>Track Complaint</span>
      </RouterLink>
      <RouterLink v-if="isOrganizationMemberUser" to="/organizations" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'building']" />
        <span>My Organization</span>
      </RouterLink>
      <RouterLink v-if="!isSuperAdmin && !isOrgAdmin" to="/feedback" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10" @click="handleNavigate">
        <font-awesome-icon :icon="['fas', 'comments']" />
        <span>Feedback</span>
      </RouterLink>
    </nav>

    <button class="mt-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left text-sm text-white/90 hover:bg-white/14" @click="handleLogout">
      <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
      <span>Logout</span>
    </button>
  </aside>
</template>
