<script setup>
import { RouterLink } from 'vue-router';
import AuthTopNav from '../components/AuthTopNav.vue';
import AppFooter from '../components/AppFooter.vue';
</script>

<template>
  <div class="page-root flex min-h-screen w-screen flex-col">
    <AuthTopNav fixed />

    <!-- ─── PAGE HEADER ───────────────────────────────────────── -->
    <div class="page-header pt-28 pb-12 px-6 sm:px-10 lg:px-16 bg-white border-b border-slate-100">
      <div class="mx-auto max-w-6xl">
        <p class="section-kicker">Platform Features</p>
        <h1 class="page-title mt-2">Powerful Features Built<br/>for Real Accountability</h1>
        <p class="mt-4 max-w-xl text-base leading-7 text-slate-500">
          Everything you need to submit, track, and resolve complaints — designed to be simple for citizens and efficient for organizations.
        </p>
      </div>
    </div>

    <!-- ─── FEATURES GRID ─────────────────────────────────────── -->
    <main class="flex-1 bg-white px-6 py-16 sm:px-10 lg:px-16">
      <div class="mx-auto max-w-6xl">

        <!-- Row 1 -->
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          <div class="feature-card">
            <div class="f-icon bg-orange-50 text-orange-500">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </div>
            <h3 class="f-title">Easy Complaint Submission</h3>
            <p class="f-desc">Submit complaints quickly through a clean, purpose-built online form. Choose your organization and department directly — no generic inboxes.</p>
          </div>

          <div class="feature-card">
            <div class="f-icon bg-emerald-50 text-emerald-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            </div>
            <h3 class="f-title">Real-Time Complaint Tracking</h3>
            <p class="f-desc">Use your unique tracking code to monitor every stage of your complaint — from submission to resolution — without needing to log in.</p>
          </div>

          <div class="feature-card">
            <div class="f-icon bg-violet-50 text-violet-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h3 class="f-title">Anonymous Reporting</h3>
            <p class="f-desc">Submit complaints without revealing your identity when needed. Privacy-first design ensures your safety is never compromised.</p>
          </div>

          <div class="feature-card">
            <div class="f-icon bg-sky-50 text-sky-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="f-title">Direct Organization Routing</h3>
            <p class="f-desc">Complaints are sent straight to the correct organization and department — not a triage queue. Faster routing means faster resolution.</p>
          </div>

          <div class="feature-card">
            <div class="f-icon bg-amber-50 text-amber-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <h3 class="f-title">Admin Analytics Dashboard</h3>
            <p class="f-desc">Organization admins get a full analytics view — complaint volumes, resolution rates, department performance, and response timelines.</p>
          </div>

          <div class="feature-card">
            <div class="f-icon bg-rose-50 text-rose-500">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <h3 class="f-title">Status Notifications</h3>
            <p class="f-desc">Get notified at every stage of your complaint's progress. No more wondering — every update is logged and visible in your timeline.</p>
          </div>

          <div class="feature-card">
            <div class="f-icon bg-teal-50 text-teal-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <h3 class="f-title">Multi-Organization Support</h3>
            <p class="f-desc">The platform supports multiple organizations simultaneously — each with their own admin space, departments, and complaint queues.</p>
          </div>

          <div class="feature-card">
            <div class="f-icon bg-indigo-50 text-indigo-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 class="f-title">Role-Based Access Control</h3>
            <p class="f-desc">Super admins, org admins, and regular users each have a tailored experience. Sensitive data stays within the right hands at all times.</p>
          </div>

          <div class="feature-card">
            <div class="f-icon bg-orange-50 text-orange-500">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
            </div>
            <h3 class="f-title">Feedback & Rating System</h3>
            <p class="f-desc">After a complaint is resolved, users can rate the experience. This keeps organizations accountable and helps improve response quality over time.</p>
          </div>

        </div>

        <!-- CTA strip -->
        <div class="cta-strip mt-16">
          <div>
            <p class="text-lg font-bold text-white">Ready to submit your first complaint?</p>
            <p class="mt-1 text-sm text-blue-200/70">It takes less than two minutes. No account required.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <RouterLink to="/submit-complaint" class="cta-btn-primary">Submit a Complaint</RouterLink>
            <RouterLink to="/track-complaint" class="cta-btn-outline">Track a Case</RouterLink>
          </div>
        </div>

      </div>
    </main>

    <AppFooter />

  </div>
</template>

<style scoped>
.page-root { font-family: 'Times New Roman', Times, serif; }

/* ── Page header ───────────────────────────── */
.section-kicker {
  display: block; font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.24em; text-transform: uppercase; color: #f97316;
}
.page-title {
  font-family: 'Times New Roman', Times, serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 900;
  color: #0f2444; line-height: 1.1;
}

/* ── Feature cards ─────────────────────────── */
.feature-card {
  padding: 1.75rem;
  border-radius: 1.25rem;
  border: 1px solid #e8edf5;
  background: #fff;
  box-shadow: 0 2px 16px rgba(15,36,68,0.05);
  transition: all 0.22s ease;
}
.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(15,36,68,0.10);
  border-color: #d0daea;
}
.f-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.75rem; height: 2.75rem; border-radius: 0.75rem;
}
.f-title {
  margin-top: 1rem;
  font-size: 1rem; font-weight: 700; color: #0f2444;
}
.f-desc {
  margin-top: 0.5rem;
  font-size: 0.875rem; line-height: 1.7; color: #64748b;
}

/* ── CTA strip ─────────────────────────────── */
.cta-strip {
  display: flex; flex-wrap: wrap;
  align-items: center; justify-content: space-between;
  gap: 1.25rem;
  padding: 2rem 2.5rem;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, #0f2444 0%, #162d5c 100%);
  box-shadow: 0 8px 40px rgba(15,36,68,0.18);
}
.cta-btn-primary {
  padding: 0.75rem 1.75rem;
  border-radius: 9999px;
  background: #f97316;
  color: white; font-size: 0.875rem; font-weight: 700;
  text-decoration: none;
  box-shadow: 0 6px 20px rgba(249,115,22,0.4);
  transition: all 0.2s;
}
.cta-btn-primary:hover { background: #ea6c0c; transform: translateY(-1px); }
.cta-btn-outline {
  padding: 0.75rem 1.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.08);
  color: white; font-size: 0.875rem; font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}
.cta-btn-outline:hover { background: rgba(255,255,255,0.15); }

</style>
