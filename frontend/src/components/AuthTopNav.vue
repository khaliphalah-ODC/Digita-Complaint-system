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
  { label: 'About', to: '/about' },
  { label: 'Features', to: '/features' },
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
    ? 'app-shell-panel px-4 py-4 sm:px-5 md:px-8'
    : 'app-shell-panel mb-6 w-full px-4 py-4 sm:px-5 md:px-8'
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

        <!-- ── Logo ─────────────────────────────────────────── -->
        <RouterLink to="/" class="logo-link min-w-0 flex items-center gap-2.5 no-underline">
          <div class="logo-icon">
            <svg fill="currentColor" viewBox="0 0 24 24" class="h-5 w-5">
              <path d="M20 2H4c-1.103 0-2 .897-2 2v18l4-4h14c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm-6 11h-4v-2h4v2zm0-4H8V7h6v2z"/>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-name">Complaint<span class="logo-accent">Track</span></span>
            <span class="logo-tagline">Submit · Track · Resolve</span>
          </div>
        </RouterLink>

        <!-- ── Nav Links ─────────────────────────────────────── -->
        <ul class="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
          <li v-for="item in publicItems" :key="item.to">
            <RouterLink :to="item.to" :class="publicLinkClass(item.to)">
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>

        <!-- ── Auth Buttons ──────────────────────────────────── -->
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

<style scoped>
.logo-link {
  text-decoration: none;
}
.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  background: var(--app-primary, #1f4db7);
  color: white;
  flex-shrink: 0;
}
.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.logo-name {
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #0f172a;
}
.logo-accent {
  color: var(--app-primary, #1f4db7);
}
.logo-tagline {
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin-top: 0.15rem;
}
</style>