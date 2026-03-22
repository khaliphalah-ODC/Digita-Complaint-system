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

        <div class="footer-bottom">
          <p class="footer-copy">&#169; 2026 ComplaintTrack. All rights reserved.</p>
          <div class="footer-legal">
            <a href="#" class="legal-link">Privacy Policy</a>
            <a href="#" class="legal-link">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #072f6d 0%, #061a3b 100%);
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 2rem;
  padding-bottom: 2rem;
}
.footer-accent-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #072f6d,  #072f6d,  #072f6d,  #072f6d,  #072f6d);
}
.footer-glow {
  position: absolute; border-radius: 50%;
  filter: blur(80px); pointer-events: none;
}
.footer-glow-left  { left: 2rem; top: 2rem; width: 18rem; height: 18rem; background: rgba(249,115,22,0.05); }
.footer-glow-right { right: 2rem; bottom: 2rem; width: 14rem; height: 14rem; background: rgba(56,189,248,0.05); }
.footer-inner {
  position: relative;
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 1.5rem;
}
@media (min-width: 640px)  { .footer-inner { padding: 0 2.5rem; } }
@media (min-width: 1024px) { .footer-inner { padding: 0 4rem; } }
.footer-grid {
  display: grid; gap: 3rem;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .footer-grid { grid-template-columns: 1.4fr 1fr 1fr 1.2fr; }
}
.footer-col {}
.footer-brand { display: flex; align-items: center; gap: 0.6rem; }
.brand-icon { width: 1.75rem; height: 1.75rem; color: #f97316; }
.brand-name { font-size: 1.25rem; font-weight: 900; letter-spacing: -0.02em; color: white; }
.brand-desc { margin-top: 1rem; max-width: 18rem; font-size: 0.875rem; line-height: 1.75; color:  #eef1f5; }
.social-row { margin-top: 1.5rem; display: flex; gap: 0.75rem; }
.social-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color:  #eef1f5; transition: all 0.2s; text-decoration: none;
}
.social-icon:hover { background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.30); color: #f97316; }
.si-svg { width: 1rem; height: 1rem; }
.footer-heading {
  font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase; color: #eef1f5;
}
.footer-links {
  margin-top: 1.25rem; list-style: none; padding: 0;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.footer-link {
  font-size: 0.875rem; color:  #eef1f5;
  transition: color 0.2s; text-decoration: none; display: block;
}
.footer-link:hover { color: #f97316; }
.footer-contact-list {
  margin-top: 1.25rem; list-style: none; padding: 0;
  display: flex; flex-direction: column; gap: 1rem;
}
.footer-contact-item { display: flex; align-items: center; gap: 0.75rem; }
.contact-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; border-radius: 0.5rem;
  background: rgba(249,115,22,0.10); color: #f97316; flex-shrink: 0;
}
.contact-text { font-size: 0.875rem; color:  #eef1f5; }
.newsletter-box {
  margin-top: 2rem; border-radius: 1rem;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.04); padding: 1rem;
}
.newsletter-title { font-size: 0.75rem; font-weight: 600; color:  #eef1f5; }
.newsletter-sub   { margin-top: 0.25rem; font-size: 0.72rem; color:  #eef1f5; }
.newsletter-row   { margin-top: 0.75rem; display: flex; gap: 0.5rem; }
.newsletter-input {
  flex: 1; min-width: 0; background:  #eef1f5;
  border: 1px solid rgba(255,255,255,0.10); border-radius: 0.5rem;
  padding: 0.45rem 0.75rem; font-size: 0.8rem; color: white; outline: none;
}
.newsletter-input::placeholder { color: #475569; }
.newsletter-btn {
  padding: 0.45rem 0.9rem; border-radius: 0.5rem;
  background: #f97316; color: white; font-weight: 700;
  font-size: 0.9rem; border: none; cursor: pointer; transition: background 0.2s;
}
.newsletter-btn:hover { background: #ea6c0c; }
.footer-bottom {
  margin-top: 3.5rem; padding-top: 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column;
  align-items: center; justify-content: space-between; gap: 1rem;
}
@media (min-width: 640px) { .footer-bottom { flex-direction: row; } }
.footer-copy { font-size: 0.875rem; color: #475569; }
.footer-legal { display: flex; gap: 1.25rem; }
.legal-link { font-size: 0.875rem; color: #475569; text-decoration: none; transition: color 0.2s; }
.legal-link:hover { color: #cbd5e1; }
</style>