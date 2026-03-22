<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { socialLinks } from '../config/socialLinks';
import { useUiToastStore } from '../stores/uiToast';

const email = ref('');
const uiToast = useUiToastStore();

const subscribe = () => {
  if (!String(email.value || '').trim()) {
    uiToast.error('Enter an email address for the newsletter.');
    return;
  }
  uiToast.success('Newsletter signup captured.');
  email.value = '';
};
</script>

<template>
  <footer class="mt-6 pb-3">
    <div class="app-content-wrap app-shell-gutter">
      <div class="app-footer-panel w-full px-5 py-6 sm:px-6 md:px-8">
    <div class="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div class="max-w-xl">
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--app-primary)]">Platform Updates</p>
        <h3 class="mt-2 text-2xl font-semibold text-[var(--app-title-color)]">Complaint Management System</h3>
        <p class="mt-2 text-sm leading-6 text-[var(--app-muted-color)]">
          Submit, monitor, and resolve complaints with a clear organization workflow for users, organization admins, and super admins.
        </p>

        <div class="mt-5">
          <p class="text-sm font-semibold text-[var(--app-title-color)]">Quick Links</p>
          <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--app-muted-color)]">
            <RouterLink to="/" class="transition hover:text-[var(--app-primary)]">
              Home
            </RouterLink>
            <RouterLink to="/about" class="transition hover:text-[var(--app-primary)]">
              About
            </RouterLink>
            <RouterLink to="/features" class="transition hover:text-[var(--app-primary)]">
              Features
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="min-w-0 flex-1 lg:max-w-md">
        <p class="text-sm font-semibold text-[var(--app-title-color)]">Newsletter</p>
        <p class="mt-1 text-sm text-[var(--app-muted-color)]">Receive product updates, complaint workflow improvements, and release notes.</p>
        <form class="mt-3 flex flex-col gap-3 sm:flex-row" @submit.prevent="subscribe">
          <input
            v-model="email"
            type="email"
            placeholder="Enter your email"
            class="app-input"
          >
          <button
            type="submit"
            class="app-btn-primary"
          >
            Subscribe
          </button>
        </form>
      </div>

      <div>
        <p class="text-sm font-semibold text-[var(--app-title-color)]">Follow</p>
        <div class="mt-3 flex items-center gap-3 text-[var(--app-primary)]">
          <a :href="socialLinks.facebook" target="_blank" rel="noreferrer" class="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-line)] bg-[var(--app-surface)] hover:bg-[var(--app-primary-mist)]">
            <font-awesome-icon :icon="['fab', 'facebook-f']" />
          </a>
          <a :href="socialLinks.x" target="_blank" rel="noreferrer" class="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-line)] bg-[var(--app-surface)] hover:bg-[var(--app-primary-mist)]">
            <font-awesome-icon :icon="['fab', 'x-twitter']" />
          </a>
          <a :href="socialLinks.instagram" target="_blank" rel="noreferrer" class="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-line)] bg-[var(--app-surface)] hover:bg-[var(--app-primary-mist)]">
            <font-awesome-icon :icon="['fab', 'instagram']" />
          </a>
          <a :href="socialLinks.linkedin" target="_blank" rel="noreferrer" class="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-line)] bg-[var(--app-surface)] hover:bg-[var(--app-primary-mist)]">
            <font-awesome-icon :icon="['fab', 'linkedin-in']" />
          </a>
        </div>
        
      </div>
    </div>
    </div>
    </div>
  </footer>
</template>
