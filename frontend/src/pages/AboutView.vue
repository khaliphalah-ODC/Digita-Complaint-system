<script setup>
import { RouterLink } from 'vue-router';
import AuthTopNav from '../components/AuthTopNav.vue';
import AppFooter from '../components/AppFooter.vue';
</script>

<template>
  <div class="page-root flex min-h-screen w-screen flex-col">
    <AuthTopNav fixed />

    <!-- Hero Section -->
    <section class="hero-section relative flex items-center justify-center overflow-hidden pt-20">
      <!-- Background overlay -->
      <div class="hero-overlay absolute inset-0 z-10"></div>

      <!-- Decorative architectural line art -->
      <div class="absolute inset-0 z-0">
        <svg class="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,160 L80,160 L80,80 L160,80 L160,160 L240,160 L240,40 L320,40 L320,160 L400,160 L400,100 L480,100 L480,160 L560,160 L560,60 L640,60 L640,160 L720,160 L720,120 L800,120 L800,160 L880,160 L880,50 L960,50 L960,160 L1040,160 L1040,90 L1120,90 L1120,160 L1200,160 L1200,70 L1280,70 L1280,160 L1360,160 L1360,110 L1440,110 L1440,320 L0,320 Z" fill="white"/>
        </svg>
      </div>

      <div class="relative z-20 mx-auto max-w-5xl px-6 py-20 text-center sm:py-28 lg:py-36">
        <h1 class="hero-title text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-8xl">
          Submit Your
          <span class="block text-[#f97316]">Complaints.</span>
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-base leading-7 text-blue-100/80 sm:text-lg">
           A digital civic platform that allows citizens, students, and customers to report issues directly — and track every step of their resolution in real time.
        </p>
      </div>

      <!-- Wave divider -->
      <!--<div class="absolute bottom-0 left-0 right-0 z-20">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" class="w-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f5f7fa"/>
        </svg>
      </div>-->
    </section>

    <!-- ─── MISSION ───────────────────────────────────────────── -->
    <section class="bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
      <div class="mx-auto max-w-6xl">
        <div class="grid items-center gap-16 lg:grid-cols-1">
          <div>
            <p class="section-kicker">Our Mission</p>
            <h2 class="section-title mt-2">Every Complaint Deserves<br/>a Real Response.</h2>
            <p class="mt-6 text-base leading-8 text-slate-600">
              We believe accountability starts with access. Too often, citizens, students, and customers struggle to make their voices heard — complaints disappear into inboxes, go unacknowledged, or get lost in bureaucracy. ComplaintTrack changes that.
            </p>
            <p class="mt-4 text-base leading-8 text-slate-600">
              Our platform ensures that every complaint is routed directly to the right organization, tracked transparently, and responded to within a clear timeline. We exist to make institutions answerable to the people they serve.
            </p>

           <!-- <div class="mt-8 grid grid-cols-2 gap-4">
              <div class="mission-stat">
                <p class="mission-stat-num text-orange-500">1,200+</p>
                <p class="mission-stat-label">Complaints Filed</p>
              </div>
              <div class="mission-stat">
                <p class="mission-stat-num text-emerald-600">900+</p>
                <p class="mission-stat-label">Issues Resolved</p>
              </div>
              <div class="mission-stat">
                <p class="mission-stat-num text-sky-600">50+</p>
                <p class="mission-stat-label">Organizations</p>
              </div>
              <div class="mission-stat">
                <p class="mission-stat-num text-violet-600">98%</p>
                <p class="mission-stat-label">Satisfaction Rate</p>
              </div>
            </div>-->
          </div>

          <!-- Visual block -->
      <div class="relative">
           <!-- <div class="mission-visual-card">
              <div class="mv-inner">
                <div class="mv-icon-row">
                  <div class="mv-icon bg-orange-100 text-orange-500">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div class="mv-icon bg-sky-100 text-sky-500">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                  </div>
                  <div class="mv-icon bg-emerald-100 text-emerald-500">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                </div>
                <h3 class="mt-6 text-lg font-bold text-[#0f2444]">Direct. Transparent. Resolved.</h3>
                <p class="mt-3 text-sm leading-6 text-slate-500">From a citizen's complaint to an organization's verified response — every step is visible, tracked, and accountable.</p>

                <div class="mt-6 space-y-3">
                  <div class="timeline-item">
                    <div class="tl-dot bg-orange-500"></div>
                    <div class="tl-bar bg-orange-100"></div>
                    <span class="text-xs font-semibold text-slate-600">Complaint Submitted</span>
                  </div>
                  <div class="timeline-item">
                    <div class="tl-dot bg-sky-500"></div>
                    <div class="tl-bar bg-sky-100"></div>
                    <span class="text-xs font-semibold text-slate-600">Routed to Organization</span>
                  </div>
                  <div class="timeline-item">
                    <div class="tl-dot bg-violet-500"></div>
                    <div class="tl-bar bg-violet-100"></div>
                    <span class="text-xs font-semibold text-slate-600">Under Review</span>
                  </div>
                  <div class="timeline-item">
                    <div class="tl-dot bg-emerald-500"></div>
                    <div class="tl-bar bg-emerald-100"></div>
                    <span class="text-xs font-semibold text-emerald-700">✓ Resolved</span>
                  </div> 
                </div> 
              </div>
            </div>
            <!-- Floating accent -->
            <!--<div class="floating-badge">
              <span class="text-2xl font-black text-emerald-600">98%</span>
              <span class="text-xs text-slate-400 font-medium">satisfaction</span>
            </div> -->
          </div>-->
        </div>
      </div>
    </section>

    <!-- ─── WHAT WE STAND FOR ─────────────────────────────────── -->
    <section class="bg-[#f5f7fa] px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div class="mx-auto max-w-6xl">
        <div class="mb-14 text-center">
          <p class="section-kicker">Our Values</p>
          <h2 class="section-title mt-2">What We Stand For</h2>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div class="value-card group">
            <div class="value-icon bg-orange-100 text-orange-500 group-hover:bg-orange-500 group-hover:text-white">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </div>
            <h3 class="mt-5 text-lg font-bold text-[#0f2444]">Transparency</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">Every complaint, every status update, every response is visible to the person who filed it. No black boxes, no silence.</p>
          </div>

          <div class="value-card group">
            <div class="value-icon bg-sky-100 text-sky-500 group-hover:bg-sky-500 group-hover:text-white">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 class="mt-5 text-lg font-bold text-[#0f2444]">Accountability</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">Organizations are held to response timelines. Complaints don't vanish — they stay on record until properly closed.</p>
          </div>

          <div class="value-card group">
            <div class="value-icon bg-violet-100 text-violet-500 group-hover:bg-violet-600 group-hover:text-white">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h3 class="mt-5 text-lg font-bold text-[#0f2444]">Privacy</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">Anonymous submission is a first-class feature. Your identity is never required when you need to speak up safely.</p>
          </div>

         <!-- <div class="value-card group">
            <div class="value-icon bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h3 class="mt-5 text-lg font-bold text-[#0f2444]">Speed</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">Direct routing means complaints reach the right desk immediately — not after bouncing through three departments.</p>
          </div>-->

          <!--<div class="value-card group">
            <div class="value-icon bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <h3 class="mt-5 text-lg font-bold text-[#0f2444]">Inclusivity</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">Designed for citizens, students, and customers across all backgrounds. Clear language, simple forms, no barriers.</p>
          </div>-->

         <!-- <div class="value-card group">
            <div class="value-icon bg-rose-100 text-rose-500 group-hover:bg-rose-500 group-hover:text-white">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <h3 class="mt-5 text-lg font-bold text-[#0f2444]">Dignity</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">Every user deserves to be heard respectfully. The interface and process are designed to reduce stress, not add to it.</p>
          </div>-->
        </div>
      </div>
    </section>

    <!-- ─── HOW WE SERVE ──────────────────────────────────────── -->
    <!--<section class="relative overflow-hidden bg-[#0f2444] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
      <div class="dots absolute inset-0 opacity-[0.04]"></div>
      <div class="absolute right-0 top-0 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>

      <div class="relative mx-auto max-w-6xl">
        <div class="mb-14 text-center">
          <p class="section-kicker-light">Who We Serve</p>
          <h2 class="section-title-light mt-2">Built for Real People<br/>in Real Situations</h2>
        </div>

        <div class="grid gap-6 sm:grid-cols-3">
          <div class="serve-card">
            <div class="serve-icon text-orange-400">
              <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <h3 class="mt-5 text-lg font-bold text-white">Citizens</h3>
            <p class="mt-3 text-sm leading-7 text-blue-200/60">Residents who need to report civic issues — potholes, service failures, government inaction — and get a real response.</p>
          </div>
          <div class="serve-card">
            <div class="serve-icon text-sky-400">
              <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
            </div>
            <h3 class="mt-5 text-lg font-bold text-white">Students</h3>
            <p class="mt-3 text-sm leading-7 text-blue-200/60">University and school students who want to escalate academic or administrative concerns through a proper, documented channel.</p>
          </div>
          <div class="serve-card">
            <div class="serve-icon text-emerald-400">
              <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <h3 class="mt-5 text-lg font-bold text-white">Customers</h3>
            <p class="mt-3 text-sm leading-7 text-blue-200/60">Customers of businesses and service providers who need a formal, trackable channel to raise quality or service complaints.</p>
          </div>
        </div>
      </div>
    </section>-->

    <!-- ─── TEAM ──────────────────────────────────────────────── -->
<section class="bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
  <div class="mx-auto max-w-5xl">
    <div class="mb-14 text-center">
      <p class="section-kicker">The Team</p>
      <h2 class="section-title mt-2">The People Behind<br/>ComplaintTrack</h2>
      <p class="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">A small, focused team of technologists and civic-minded builders committed to making accountability accessible to everyone.</p>
    </div>

    <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

      <!-- Card 1 — real photo -->
      <div class="team-card">
        <img
          src="/images/yeato.jpeg"
          alt="Yeato Yowah"
          class="team-avatar-img"
        />
        <h3 class="mt-4 text-base font-bold text-[#0f2444]">Yeato Yowah</h3>
        <p class="text-sm font-medium text-orange-500">Group Head</p>
        <p class="mt-2 text-xs leading-6 text-slate-500">Built the core platform architecture and is passionate about civic tech solving real problems for everyday Liberians.</p>
      </div>

      <!-- Card 2 — initials until photo is ready -->
      <div class="team-card">
        <img
          src="/images/yeato.jpeg"
          alt="Yeato Yowah"
          class="team-avatar-img"
        />
        <h3 class="mt-4 text-base font-bold text-[#0f2444]">Yeato Yowah</h3>
        <p class="text-sm font-medium text-sky-600">UX & Product Design</p>
        <p class="mt-2 text-xs leading-6 text-slate-500">Leads the user experience to ensure the platform is accessible, calm, and frustration-free for every type of user.</p>
      </div>

      <!-- Card 3 — initials until photo is ready -->
      <div class="team-card">
        <img
          src="/images/yeato.jpeg"
          alt="Yeato Yowah"
          class="team-avatar-img"
        />
        <h3 class="mt-4 text-base font-bold text-[#0f2444]">Yeato Yowah</h3>
        <p class="text-sm font-medium text-violet-600">Backend & Systems</p>
        <p class="mt-2 text-xs leading-6 text-slate-500">Manages data security, routing logic, and the admin infrastructure that keeps organizations on track.</p>
      </div>

    </div>
  </div>
</section>

    <!-- ─── CTA ───────────────────────────────────────────────── -->
    <!--<section class="cta-section relative overflow-hidden px-6 py-24 sm:px-10 lg:px-16">
      <div class="cta-bg absolute inset-0"></div>
      <div class="absolute left-0 top-0 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl pointer-events-none"></div>
      <div class="relative z-10 mx-auto max-w-3xl text-center">
        <p class="section-kicker-light">Ready to Get Started?</p>
        <h2 class="mt-3 font-serif text-4xl font-black leading-tight text-white sm:text-5xl" style="font-family:'Playfair Display',Georgia,serif">
          Your Voice Matters.<br/>Use It Today.
        </h2>
        <p class="mx-auto mt-5 max-w-lg text-base leading-7 text-blue-200/70">
          Submit a complaint, track your case, or register your organization — ComplaintTrack is here to make accountability real.
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-4">
          <RouterLink to="/submit-complaint"
            class="inline-flex items-center gap-2.5 rounded-full bg-[#f97316] px-9 py-4 text-base font-bold text-white shadow-[0_14px_50px_rgba(249,115,22,0.55)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(249,115,22,0.65)]">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Submit a Complaint
          </RouterLink>
          <RouterLink to="/"
            class="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-9 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
            ← Back to Home
          </RouterLink>
        </div>
      </div>
    </section>-->

    <!-- ─── FOOTER STRIP ──────────────────────────────────────── -->
    
      <AppFooter />
  </div>
</template>

<style scoped>
.page-root { font-family: 'Times New Roman', Times, serif; }

/* ── Hero ──────────────────────────────────── */
.hero-section {
  min-height: 500px;
    background-image: url('https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1600&q=80');
  background-size: cover;
  background-position: center top;
}
.hero-overlay {
  background: linear-gradient(135deg, rgba(10,28,64,0.88) 0%, rgba(15,52,100,0.82) 50%, rgba(30,60,110,0.75) 100%);
}
.grid-lines {
  background-image:
    linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 60px 60px;
}
.orb { border-radius: 50%; filter: blur(80px); pointer-events: none; }
.orb-a {
  right: 5%; top: 15%; width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(249,115,22,0.18), transparent 70%);
}
.orb-b {
  left: 20%; bottom: 15%; width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(56,189,248,0.12), transparent 70%);
}
.hero-h1 {
  font-family: 'Times New Roman', Times, serif;
  letter-spacing: -0.02em;
}
/* ── Animations ────────────────────────────── */
@keyframes fade-down {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-down { animation: fade-down 0.6s ease both; }
.animate-fade-up   { animation: fade-up 0.7s ease both; }
.animation-delay-200 { animation-delay: 0.2s; }

/* ── Section type ──────────────────────────── */
.section-kicker {
  display: block; font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.24em; text-transform: uppercase; color: #f97316;
}
.section-title {
  font-family: 'Times New Roman', Times, serif;
  font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 900;
  color: #0f2444; line-height: 1.1;
}
.section-kicker-light {
  display: block; font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.24em; text-transform: uppercase; color: #fb923c;
}
.section-title-light {
  font-family: 'Times New Roman', Times, serif;
  font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 900;
  color: white; line-height: 1.1;
}

/* ── Mission section ───────────────────────── */
.mission-stat {
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  border: 1px solid rgba(15,36,68,0.08);
  background: #f8fafc;
}
.mission-stat-num {
  font-family: 'Times New Roman', Times, serif;
  font-size: 2rem; font-weight: 900; line-height: 1;
}
.mission-stat-label {
  margin-top: 0.25rem; font-size: 0.7rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;
}
.mission-visual-card {
  border-radius: 2rem;
  border: 1px solid rgba(15,36,68,0.08);
  background: white;
  box-shadow: 0 8px 50px rgba(15,36,68,0.10);
  
  padding: 2px;
}
.mv-inner { padding: 2rem; border-radius: calc(2rem - 2px); }
.mv-icon-row { display: flex; gap: 0.75rem; }
.mv-icon {
  display: flex; align-items: center; justify-content: center;
  width: 3rem; height: 3rem; border-radius: 0.875rem;
}
.timeline-item {
  display: flex; align-items: center; gap: 0.75rem;
}
.tl-dot { width: 10px; height: 10px; border-radius: 9999px; flex-shrink: 0; }
.tl-bar { flex: 1; height: 4px; border-radius: 9999px; }
.floating-badge {
  position: absolute;
  bottom: -1.25rem;
  right: -1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 30.25rem;
  border-radius: 1.25rem;
  background: white;
  box-shadow: 0 12px 40px rgba(15,36,68,0.15);
  border: 1px solid rgba(15,36,68,0.07);
}

/* ── Value cards ───────────────────────────── */
.value-card {
  background: white;
  border: 1px solid rgba(15,36,68,0.07);
  border-radius: 1.25rem; padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(15,36,68,0.05);
  transition: all 0.25s ease;
}
.value-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,36,68,0.10); }
.value-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 3.25rem; height: 3.25rem; border-radius: 1rem; transition: all 0.25s;
}

/* ── Serve cards ───────────────────────────── */
.dots {
  background-image: radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px);
  background-size: 30px 30px;
}
.serve-card {
  padding: 2rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(8px);
  transition: all 0.25s;
}
.serve-card:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
.serve-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 3.5rem; height: 3.5rem;
  border-radius: 1rem;
  background: rgba(255,255,255,0.06);
}

/* ── Team cards ────────────────────────────── */
.team-card {
  text-align: center; padding: 2rem 1.5rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(15,36,68,0.07);
  background: white;
  box-shadow: 0 4px 20px rgba(15,36,68,0.06);
  transition: all 0.25s;
}
.team-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,36,68,0.11); }
.team-avatar-img {
  width: 9rem;
  height: 9rem;
  border-radius: 9999px;
  object-fit: cover;
  object-position: center top;
  border: 3px solid #f1f5f9;
  box-shadow: 0 4px 12px rgba(15,36,68,0.12);
  margin: 0 auto 0.5rem auto;
  display: block;
}
</style>
