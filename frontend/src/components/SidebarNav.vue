<script setup>
import { computed } from 'vue';
import { useSessionStore } from '../stores/session';

const session = useSessionStore();
const isAdmin = computed(() => session.currentUser?.role === 'admin');
const dashboardRoute = computed(() => (isAdmin.value ? '/admin/dashboard' : '/team-dashboard'));
</script>

<template>
  <aside class="hidden w-64 flex-col bg-gradient-to-b from-[#243a62] to-[#1b2b49] p-6 text-white md:flex">
    <div>
      <p class="text-2xl font-black tracking-tight">Complaint Management System</p>
      <p class="text-sm text-white/70">{{ isAdmin ? 'Platform Admin' : 'Team Workspace' }}</p>
    </div>

    <nav class="mt-10 space-y-2">
      <RouterLink :to="dashboardRoute" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Dashboard</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/users" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">User Management</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/organizations" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Organization</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/complaints" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Complaint</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/departments" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Department</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/accessments" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Accessment</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/escalations" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Escalation</RouterLink>
      <RouterLink v-if="isAdmin" to="/feedback" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Feedback</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/notifications" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Notification</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/audit-logs" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Status Logs</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/reports" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Reports</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/settings" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Settings</RouterLink>
      <RouterLink v-if="!isAdmin" to="/submit-complaint" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Submit Complaint</RouterLink>
      <RouterLink v-if="!isAdmin" to="/track-complaint" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Track Complaint</RouterLink>
      <RouterLink v-if="!isAdmin" to="/organizations" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Organization</RouterLink>
      <RouterLink v-if="!isAdmin" to="/feedback" class="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Feedback</RouterLink>
    </nav>

    <button class="mt-auto rounded-xl px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10" @click="$emit('logout')">
      Logout
    </button>
  </aside>
</template>
