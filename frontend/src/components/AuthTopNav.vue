<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/session';

const props = defineProps({
  fixed: {
    type: Boolean,
    default: false
  }
});

const route = useRoute();
const session = useSessionStore();

const publicItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Submit Complaint', to: '/submit-complaint' },
  { label: 'Track Complaint', to: '/track-complaint' },
  { label: 'Organizations', to: '/organizations' }
]);
const isLoggedIn = computed(() => session.isLoggedIn);
const dashboardRoute = computed(() => {
  if (session.currentUser?.role === 'super_admin') return '/admin/dashboard';
  if (session.currentUser?.role === 'org_admin') return '/org-admin/dashboard';
  return '/user/dashboard';
});
const wrapperClass = computed(() => (props.fixed ? 'fixed inset-x-0 top-0 z-40' : ''));
const shellClass = computed(() => (
  props.fixed
    ? 'app-shell-panel  px-4 py-4 sm:px-5 md:px-8'
    : 'app-shell-panel mb-6 w-full  px-4 py-4 sm:px-5 md:px-8'
));

const publicLinkClass = (to) => {
  const isActive = route.path === to;
  return isActive
    ? 'rounded-full bg-slate-900 px-3 py-1 text-white'
    : 'hover:text-slate-900';
};

const authLinkClass = (to) => {
  const isActive = route.path === to;
  if (to === '/signin') {
    return isActive
      ? 'rounded-full border border-slate-300/80 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900'
      : 'rounded-full px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100';
  }

  if (to === '/signup') {
    return isActive
      ? 'rounded-full bg-[var(--app-primary)] px-5 py-2 text-sm font-semibold text-white'
      : 'rounded-full bg-[var(--app-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)]';
  }

  return 'rounded-full border border-[var(--app-primary)] px-5 py-2 text-sm font-semibold text-[var(--app-primary)] hover:bg-blue-50';
};
</script>

<template>
  <div :class="wrapperClass">
    <header :class="shellClass">
      <nav class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="min-w-0">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)]">Complaint Operations</p>
          <p class="text-2xl font-black text-slate-900 sm:text-3xl">Complaint <span class="text-[var(--app-primary)]">MS</span></p>
          <p class="text-xs font-medium text-slate-500">Submit · Track · Resolve</p>
        </div>

        <ul class="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
          <li v-for="item in publicItems" :key="item.to">
            <RouterLink :to="item.to" :class="publicLinkClass(item.to)">
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>

        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <RouterLink to="/signin" :class="authLinkClass('/signin')">
            Login
          </RouterLink>
          <RouterLink to="/signup" :class="authLinkClass('/signup')">
            Sign Up
          </RouterLink>
          <RouterLink
            v-if="isLoggedIn"
            :to="dashboardRoute"
            class="rounded-full border border-[var(--app-primary)] px-5 py-2 text-sm font-semibold text-[var(--app-primary)] hover:bg-blue-50"
          >
            Dashboard
          </RouterLink>
        </div>
      </nav>
    </header>
  </div>
</template>
