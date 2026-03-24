<script setup>
import { computed, ref, watch } from 'vue';
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
const mobileMenuOpen = ref(false);

const publicItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Features', to: '/features' }
]);

const isLoggedIn = computed(() => session.isLoggedIn);

const dashboardRoute = computed(() => {
  if (session.currentUser?.role === 'super_admin') return '/admin/dashboard';
  if (session.currentUser?.role === 'org_admin') return '/org-admin/dashboard';
  return '/user/dashboard';
});

const userDisplayName = computed(() => {
  const name = session.currentUser?.full_name || '';
  return name.split(' ')[0] || 'Account';
});

const userInitials = computed(() => {
  if (!session.currentUser?.full_name) return 'U';
  return session.currentUser.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');
});

const wrapperClass = computed(() => (props.fixed ? 'fixed inset-x-0 top-0 z-40' : ''));
const shellClass = computed(() => (
  props.fixed
    ? 'app-shell-panel app-shell-gutter !rounded-none py-3.5'
    : 'app-shell-panel app-shell-gutter mb-6 w-full !rounded-none py-3.5'
));
const mobileToggleClass = computed(() => (
  mobileMenuOpen.value
    ? 'inline-flex min-h-[42px] items-center gap-2 rounded-lx border border-[var(--app-line-strong)] bg-white/95 px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-sm sm:hidden'
    : 'inline-flex min-h-[42px] items-center gap-2 rounded-lx border border-[var(--app-line)] bg-white/92 px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-sm sm:hidden'
));

const publicLinkClass = (to) => {
  const isActive = route.path === to;
  return isActive
    ? 'auth-nav-link inline-flex min-h-[42px] items-center rounded-xl border border-transparent bg-[var(--app-primary)] px-4 py-2 text-sm font-semibold text-white shadow-none focus:outline-none focus:border-transparent focus:ring-0 focus-visible:outline-none hover:border-[var(--app-line-strong)] hover:ring-0 hover:outline-none'
    : 'auth-nav-link inline-flex min-h-[42px] items-center rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-transparent focus:ring-0 focus-visible:outline-none hover:border-[var(--app-line-strong)] hover:bg-[var(--app-primary-mist)] hover:text-slate-900';
};
watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false;
});
</script>

<template>
  <div :class="wrapperClass">
    <header :class="shellClass">
      <nav class="app-content-wrap flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div class="flex items-start justify-between gap-3">
          <RouterLink to="/" class="logo-link min-w-0 flex items-center gap-2.5 no-underline">
            <div class="logo-icon">
              <svg fill="currentColor" viewBox="0 0 24 24" class="h-5 w-5">
                <path d="M20 2H4c-1.103 0-2 .897-2 2v18l4-4h14c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm-6 11h-4v-2h4v2zm0-4H8V7h6v2z"/>
              </svg>
            </div>
            <div class="logo-text">
              <span class="logo-name">Complaint<span class="logo-accent">Track</span></span>
              <span class="logo-tagline">Institutional complaint operations</span>
            </div>
          </RouterLink>
          <button :class="mobileToggleClass" @click="mobileMenuOpen = !mobileMenuOpen">
            <font-awesome-icon :icon="['fas', mobileMenuOpen ? 'xmark' : 'bars']" />
            {{ mobileMenuOpen ? 'Close' : 'Menu' }}
          </button>
        </div>

        <!-- ── Nav Links ─────────────────────────────────────── -->
        <ul class="hidden flex-1 flex-wrap items-center justify-center gap-2 text-slate-700 sm:flex md:gap-3">
          <li v-for="item in publicItems" :key="item.to">
            <RouterLink :to="item.to" :class="publicLinkClass(item.to)">
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>

        <!-- ── Auth Buttons ──────────────────────────────────── -->
        <div class="hidden flex-wrap items-center gap-2 sm:flex sm:gap-3">

          <!-- NOT logged in: show Login + Sign Up -->
          <template v-if="!isLoggedIn">
            <RouterLink
              to="/signin"
              class="rounded-full px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Login
            </RouterLink>
            <RouterLink
              to="/signup"
              class="rounded-full bg-[var(--app-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)]"
            >
              Sign Up
            </RouterLink>
          </template>

          <!-- LOGGED IN: show avatar + name + Dashboard button only -->
          <template v-else>
            <div class="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm">
              <div class="user-avatar">{{ userInitials }}</div>
              <span class="text-sm font-semibold text-slate-700">{{ userDisplayName }}</span>
            </div>
            <RouterLink
              :to="dashboardRoute"
              class="rounded-full bg-[var(--app-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)]"
            >
              Dashboard
            </RouterLink>
          </template>

        </div>

        <div v-if="mobileMenuOpen" class="flex flex-col gap-4 rounded-none border border-[var(--app-line)] bg-white/96 p-4 shadow-[0_18px_44px_rgba(17,28,48,0.08)] sm:hidden">
          <ul class="flex flex-col gap-2 text-slate-700">
            <li v-for="item in publicItems" :key="`mobile-${item.to}`">
              <RouterLink :to="item.to" :class="`block ${publicLinkClass(item.to)}`">
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>

          <div class="app-action-row flex flex-wrap gap-2">
            <template v-if="!isLoggedIn">
              <RouterLink
                to="/signin"
                class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                Login
              </RouterLink>
              <RouterLink
                to="/signup"
                class="rounded-full bg-[var(--app-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)]"
              >
                Sign Up
              </RouterLink>
            </template>
            <template v-else>
              <RouterLink
                :to="dashboardRoute"
                class="rounded-full bg-[var(--app-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)]"
              >
                Dashboard
              </RouterLink>
            </template>
          </div>
        </div>

      </nav>
    </header>
  </div>
</template>

<style scoped>
.logo-link { text-decoration: none; }
.logo-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; border-radius: 0.625rem;
  background: var(--app-primary, #1f4db7); color: white; flex-shrink: 0;
}
.logo-text { display: flex; flex-direction: column; line-height: 1; }
.logo-name { font-size: 1.2rem; font-weight: 900; letter-spacing: -0.03em; color: #0f172a; }
.logo-accent { color: var(--app-primary, #1f4db7); }
.logo-tagline {
  font-size: 0.65rem; font-weight: 500;
  letter-spacing: 0.08em; color: #94a3b8; margin-top: 0.15rem;
}
.user-avatar {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.75rem; height: 1.75rem; border-radius: 9999px;
  background: var(--app-primary, #1f4db7); color: white;
  font-size: 0.7rem; font-weight: 700; flex-shrink: 0;
}

.auth-nav-link:focus,
.auth-nav-link:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: transparent;
}
</style>
