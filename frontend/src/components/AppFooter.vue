<script setup>
import { ref } from 'vue';
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
  <footer class="mt-6 px-3 pb-3 sm:px-4 md:px-7">
    <div class="w-full rounded-[32px] border border-[#14294b] bg-[linear-gradient(135deg,#0f1f39_0%,#163462_48%,#1f4db7_100%)] px-5 py-6 text-white shadow-[0_26px_80px_rgba(16,33,60,0.28)] sm:px-6 md:px-8">
    <div class="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div class="max-w-xl">
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">Stay Informed</p>
        <h3 class="mt-2 text-2xl font-black text-white">Complaint Management System</h3>
        <p class="mt-2 text-sm leading-6 text-blue-100/90">
          Submit, monitor, and resolve complaints with a clear organization workflow for users, organization admins, and super admins.
        </p>
      </div>

      <div class="min-w-0 flex-1 lg:max-w-md">
        <p class="text-sm font-semibold text-white">Newsletter</p>
        <p class="mt-1 text-sm text-blue-100/85">Receive product updates, complaint workflow improvements, and release notes.</p>
        <form class="mt-3 flex flex-col gap-3 sm:flex-row" @submit.prevent="subscribe">
          <input
            v-model="email"
            type="email"
            placeholder="Enter your email"
            class="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/65 focus:border-amber-300"
          >
          <button
            type="submit"
            class="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-[#10213c] hover:bg-amber-300"
          >
            Subscribe
          </button>
        </form>
      </div>

      <div>
        <p class="text-sm font-semibold text-white">Follow</p>
        <div class="mt-3 flex items-center gap-3 text-white/80">
          <a :href="socialLinks.facebook" target="_blank" rel="noreferrer" class="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 hover:bg-white/16">
            <font-awesome-icon :icon="['fab', 'facebook-f']" />
          </a>
          <a :href="socialLinks.x" target="_blank" rel="noreferrer" class="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 hover:bg-white/16">
            <font-awesome-icon :icon="['fab', 'x-twitter']" />
          </a>
          <a :href="socialLinks.instagram" target="_blank" rel="noreferrer" class="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 hover:bg-white/16">
            <font-awesome-icon :icon="['fab', 'instagram']" />
          </a>
          <a :href="socialLinks.linkedin" target="_blank" rel="noreferrer" class="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 hover:bg-white/16">
            <font-awesome-icon :icon="['fab', 'linkedin-in']" />
          </a>
        </div>
        
      </div>
    </div>
    </div>
  </footer>
</template>
