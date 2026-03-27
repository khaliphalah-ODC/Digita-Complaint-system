<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
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
const scrolled = ref(false);

const publicItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Features', to: '/features' },
  { label: 'Services', to: '/services' },
  { label: 'Contact', to: '/contact' }
];

const isLoggedIn = computed(() => session.isLoggedIn);

const dashboardRoute = computed(() => {
  if (session.currentUser?.role === 'super_admin') return '/admin/dashboard';
  if (session.currentUser?.role === 'org_admin') return '/org-admin/dashboard';
  return '/user/dashboard';
});

const wrapperClass = computed(() => (
  props.fixed ? 'fixed inset-x-0 top-0 z-40' : 'relative z-40'
));

const handleScroll = () => {
  scrolled.value = window.scrollY > 10;
};

onMounted(() => window.addEventListener('scroll', handleScroll));
onUnmounted(() => window.removeEventListener('scroll', handleScroll));

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false;
});
</script>

<template>
  <header :class="[wrapperClass, 'public-nav', scrolled ? 'public-nav-scrolled' : '']">
    <div class="public-nav__container">
      <RouterLink to="/" class="public-nav__logo">
        <div class="public-nav__logo-box">CT</div>
        <div class="public-nav__logo-text">
          <div class="public-nav__title">ComplaintTrack</div>
          <div class="public-nav__sub">Institutional System</div>
        </div>
      </RouterLink>

      <nav class="public-nav__links" aria-label="Public navigation">
        <RouterLink
          v-for="item in publicItems"
          :key="item.to"
          :to="item.to"
          class="public-nav__item"
          :class="{ active: route.path === item.to }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="public-nav__actions">
        <template v-if="!isLoggedIn">
          <RouterLink to="/signin" class="public-nav__btn public-nav__btn-ghost">Login</RouterLink>
          <RouterLink to="/signup" class="public-nav__btn public-nav__btn-primary">Sign Up</RouterLink>
        </template>

        <RouterLink
          v-if="isLoggedIn"
          :to="dashboardRoute"
          class="public-nav__btn public-nav__btn-outline"
        >
          Dashboard
        </RouterLink>
      </div>

      <button class="public-nav__menu-btn" type="button" @click="mobileMenuOpen = !mobileMenuOpen">
        <font-awesome-icon :icon="['fas', mobileMenuOpen ? 'xmark' : 'bars']" />
      </button>
    </div>

    <div v-if="mobileMenuOpen" class="public-nav__mobile">
      <div class="public-nav__mobile-head">
        <p class="public-nav__mobile-kicker">Navigation</p>
        <p class="public-nav__mobile-title">Public Workspace</p>
      </div>

      <RouterLink
        v-for="item in publicItems"
        :key="item.to"
        :to="item.to"
        class="public-nav__mobile-item"
        :class="{ active: route.path === item.to }"
      >
        {{ item.label }}
      </RouterLink>

      <div class="public-nav__mobile-actions">
        <template v-if="!isLoggedIn">
          <RouterLink to="/signin" class="public-nav__btn public-nav__btn-ghost">Login</RouterLink>
          <RouterLink to="/signup" class="public-nav__btn public-nav__btn-primary">Sign Up</RouterLink>
        </template>

        <RouterLink
          v-if="isLoggedIn"
          :to="dashboardRoute"
          class="public-nav__btn public-nav__btn-outline"
        >
          Dashboard
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.public-nav {
  background: linear-gradient(180deg, rgba(11, 46, 74, 0.98), rgba(12, 49, 79, 0.95));
  border-bottom: 1px solid rgba(140, 185, 228, 0.12);
  transition: all 0.3s ease;
  box-shadow: 0 10px 24px rgba(6, 21, 41, 0.12);
}

.public-nav-scrolled {
  backdrop-filter: blur(14px);
  background: linear-gradient(180deg, rgba(11, 46, 74, 0.9), rgba(12, 49, 79, 0.9));
  box-shadow: 0 16px 32px rgba(6, 21, 41, 0.18);
}

.public-nav__container {
  max-width: 1200px;
  margin: auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.public-nav__logo {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  color: white;
  text-decoration: none;
  min-width: 0;
}

.public-nav__logo-box {
  width: 2.55rem;
  height: 2.55rem;
  border-radius: 0.9rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(226, 238, 251, 0.94));
  color: #0b2e4a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  box-shadow: 0 10px 18px rgba(5, 18, 38, 0.16);
}

.public-nav__logo-text {
  min-width: 0;
}

.public-nav__title {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.public-nav__sub {
  margin-top: 0.12rem;
  font-size: 0.64rem;
  color: rgba(207, 227, 255, 0.74);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.public-nav__links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.35rem 0.45rem;
  background: rgba(255, 255, 255, 0.04);
  flex: 1;
  max-width: 38rem;
  min-width: 0;
  box-shadow: none;
  
}
 
.public-nav__item {
  position: relative;
  padding: 0.7rem 1rem;
  color: #cfe3ff;
  text-decoration: none;
  font-size: 0.89rem;
  font-weight: 600;
  transition: color 0.25s ease;
  min-width: 0;
  text-align: center;
  white-space: nowrap;
}

.public-nav__item::after {
  content: "";
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 0.38rem;
  height: 2px;
  width: auto;
  transform: scaleX(0);
  transform-origin: left center;
  background: #f97316;
  transition: transform 0.3s ease;
}

.public-nav__item:hover {
  color: white;
}

.public-nav__item:hover::after,
.public-nav__item.active::after {
  transform: scaleX(1);
  
}

.public-nav__item.active {
  color: white;
}

.public-nav__actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.public-nav__btn {
  min-height: 2.6rem;
  padding: 0.72rem 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  border-radius: 999px;
  text-decoration: none;
  transition: 0.25s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
}

.public-nav__btn-ghost {
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.04);
}

.public-nav__btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

.public-nav__btn-primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  box-shadow: 0 10px 20px rgba(29, 78, 216, 0.26);
}

.public-nav__btn-primary:hover {
  background: #1d4ed8;
}

.public-nav__btn-outline {
  border: 1px solid #60a5fa;
  color: #60a5fa;
  background: rgba(255, 255, 255, 0.04);
}

.public-nav__btn-outline:hover {
  background: rgba(96, 165, 250, 0.15);
}

.public-nav__menu-btn {
  display: none;
  min-height: 2.55rem;
  min-width: 2.55rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: white;
  box-shadow: 0 8px 18px rgba(6, 21, 41, 0.16);
}

.public-nav__mobile {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1rem 1.1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(11, 46, 74, 0.98);
}

.public-nav__mobile-head {
  padding: 0.25rem 0 0.7rem;
}

.public-nav__mobile-kicker {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(207, 227, 255, 0.74);
}

.public-nav__mobile-title {
  margin-top: 0.28rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: white;
}

.public-nav__mobile-item {
  border-radius: 0.9rem;
  color: #cfe3ff;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.9rem 0.95rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
}

.public-nav__mobile-item:hover,
.public-nav__mobile-item.active {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.08);
  color: white;
}

.public-nav__mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: 0.8rem;
}

@media (max-width: 768px) {
  .public-nav__container {
    padding: 0.9rem 1rem;
  }

  .public-nav__links,
  .public-nav__actions {
    display: none;
  }

  .public-nav__menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .public-nav__menu-btn svg {
    font-size: 1.1rem;
  }

  .public-nav__title {
    font-size: 0.98rem;
  }

  .public-nav__sub {
    font-size: 0.58rem;
  }
}
</style>
