<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import AuthTopNav from '../components/AuthTopNav.vue';
import AppFooter from '../components/AppFooter.vue';
import api, { unwrapResponse } from '../services/api';

const testimonials = ref([]);
const loadingTestimonials = ref(true);

onMounted(async () => {
  try {
    const response = await api.get('/testimonials/public', { skipAuth: true });
    const payload = unwrapResponse(response);
    const rows = Array.isArray(payload) ? payload : payload.data ?? [];
    testimonials.value = rows.slice(0, 6);
  } catch (error) {
    console.error('Failed to load testimonials:', error);
  } finally {
    loadingTestimonials.value = false;
  }
});

const avatarColors = ['#f97316', '#059669', '#7c3aed', '#0284c7', '#dc2626', '#d97706'];
const avatarColor = (i) => avatarColors[i % avatarColors.length];
</script>
<template>
  <div class="flex min-h-screen w-screen flex-col font-sans">
    <AuthTopNav fixed />

    <!-- Hero Section -->
    <section class="hero-section relative flex items-center justify-center overflow-hidden pt-20">
      <div class="hero-overlay absolute inset-0 z-10"></div>

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


    <!-- Cards Section -->
    <section class="bg-[#f5f7fa] px-4 py-16 sm:px-6 md:px-10 lg:py-24">
      <div class="mx-auto max-w-6xl">
        <div class="mb-10 text-center">
          <p class="text-sm font-bold font-family mt-16 uppercase tracking-[0.22em] text-[#f97316]">How It Works</p>
          <!--<h2 class="mt-2 text-3xl font-black text-[#0f2444] sm:text-4xl">Three Ways We Help</h2>-->
        </div>

        <div class="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">

          <!-- Card 1 -->
          <article class="course-card group relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(15,36,68,0.08)] transition hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,36,68,0.15)]">
            <div class="card-image-wrapper relative h-52 overflow-hidden">
              <div class="absolute inset-0 flex items-center justify-center card-bg-blue">
                <svg class="h-24 w-24 text-white opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <span class="badge badge-orange">
                <font-awesome-icon :icon="['fas', 'file-lines']" class="mr-1" />
                Submission
              </span>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold font-family text-[#0f2444]">Focused Submission of Complaints</h3>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Purpose-built forms that route directly to the right organization and department — no guesswork.
              </p>
             <!--<RouterLink to="/submit-complaint" class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f97316] transition hover:gap-3">
                Submit Now
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </RouterLink>-->
            </div>
          </article>

          <!-- Card 2 -->
          <article class="course-card group relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(15,36,68,0.08)] transition hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,36,68,0.15)]">
            <div class="card-image-wrapper relative h-52 overflow-hidden">
              <div class="absolute inset-0 flex items-center justify-center card-bg-green">
                <svg class="h-24 w-24 text-white opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <span class="badge badge-emerald">
                <font-awesome-icon :icon="['fas', 'chart-line']" class="mr-1" />
                Tracking
              </span>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold font-family text-[#0f2444]">Easy Tracking of Complaints</h3>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Tracking codes, timelines, and statuses are visible and clear — without making users decode a confusing system.
              </p>
              <!--<RouterLink to="/track-complaint" class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f97316] transition hover:gap-3">
                Track a Case
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </RouterLink>-->
            </div>
          </article>

          <!-- Card 3 -->
          <article class="course-card group relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(15,36,68,0.08)] transition hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,36,68,0.15)]">
            <div class="card-image-wrapper relative h-52 overflow-hidden">
              <div class="absolute inset-0 flex items-center justify-center card-bg-violet">
                <svg class="h-24 w-24 text-white opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <span class="badge badge-violet">
                <font-awesome-icon :icon="['fas', 'user-shield']" class="mr-1" />
                Anonymous
              </span>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold font-family text-[#0f2444]">Safe &amp; Anonymous</h3>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Submit Complaint without revealing your identity when needed. Users Privacies matter and so the design ensures your safety is always protected.
              </p>
             <!-- <RouterLink to="/submit-complaint" class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f97316] transition hover:gap-3">
                Submit Anonymously
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </RouterLink>-->
            </div>
          </article>

        </div>
      </div>
    </section>

   <!-- ─── TESTIMONIALS ──────────────────────────────────────── -->
