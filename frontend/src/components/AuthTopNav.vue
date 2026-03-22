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

const wrapperClass = computed(() => (props.fixed ? 'fixed inset-x-0 top-0 z-40' : ''));
const shellClass = computed(() => (
  props.fixed
    ? 'app-shell-panel px-4 py-3.5 sm:px-5 md:px-7'
    : 'app-shell-panel mb-6 w-full px-4 py-3.5 sm:px-5 md:px-7'
));
const mobileToggleClass = computed(() => (
  mobileMenuOpen.value
    ? 'inline-flex min-h-[42px] items-center gap-2 rounded-full border border-[var(--app-line-strong)] bg-white/95 px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-sm sm:hidden'
    : 'inline-flex min-h-[42px] items-center gap-2 rounded-full border border-[var(--app-line)] bg-white/92 px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-sm sm:hidden'
));

const publicLinkClass = (to) => {
  const isActive = route.path === to;
  return isActive
    ? 'inline-flex min-h-[42px] items-center rounded-full bg-[var(--app-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm'
    : 'inline-flex min-h-[42px] items-center rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[var(--app-primary-mist)] hover:text-slate-900';
};

const authLinkClass = (to) => {
  const isActive = route.path === to;
  if (to === '/signin') {
      return isActive
      ? 'inline-flex min-h-[42px] items-center rounded-full border border-[var(--app-line-strong)] bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm'
      : 'inline-flex min-h-[42px] items-center rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-[var(--app-primary-mist)]';
  }

  if (to === '/signup') {
    return isActive
      ? 'inline-flex min-h-[42px] items-center rounded-full bg-[var(--app-primary)] px-4.5 py-2 text-sm font-semibold text-white shadow-sm'
      : 'inline-flex min-h-[42px] items-center rounded-full bg-[var(--app-primary)] px-4.5 py-2 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)]';
  }

  return 'inline-flex min-h-[42px] items-center rounded-full border border-[var(--app-primary)] px-4.5 py-2 text-sm font-semibold text-[var(--app-primary)] hover:bg-[var(--app-primary-mist)]';
};

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false;
});
</script>

<template>
  <div :class="wrapperClass">
    <header :class="shellClass">
      <nav class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

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
          <RouterLink to="/signin" :class="authLinkClass('/signin')">
            Login
          </RouterLink>
          <RouterLink to="/signup" :class="authLinkClass('/signup')">
            Sign Up
          </RouterLink>
          <RouterLink
            v-if="isLoggedIn"
            :to="dashboardRoute"
            class="inline-flex min-h-[42px] items-center rounded-full border border-[var(--app-primary)] px-4.5 py-2 text-sm font-semibold text-[var(--app-primary)] hover:bg-[var(--app-primary-mist)]"
          >
            Dashboard
          </RouterLink>
        </div>

        <div v-if="mobileMenuOpen" class="flex flex-col gap-4 rounded-[24px] border border-[var(--app-line)] bg-white/96 p-4 shadow-[0_18px_44px_rgba(17,28,48,0.08)] sm:hidden">
          <ul class="flex flex-col gap-2 text-slate-700">
            <li v-for="item in publicItems" :key="`mobile-${item.to}`">
              <RouterLink :to="item.to" :class="`block ${publicLinkClass(item.to)}`">
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>

          <div class="flex flex-wrap gap-2">
            <RouterLink to="/signin" :class="authLinkClass('/signin')">
              Login
            </RouterLink>
            <RouterLink to="/signup" :class="authLinkClass('/signup')">
              Sign Up
            </RouterLink>
            <RouterLink
              v-if="isLoggedIn"
              :to="dashboardRoute"
              class="inline-flex min-h-[42px] items-center rounded-full border border-[var(--app-primary)] px-4.5 py-2 text-sm font-semibold text-[var(--app-primary)] hover:bg-[var(--app-primary-mist)]"
            >
              Dashboard
            </RouterLink>
          </div>
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
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 0.875rem;
  background: var(--app-primary, #183a63);
  color: white;
  flex-shrink: 0;
  box-shadow: 0 10px 20px rgba(24, 58, 99, 0.16);
}
.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.logo-name {
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  font-size: 1.12rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--app-title-color);
}
.logo-accent {
  color: var(--app-primary, #1f4db7);
}
.logo-tagline {
  font-size: 0.63rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a94a6;
  margin-top: 0.2rem;
}
</style>
