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
    ? 'border-b border-white/12 bg-[linear-gradient(135deg,#0f1f39_0%,#163462_48%,#1f4db7_100%)] px-4 py-4 text-white shadow-[0_18px_48px_rgba(15,31,57,0.28)] sm:px-5 md:px-8'
    : 'mb-6 w-full border border-white/12 bg-[linear-gradient(135deg,#0f1f39_0%,#163462_48%,#1f4db7_100%)] px-4 py-4 text-white shadow-[0_18px_48px_rgba(15,31,57,0.28)] sm:px-5 md:px-8'
));
const navMetaClass = 'text-sm font-semibold uppercase tracking-[0.24em] text-blue-100';
const navTitleClass = 'text-2xl font-black text-white sm:text-3xl';
const navSubClass = 'text-xs font-medium text-blue-100/80';
const mobileToggleClass = computed(() => (
  mobileMenuOpen.value
    ? 'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/14 px-3 py-2 text-xs font-semibold text-white shadow-sm md:hidden'
    : 'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white shadow-sm md:hidden'
));
const desktopNavClass = 'hidden flex-wrap items-center gap-2 text-sm font-semibold text-white md:flex';
const mobilePanelClass = 'flex flex-col gap-4 rounded-[28px] border border-white/16 bg-white/10 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.22)] backdrop-blur-xl md:hidden';

const publicLinkClass = (to) => {
  const isActive = route.path === to;
  return isActive
    ? 'rounded-full bg-white px-4 py-2 text-[var(--app-primary-ink)] shadow-[0_10px_24px_rgba(255,255,255,0.16)]'
    : 'rounded-full px-4 py-2 text-white/92 hover:bg-white/10 hover:text-white';
};

const authLinkClass = (to) => {
  const isActive = route.path === to;
  if (to === '/signin') {
    return isActive
      ? 'rounded-full border border-white/18 bg-white px-4 py-2 text-sm font-semibold text-[var(--app-primary-ink)]'
      : 'rounded-full border border-white/18 bg-white px-4 py-2 text-sm font-semibold text-[var(--app-primary-ink)] hover:bg-blue-50';
  }

  if (to === '/signup') {
    return isActive
      ? 'rounded-full border border-white/20 bg-white/14 px-5 py-2 text-sm font-semibold text-white'
      : 'rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/16';
  }

  return 'rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/16';
};

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false;
});
</script>

<template>
  <div :class="wrapperClass">
    <header :class="shellClass">
      <nav class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p :class="navMetaClass">Complaint Operations</p>
            <p :class="navTitleClass">Complaint <span class="text-blue-200">MS</span></p>
            <p :class="navSubClass">Submit · Track · Resolve</p>
          </div>
          <button
            :class="mobileToggleClass"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <font-awesome-icon :icon="['fas', mobileMenuOpen ? 'xmark' : 'bars']" />
            {{ mobileMenuOpen ? 'Close' : 'Menu' }}
          </button>
        </div>

        <ul :class="desktopNavClass">
          <li v-for="item in publicItems" :key="item.to">
            <RouterLink :to="item.to" :class="publicLinkClass(item.to)">
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>

        <div class="hidden flex-wrap items-center gap-2 sm:gap-3 md:flex">
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

        <div
          v-if="mobileMenuOpen"
          :class="mobilePanelClass"
        >
          <ul class="flex flex-col gap-2 text-sm font-semibold text-white">
            <li v-for="item in publicItems" :key="`mobile-${item.to}`">
              <RouterLink :to="item.to" :class="`block rounded-2xl px-4 py-3 ${publicLinkClass(item.to)}`">
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
              class="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/16"
            >
              Dashboard
            </RouterLink>
          </div>
        </div>
      </nav>
    </header>
  </div>
</template>
