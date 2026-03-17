<script setup>
import { RouterLink } from 'vue-router';
import AuthTopNav from '../components/AuthTopNav.vue';
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

    <!-- ─── FOOTER (same as HomePage) ────────────────────────── -->
    <footer class="footer-lively relative overflow-hidden px-6 pb-8 pt-8 sm:px-10 lg:px-16">
      <div class="footer-accent-bar"></div>
      <div class="absolute left-10 top-10 h-72 w-72 rounded-full bg-orange-500/5 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-sky-500/5 blur-3xl pointer-events-none"></div>

      <div class="relative mx-auto max-w-6xl">
       <div class="grid gap-6 lg:grid-cols-[1.4fr,1fr,1fr,1.2fr]">

          <!-- Brand -->
          <div>
            <div class="footer-brand">
              <svg class="h-7 w-7 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.103 0-2 .897-2 2v18l4-4h14c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm-6 11h-4v-2h4v2zm0-4H8V7h6v2z"/></svg>
              <span class="text-xl font-black tracking-tight text-white">ComplaintTrack</span>
            </div>
            <p class="mt-4 max-w-xs text-sm leading-7 text-slate-400">A civic platform empowering citizens to raise issues clearly and organizations to resolve them fast.</p>
            <div class="mt-6 flex gap-3">
              <a href="#" class="social-icon" aria-label="Facebook">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" class="social-icon" aria-label="Twitter">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" class="social-icon" aria-label="GitHub">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="footer-heading">Quick Links</h4>
            <ul class="mt-5 space-y-3">
              <li><RouterLink to="/" class="footer-link">Home</RouterLink></li>
              <li><RouterLink to="/features" class="footer-link">Features</RouterLink></li>
              <li><RouterLink to="/about" class="footer-link">About</RouterLink></li>
              <li><a href="#" class="footer-link">Contact</a></li>
            </ul>
          </div>

          <!-- Account -->
          <div>
            <h4 class="footer-heading">Account</h4>
            <ul class="mt-5 space-y-3">
              <li><RouterLink to="/login" class="footer-link">Login</RouterLink></li>
              <li><RouterLink to="/signup" class="footer-link">Register</RouterLink></li>
              <li><RouterLink to="/submit-complaint" class="footer-link">Submit Complaint</RouterLink></li>
              <li><RouterLink to="/track-complaint" class="footer-link">Track Complaint</RouterLink></li>
            </ul>
          </div>

          <!-- Support -->
          <div>
            <h4 class="footer-heading">Support</h4>
            <ul class="mt-5 space-y-4">
              <li class="flex items-center gap-3">
                <div class="footer-contact-icon">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <span class="text-sm text-slate-400">support@complainttrack.com</span>
              </li>
              <li class="flex items-center gap-3">
                <div class="footer-contact-icon">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <span class="text-sm text-slate-400">help@complainttrack.com</span>
              </li>
            </ul>
            <div class="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4">
              <p class="text-xs font-semibold text-slate-300">Get system updates</p>
              <p class="mt-1 text-xs text-slate-500">Stay informed about new features.</p>
              <div class="mt-3 flex gap-2">
                <input type="email" placeholder="your@email.com" class="newsletter-input" />
                <button class="newsletter-btn">→</button>
              </div>
            </div>
          </div>
        </div>

       <div class="footer-bottom mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p class="text-sm text-slate-500">© 2026 ComplaintTrack. All rights reserved.</p>
          <div class="flex gap-5 text-sm text-slate-500">
            <a href="#" class="transition hover:text-slate-300">Privacy Policy</a>
            <a href="#" class="transition hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

.page-root { font-family: 'DM Sans', sans-serif; }

/* ── Page header ───────────────────────────── */
.section-kicker {
  display: block; font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.24em; text-transform: uppercase; color: #f97316;
}
.page-title {
  font-family: 'Playfair Display', Georgia, serif;
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

/* ── Footer (identical to HomePage) ───────── */
.footer-lively {
  background: linear-gradient(180deg, #0a1628 0%, #060e1c 100%);
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 2rem !important;
  padding-bottom: 1.5rem !important;
}
.footer-accent-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #f97316, #fb923c, #fbbf24, #38bdf8, #818cf8);
}
.footer-brand { display: flex; align-items: center; gap: 0.6rem; }
.footer-heading {
  font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8;
}
.footer-link {
  font-size: 0.875rem; color: #64748b;
  transition: color 0.2s; text-decoration: none; display: block;
}
.footer-link:hover { color: #f97316; }
.footer-contact-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; border-radius: 0.5rem;
  background: rgba(249,115,22,0.1); color: #f97316; flex-shrink: 0;
}
.social-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #94a3b8; transition: all 0.2s; text-decoration: none;
}
.social-icon:hover {
  background: rgba(249,115,22,0.15);
  border-color: rgba(249,115,22,0.3);
  color: #f97316;
}
.newsletter-input {
  flex: 1; min-width: 0;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.5rem; padding: 0.45rem 0.75rem;
  font-size: 0.8rem; color: white; outline: none;
}
.newsletter-input::placeholder { color: #475569; }
.newsletter-btn {
  padding: 0.45rem 0.9rem; border-radius: 0.5rem;
  background: #f97316; color: white; font-weight: 700;
  font-size: 0.9rem; border: none; cursor: pointer; transition: background 0.2s;
}
.newsletter-btn:hover { background: #ea6c0c; }
.footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 1.5rem;
}
</style>