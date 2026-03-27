<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { socialLinks } from '../config/socialLinks';
import { useSessionStore } from '../stores/session';

const route = useRoute();
const session = useSessionStore();

const isLoggedIn = computed(() => session.isLoggedIn);

const dashboardRoute = computed(() => {
  if (session.currentUser?.role === 'super_admin') return '/admin/dashboard';
  if (session.currentUser?.role === 'org_admin') return '/org-admin/dashboard';
  if (session.currentUser?.role === 'user') return '/user/dashboard';
  return '/signin';
});

const isActive = (path) => route.path === path;
</script>

<template>
  <footer class="border-t border-white/10 bg-slate-950 text-slate-300">
    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-3 md:gap-12 md:py-16">
      <section class="group border-l-2 border-transparent pl-4 transition-all duration-300 hover:border-orange-500">
        <h2 class="text-2xl font-black text-white">
          <span class="text-blue-500">
            Complaint
          </span><span class="text-orange-500">MS</span>
        </h2>

        <p class="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
          Empowering users to report, track, and resolve complaints efficiently with transparency and control.
        </p>
      </section>

      <nav class="group border-l-2 border-transparent pl-4 transition-all duration-300 hover:border-orange-500">
        <h3 class="mb-5 text-lg font-semibold text-white">
          Navigation
        </h3>

        <ul class="space-y-4 text-sm">
          <li>
            <RouterLink
              to="/"
              :class="['nav-link', isActive('/') ? 'active' : '']"
            >
              Home
            </RouterLink>
          </li>

          <li>
            <RouterLink
              to="/about"
              :class="['nav-link', isActive('/about') ? 'active' : '']"
            >
              About
            </RouterLink>
          </li>

          <li>
            <RouterLink
              to="/features"
              :class="['nav-link', isActive('/features') ? 'active' : '']"
            >
              Features
            </RouterLink>
          </li>

          <li>
            <RouterLink
              to="/services"
              :class="['nav-link', isActive('/services') ? 'active' : '']"
            >
              Services
            </RouterLink>
          </li>

          <li>
            <RouterLink
              to="/contact"
              :class="['nav-link', isActive('/contact') ? 'active' : '']"
            >
              Contact
            </RouterLink>
          </li>

          <li>
            <RouterLink
              :to="isLoggedIn ? dashboardRoute : '/signin'"
              :class="['nav-link', isActive('/signin') ? 'active' : '']"
            >
              {{ isLoggedIn ? 'Open Dashboard' : 'Sign In' }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <section class="group border-l-2 border-transparent pl-4 transition-all duration-300 hover:border-orange-500">
        <h3 class="mb-5 text-lg font-semibold text-white">
          Contact
        </h3>

        <p class="text-sm text-slate-400">
          Email:
          <a
            href="mailto:support@complaintms.com"
            class="footer-inline-link"
          >
            support@complaintms.com
          </a>
        </p>

        <p class="mt-2 text-sm text-slate-400">
          Phone: +231 77 000 0000
        </p>

        <div class="mt-6 flex gap-6">
          <a :href="socialLinks.x" target="_blank" rel="noreferrer" class="social-icon" aria-label="X">
            <font-awesome-icon :icon="['fab', 'x-twitter']" class="icon" />
          </a>

          <a :href="socialLinks.facebook" target="_blank" rel="noreferrer" class="social-icon" aria-label="Facebook">
            <font-awesome-icon :icon="['fab', 'facebook-f']" class="icon" />
          </a>

          <a :href="socialLinks.instagram" target="_blank" rel="noreferrer" class="social-icon" aria-label="Instagram">
            <font-awesome-icon :icon="['fab', 'instagram']" class="icon" />
          </a>

          <a :href="socialLinks.linkedin" target="_blank" rel="noreferrer" class="social-icon" aria-label="LinkedIn">
            <font-awesome-icon :icon="['fab', 'linkedin-in']" class="icon" />
          </a>
        </div>
      </section>
    </div>

    <div class="border-t border-white/10 py-6 text-center text-xs text-slate-500">
      © 2026 Complaint MS. All rights reserved.
    </div>
  </footer>
</template>

<style scoped>
.nav-link {
  position: relative;
  display: inline-block;
  color: #cbd5e1;
  transition: color 0.3s ease;
}

.nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -3px;
  width: 0%;
  height: 2px;
  background: #f97316;
  transition: width 0.3s ease;
}

.nav-link:hover {
  color: #f97316;
}

.nav-link:hover::after {
  width: 100%;
}

.active {
  color: #f97316;
}

.active::after {
  width: 100%;
}

.footer-inline-link {
  position: relative;
  display: inline-block;
  color: #e2e8f0;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-inline-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -3px;
  width: 0%;
  height: 2px;
  background: #f97316;
  transition: width 0.3s ease;
}

.footer-inline-link:hover {
  color: #f97316;
}

.footer-inline-link:hover::after {
  width: 100%;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: transform 0.25s ease, color 0.25s ease;
}

.social-icon:hover {
  transform: translateY(-3px) scale(1.15);
  color: #f97316;
}

.icon {
  width: 20px;
  height: 20px;
}
</style>