<section class="testi-section">
  <div class="mx-auto max-w-5xl px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
    <div class="mb-14 text-center">
      <p class="section-kicker">Testimonials</p>
      <h2 class="section-title">What Users Say</h2>
    </div>

    <!-- Loading -->
    <div v-if="loadingTestimonials" class="flex justify-center py-10">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="testimonials.length === 0" class="py-10 text-center">
      <p class="text-sm text-slate-400">No testimonials yet.</p>
      <p class="mt-1 text-xs text-slate-300">Log in and share your experience to be the first!</p>
    </div>

    <!-- Cards -->
    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="(item, index) in testimonials" :key="item.id" class="testimonial-card">
        <div class="stars">
          <span
            v-for="n in 5"
            :key="n"
            :style="{ color: n <= item.rating ? '#f59e0b' : '#e2e8f0' }"
          >★</span>
        </div>
        <p class="mt-4 text-sm leading-7 text-slate-600 italic">"{{ item.message }}"</p>
        <div class="mt-6 flex items-center gap-3">
          <div class="avatar" :style="{ background: avatarColor(index) }">
            {{ item.display_name ? item.display_name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div>
            <p class="text-sm font-bold text-[#0f2444]">{{ item.display_name || 'Anonymous' }}</p>
            <p class="text-xs text-slate-400">{{ item.role_label || 'System User' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

    <!-- ─── FOOTER (full-width, replaces AppFooter) ─── -->
   <AppFooter /> 
  </div>
</template>

<style scoped>
/* ── Hero ──────────────────────────────────── */
.hero-section {
  min-height: 600px;
  background-image: url('https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1600&q=80');
  background-size: cover;
  background-position: center top;
}
.hero-overlay {
  background: linear-gradient(135deg, rgba(10,28,64,0.88) 0%, rgba(15,52,100,0.82) 50%, rgba(30,60,110,0.75) 100%);
}
.hero-title {
  font-family: 'Times New Roman', Times, serif;
  letter-spacing: -0.02em;
}

/* ── Cards ─────────────────────────────────── */
.course-card { border: 1px solid rgba(15,36,68,0.07); }
.card-bg-blue   { background: linear-gradient(135deg, #0f2444, #1a4a8a); }
.card-bg-green  { background: linear-gradient(135deg, #0f2444, #1a4a8a); }
.card-bg-violet { background: linear-gradient(135deg, #0f2444, #1a4a8a); }
.badge {
  position: absolute; bottom: 1rem; right: 1rem;
  border-radius: 9999px; padding: 0.25rem 0.75rem;
  font-size: 0.75rem; font-weight: 700; color: white;
  box-shadow: 0 2px 8px hsl(0, 13%, 96%);
}
.font-family{
  font-family: 'Times New Roman', Times, serif;
}
.badge-orange  { background: #f97316; }
.badge-emerald { background: #f97316; }
.badge-violet  { background: #f97316; }

/* ── Testimonials ──────────────────────────── */
.testi-section { width: 100%; background: #ffffff; }
.section-kicker {
  display: block; font-size: 0.85rem; font-weight: 700;
  font-family: 'Times New Roman', Times, serif;
  letter-spacing: 0.22em; text-transform: uppercase; color: #f97316;
}
.section-title {
  margin-top: 0.5rem;
  font-family: 'Times New Roman', Times, serif;
  font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 900;
  color: #0f2444; line-height: 1.1;
}
.testimonial-card {
  background: white;
  border: 1px solid rgba(15,36,68,0.07);
  border-radius: 1.25rem; padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(15,36,68,0.05);
  transition: all 0.25s;
}
.testimonial-card:hover { transform: translateY(-3px); box-shadow: 0 14px 40px rgba(15,36,68,0.1); }
.stars { font-size: 0.9rem; letter-spacing: 0.1em; color: #f59e0b; }
.avatar {
  display: flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; border-radius: 9999px;
  font-size: 0.85rem; font-weight: 700; color: white; flex-shrink: 0;
}
.av-orange  { background: #f97316; }
.av-emerald { background: #059669; }
.av-violet  { background: #7c3aed; }

/* ── Footer ────────────────────────────────── */
</style>
