<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, EffectCards, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import AuthTopNav from '../components/AuthTopNav.vue';
import RoleValueSlideCard from '../components/PerksSlideCard.vue';
import TestimonialsSection from '../components/TestimonialsSection.vue';
import heroImage1 from '../asset/heroImage/image1.avif';
import heroImage2 from '../asset/heroImage/image2.jpg';
import heroImage3 from '../asset/heroImage/image3.jpeg';
import heroImage4 from '../asset/heroImage/image4.jpeg';
import heroImage5 from '../asset/heroImage/image5.jpeg';
import onboardingQrImage from '../asset/qrcode/onboarding-signup.svg';

const heroModules = [Autoplay, EffectFade, Pagination];
const roleValueModules = [Autoplay, EffectCards, Pagination];
const heroSlides = [heroImage1, heroImage2, heroImage3, heroImage4, heroImage5];

const proofStats = [
  { value: '3 Roles', label: 'User, org admin, and super admin workspaces' },
  { value: 'End-to-End', label: 'From intake to escalation, resolution, and feedback' },
  { value: 'Multi-Org', label: 'Organization-aware routing and scoped administration' }
];

const featureCards = [
  {
    title: 'Structured complaint intake',
    description: 'Capture complaints through guided forms, anonymous options, and organization-linked submission paths for internal workflows.',
    icon: ['fas', 'file-lines']
  },
  {
    title: 'Real-time tracking visibility',
    description: 'Give complainants a tracking code, clearer status updates, timelines, and easier follow-up without chasing emails or office visits.',
    icon: ['fas', 'magnifying-glass-chart']
  },
  {
    title: 'Admin workflow control',
    description: 'Help teams review complaints, manage departments, assign routing, create assessments, and escalate issues with accountability.',
    icon: ['fas', 'sitemap']
  },
  {
    title: 'Public feedback and QR access',
    description: 'Support feedback forms, organization-specific links, and QR-powered access where external feedback collection is needed.',
    icon: ['fas', 'qrcode']
  },
  {
    title: 'Notifications and response history',
    description: 'Keep users informed through notifications, message threads, and status history so progress stays visible and auditable.',
    icon: ['fas', 'bell']
  },
  {
    title: 'Platform oversight',
    description: 'Equip super admins with organization management, reporting, triage, settings, and audit visibility across the platform.',
    icon: ['fas', 'chart-line']
  }
];

const workflowSteps = [
  {
    title: 'Submit',
    description: 'Users file a complaint with the right organization, department, and context.'
  },
  {
    title: 'Track',
    description: 'The system issues a tracking code so the complaint can be followed with less uncertainty.'
  },
  {
    title: 'Review',
    description: 'Organization admins review, route, assess, and escalate issues based on severity and ownership.'
  },
  {
    title: 'Resolve',
    description: 'Responses, status updates, and closeout actions are recorded so users can see what happened next.'
  }
];

const onboardingHighlights = [
  'Invite organization members with a generated join code',
  'Share QR-backed onboarding links for faster access on mobile',
  'Support public feedback access through organization-specific QR links'
];

const roleValueSlides = [
  {
    title: 'For Complainants',
    image: heroImage5,
    bullets: [
      'Submit complaints through a guided digital form instead of fragmented channels.',
      'Receive a tracking code immediately so you can follow progress with less uncertainty.',
      'See status updates, responses, and history without repeated in-person follow-up.',
      'Stay informed through notifications as your complaint moves through review.',
      'Share feedback after resolution through the same platform experience.',
      'Use a clearer, more transparent process from intake to closeout.'
    ]
  },
  {
    title: 'For Organization Teams',
    image: heroImage2,
    bullets: [
      'Review complaints in one workspace instead of scattered inboxes and spreadsheets.',
      'Route cases to the right department and keep organization workflows structured.',
      'Create assessments, escalations, and status logs with accountability.',
      'Respond to complainants with clearer visibility into what has been reviewed.',
      'Manage users, notifications, settings, and public feedback from the same system.'
    ]
  },
  {
    title: 'For Platform Oversight',
    image: heroImage3,
    bullets: [
      'Support multiple organizations without mixing operational data across tenants.',
      'Monitor complaint handling, escalations, and organizational activity from one platform.',
      'Use reporting, audit visibility, and analytics to improve accountability.',
      'Standardize complaint workflows across departments and organizations.',
      'Deliver a more credible digital complaint process at system scale.'
    ]
  }
];

const activeRoleValueIndex = ref(1);
const viewportWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth);
const loopableRoleValueSlides = computed(() => (
  roleValueSlides.length >= 4 ? roleValueSlides : [...roleValueSlides, ...roleValueSlides]
));
const isCompactHero = computed(() => viewportWidth.value <= 1024);
const visibleHeroTrustPills = computed(() => (
  isCompactHero.value
    ? ['Complaint submission', 'Workflow visibility', 'Public feedback access']
    : ['Complaint submission', 'Workflow visibility', 'Role-based operations', 'Public feedback access']
));

const handleRoleValueSlideChange = (swiper) => {
  activeRoleValueIndex.value = swiper.realIndex % roleValueSlides.length;
};

const handleResize = () => {
  viewportWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="flex min-h-screen w-full flex-col font-sans">
    <AuthTopNav fixed />

    <section class="hero-section relative flex w-full max-w-full items-center justify-center overflow-hidden pt-20">
      <Swiper
        class="hero-swiper absolute inset-0 z-0"
        :modules="heroModules"
        :slides-per-view="1"
        :loop="true"
        effect="fade"
        :speed="600"
        :autoplay="{ delay: 4500, disableOnInteraction: false }"
        :pagination="{ clickable: true }"
      >
        <SwiperSlide
          v-for="(slide, index) in heroSlides"
          :key="index"
          class="hero-slide"
        >
          <img :src="slide" alt="" class="hero-image-layer">
        </SwiperSlide>
      </Swiper>

      <div class="hero-overlay absolute inset-0 z-10"></div>
      <div class="hero-glow hero-glow-left absolute inset-y-0 left-0 z-10 w-[48%]"></div>
      <div class="hero-glow hero-glow-center absolute inset-x-0 top-[12%] z-10 mx-auto h-72 w-72"></div>

      <div class="hero-content-shell app-shell-gutter absolute inset-0 z-20 flex items-center justify-center pt-16">
        <div class="hero-content-group flex w-full max-w-5xl flex-col items-center justify-center text-center">
          <p class="hero-kicker">{{ isCompactHero ? 'Digital complaint operations' : 'Digital complaint operations for modern institutions' }}</p>
          <h1 class="hero-title font-black text-white">
            Handle Complaints
            <span class="block text-[#f97316]">{{ isCompactHero ? 'The Right Way.' : 'Like a Real Platform.' }}</span>
          </h1>

          <p class="hero-subtitle mx-auto mt-7 max-w-3xl text-base leading-7 text-blue-100/80 sm:text-lg">
            {{ isCompactHero
              ? 'VoiceLink helps institutions receive complaints, track progress, and close the loop with more transparency.'
              : 'VoiceLink gives institutions a professional way to receive complaints, track progress, manage escalation, and close the loop with transparency.' }}
          </p>

          <div class="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <RouterLink to="/signup" class="hero-btn hero-btn-primary">Start With an Account</RouterLink>
            <RouterLink to="/track-complaint" class="hero-btn hero-btn-secondary">Track a Complaint</RouterLink>
          </div>

          <div class="hero-trust mt-9 flex flex-wrap items-center justify-center gap-4 text-sm text-blue-100/80">
            <span v-for="pill in visibleHeroTrustPills" :key="pill" class="hero-trust-pill">{{ pill }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="proof-section app-shell-gutter w-full max-w-full">
      <div class="app-container">
        <div class="proof-grid">
          <article v-for="item in proofStats" :key="item.label" class="proof-card">
            <p class="proof-value">{{ item.value }}</p>
            <p class="proof-label">{{ item.label }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="benefits-section app-shell-gutter w-full max-w-full py-16 lg:py-24">
      <div class="app-container">
        <div class="mx-auto max-w-3xl text-center">
          <p class="section-kicker">Platform Overview</p>
          <h2 class="section-title">Built like a modern service platform, not a simple form</h2>
          <p class="section-intro">
            The system is designed for real operational use. It supports intake, follow-up, team workflows, public feedback, and oversight across the full complaint lifecycle.
          </p>
        </div>

        <div class="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="card in featureCards"
            :key="card.title"
            class="feature-card"
          >
            <div class="feature-icon">
              <font-awesome-icon :icon="card.icon" />
            </div>
            <h3 class="feature-title">{{ card.title }}</h3>
            <p class="feature-description">{{ card.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="workflow-section app-shell-gutter w-full max-w-full py-16 lg:py-24">
      <div class="app-container">
        <div class="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <div>
            <p class="section-kicker">How It Works</p>
            <h2 class="section-title text-white">A clear complaint journey from intake to resolution</h2>
            <p class="section-intro workflow-intro">
              VoiceLink is structured around a simple operational flow that helps both complainants and organizations know what comes next.
            </p>

            <div class="onboarding-feature-card mt-8">
              <div class="onboarding-feature-media">
                <div class="onboarding-qr-visual">
                  <img :src="onboardingQrImage" alt="QR code for onboarding signup access" class="onboarding-feature-image">
                </div>
                <span class="onboarding-feature-badge">Live platform feature</span>
              </div>

              <div class="onboarding-feature-body">
                <p class="onboarding-panel__kicker">Onboarding Access</p>
                <h3 class="onboarding-panel__title">Join-code and QR onboarding built into the workflow</h3>
                <p class="onboarding-panel__copy">
                  Organizations can bring members in through a direct join code or a QR-backed invitation link, making account setup easier for teams, field staff, and invited members.
                </p>

                <div class="onboarding-feature-chips">
                  <span class="onboarding-feature-chip">Join Code</span>
                  <span class="onboarding-feature-chip">QR Invite</span>
                  <span class="onboarding-feature-chip">Public Feedback Access</span>
                </div>

                <ul class="onboarding-points mt-6">
                  <li v-for="point in onboardingHighlights" :key="point" class="onboarding-point">
                    <span class="onboarding-point__dot"></span>
                    <span>{{ point }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="space-y-5">
            <article
              v-for="(step, index) in workflowSteps"
              :key="step.title"
              class="workflow-card"
            >
              <div class="workflow-step">{{ index + 1 }}</div>
              <div>
                <h3 class="workflow-title">{{ step.title }}</h3>
                <p class="workflow-description">{{ step.description }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="role-value-section app-shell-gutter w-full max-w-full py-16 lg:py-24">
      <div class="app-container">
        <div class="mx-auto max-w-4xl text-center">
          <p class="section-kicker">Role-Based Value</p>
          <h2 class="role-value-section-title">How the system supports each part of the complaint process</h2>
        </div>

        <div class="role-value-carousel mt-12">
          <div
            class="role-value-card-stack"
            :class="{
              'is-first': activeRoleValueIndex === 0,
              'is-middle': activeRoleValueIndex === 1,
              'is-last': activeRoleValueIndex === roleValueSlides.length - 1
            }"
            aria-hidden="true"
          >
            <span></span>
            <span></span>
          </div>

          <Swiper
            class="role-value-swiper"
            :modules="roleValueModules"
            effect="cards"
            :grab-cursor="true"
            :initial-slide="1"
            :loop="loopableRoleValueSlides.length > 3"
            :speed="700"
            :autoplay="{ delay: 40000, disableOnInteraction: false, pauseOnMouseEnter: true }"
            :pagination="{ clickable: true }"
            :cards-effect="{
              perSlideOffset: 11,
              perSlideRotate: 0,
              rotate: false,
              slideShadows: false
            }"
            :breakpoints="{
              0: {
                cardsEffect: {
                  perSlideOffset: 9,
                  perSlideRotate: 0,
                  rotate: false,
                  slideShadows: false
                }
              },
              900: {
                cardsEffect: {
                  perSlideOffset: 13,
                  perSlideRotate: 0,
                  rotate: false,
                  slideShadows: false
                }
              }
            }"
            @slideChange="handleRoleValueSlideChange"
          >
            <SwiperSlide
              v-for="(slide, index) in loopableRoleValueSlides"
              :key="`${slide.title}-${index}`"
              class="role-value-swiper-slide"
            >
              <RoleValueSlideCard :slide="slide" />
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </section>

    <section class="cta-section app-shell-gutter w-full max-w-full py-16 lg:py-24">
      <div class="app-container">
        <div class="cta-panel">
          <div>
            <p class="section-kicker">Ready to Use</p>
            <h2 class="section-title">A stronger foundation for complaint handling</h2>
            <p class="section-intro">
              Move from scattered forms and manual follow-up to a system that looks credible, feels trustworthy, and supports real service delivery.
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <RouterLink to="/signup" class="hero-btn hero-btn-primary">Create Account</RouterLink>
            <RouterLink to="/about" class="hero-btn cta-btn-muted">Learn More</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <TestimonialsSection />
  </div>
</template>

<style scoped>
.hero-section {
  height: 82vh;
  min-height: 620px;
  max-height: 760px;
  background: #0f2444;
}

.hero-content-shell {
  min-height: 100%;
}

.hero-content-group {
  padding-inline: 0.4rem;
}

.hero-swiper,
.hero-slide {
  width: 100%;
  height: 100%;
}

:deep(.hero-swiper .swiper-wrapper) {
  height: 100%;
}

.hero-slide {
  position: relative;
  overflow: hidden;
}

.hero-image-layer {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
  transform: scale(1.01);
  filter: brightness(0.94) saturate(0.95);
  animation: heroZoom 14s ease-in-out infinite;
}

.hero-overlay {
  background:
    linear-gradient(135deg, rgba(9, 26, 61, 0.7) 0%, rgba(17, 47, 94, 0.52) 42%, rgba(28, 63, 115, 0.34) 100%),
    linear-gradient(180deg, rgba(8, 23, 53, 0.18) 0%, rgba(8, 23, 53, 0.26) 100%);
  pointer-events: none;
}

.hero-glow {
  pointer-events: none;
  filter: blur(32px);
}

.hero-glow-left {
  background:
    radial-gradient(circle at 30% 42%, rgba(255, 255, 255, 0.08) 0%, rgba(107, 167, 255, 0.05) 24%, rgba(13, 35, 70, 0) 68%);
}

.hero-glow-center {
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 42%, rgba(255, 255, 255, 0) 72%);
}

.hero-kicker {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(244, 248, 255, 0.82);
  text-shadow: 0 10px 28px rgba(8, 23, 53, 0.24);
}

.hero-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.65rem, 6vw, 5.8rem);
  line-height: 0.97;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: rgba(250, 252, 255, 0.98);
  text-shadow: 0 16px 42px rgba(7, 18, 45, 0.28);
  max-width: 100%;
  text-wrap: balance;
}

.hero-subtitle {
  text-wrap: balance;
  color: rgba(240, 245, 252, 0.88);
  max-width: 45rem;
}

.hero-btn {
  display: inline-flex;
  min-height: 52px;
  min-width: 198px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0 1.35rem;
  font-size: 0.97rem;
  font-weight: 700;
  transition: transform 0.22s ease, background-color 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.hero-btn:hover {
  transform: translateY(-2px);
}

.hero-btn-primary {
  background: #f97316;
  color: #fff;
  box-shadow: 0 14px 32px rgba(249, 115, 22, 0.24);
}

.hero-btn-primary:hover {
  background: #ea580c;
  box-shadow: 0 18px 36px rgba(249, 115, 22, 0.26);
}

.hero-btn-secondary,
.cta-btn-muted {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  backdrop-filter: blur(10px);
}

.hero-btn-secondary:hover,
.cta-btn-muted:hover {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 14px 28px rgba(7, 18, 45, 0.16);
}

.hero-trust-pill {
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(232, 239, 251, 0.74);
  padding: 0.45rem 0.85rem;
  backdrop-filter: blur(10px);
}

@media (max-width: 1024px) {
  .hero-section {
    height: auto;
    min-height: 100svh;
    max-height: none;
  }

  .hero-content-shell {
    padding-top: 5.25rem;
    padding-bottom: 2.5rem;
    padding-inline: 0.95rem;
  }

  .hero-content-group {
    max-width: 100%;
    padding-inline: 0;
  }

  .hero-kicker {
    font-size: 0.66rem;
    letter-spacing: 0.15em;
  }

  .hero-title {
    font-size: clamp(2rem, 8.8vw, 2.8rem);
    line-height: 1.04;
    letter-spacing: -0.03em;
  }

  .hero-subtitle {
    margin-top: 1.25rem;
    max-width: 100%;
    font-size: 0.98rem;
    line-height: 1.7;
  }

  .hero-btn {
    min-width: min(100%, 18rem);
    width: min(100%, 18rem);
    min-height: 3.15rem;
    font-size: 0.95rem;
  }

  .hero-trust {
    gap: 0.7rem;
  }

  .hero-trust-pill {
    max-width: 100%;
    padding: 0.42rem 0.72rem;
    font-size: 0.82rem;
    text-align: center;
  }

  .proof-section {
    margin-top: -2rem;
  }

  :deep(.hero-swiper .swiper-pagination) {
    bottom: 1rem;
  }
}

@media (max-width: 640px) {
  .hero-section {
    min-height: 100svh;
  }

  .hero-content-shell {
    padding-top: 4.8rem;
    padding-bottom: 2rem;
    padding-inline: 0.72rem;
  }

  .hero-kicker {
    max-width: 17rem;
    font-size: 0.6rem;
    line-height: 1.5;
    letter-spacing: 0.13em;
  }

  .hero-title {
    font-size: clamp(1.8rem, 8vw, 2.35rem);
    line-height: 1.06;
  }

  .hero-subtitle {
    max-width: 100%;
    font-size: 0.92rem;
    line-height: 1.62;
    text-wrap: pretty;
  }

  .hero-btn {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .hero-trust {
    width: 100%;
    justify-content: center;
    gap: 0.5rem;
  }

  .hero-trust-pill {
    max-width: 100%;
    font-size: 0.76rem;
    line-height: 1.35;
    padding-inline: 0.66rem;
  }

  .proof-section {
    margin-top: -1.4rem;
  }

  .proof-card,
  .feature-card,
  .workflow-card,
  .onboarding-feature-card,
  .cta-panel {
    border-radius: 1.1rem;
  }

  .feature-card,
  .workflow-card,
  .cta-panel {
    padding: 1.2rem;
  }

  .section-title,
  .role-value-section-title {
    font-size: clamp(1.75rem, 8.5vw, 2.3rem);
    line-height: 1.06;
  }
}

:deep(.hero-swiper .swiper-pagination) {
  bottom: 1.75rem;
}

:deep(.hero-swiper .swiper-pagination-bullet) {
  width: 0.58rem;
  height: 0.58rem;
  background: rgba(255, 255, 255, 0.35);
  opacity: 1;
}

:deep(.hero-swiper .swiper-pagination-bullet-active) {
  background: #f97316;
}

.proof-section {
  position: relative;
  z-index: 10;
  margin-top: -3.5rem;
}

.proof-grid {
  display: grid;
  gap: 1rem;
}

.proof-card {
  border-radius: 1.3rem;
  border: 1px solid rgba(15, 36, 68, 0.08);
  background: rgba(255, 255, 255, 0.9);
  padding: 1.4rem 1.2rem;
  box-shadow: 0 18px 42px rgba(15, 36, 68, 0.08);
  backdrop-filter: blur(18px);
}

.proof-value {
  font-size: 1.2rem;
  font-weight: 900;
  color: #0f2444;
}

.proof-label {
  margin-top: 0.35rem;
  font-size: 0.93rem;
  line-height: 1.6;
  color: #5f6f86;
}

.benefits-section {
  background: #f6f4ef;
}

.section-kicker {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: Georgia, 'Times New Roman', serif;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #f97316;
}

.section-title {
  margin-top: 0.5rem;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 4vw, 2.95rem);
  font-weight: 900;
  color: #0f2444;
  line-height: 1.08;
  text-wrap: balance;
}

.section-intro {
  margin-top: 1rem;
  color: #5f6f86;
  font-size: 1rem;
  line-height: 1.75;
}

.feature-card {
  border: 1px solid rgba(15, 36, 68, 0.08);
  border-radius: 1.25rem;
  background: #fff;
  padding: 1.8rem;
  box-shadow: 0 8px 28px rgba(15, 36, 68, 0.05);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(15, 36, 68, 0.1);
}

.feature-icon {
  display: inline-flex;
  height: 3rem;
  width: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.9rem;
  background: rgba(15, 36, 68, 0.08);
  color: #0f2444;
  font-size: 1rem;
}

.feature-title {
  margin-top: 1rem;
  font-size: 1.12rem;
  font-weight: 800;
  color: #0f2444;
}

.feature-description {
  margin-top: 0.6rem;
  color: #5f6f86;
  line-height: 1.75;
  font-size: 0.96rem;
}

.workflow-section {
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.14), transparent 28%),
    linear-gradient(180deg, #102442 0%, #132b4f 100%);
}

.workflow-intro,
.workflow-section .section-title {
  color: white;
}

.workflow-intro {
  color: rgba(218, 231, 250, 0.82);
}

.onboarding-feature-card {
  display: grid;
  gap: 1.6rem;
  border: 1px solid rgba(184, 207, 240, 0.12);
  border-radius: 1.4rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1.35rem;
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 44px rgba(8, 21, 42, 0.18);
}

.onboarding-feature-media {
  position: relative;
  border-radius: 1.1rem;
  overflow: hidden;
  min-height: 220px;
  border: 1px solid rgba(184, 207, 240, 0.14);
  background: rgba(12, 32, 61, 0.35);
}

.onboarding-qr-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 1.4rem;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.18), transparent 48%),
    linear-gradient(180deg, rgba(13, 31, 59, 0.98), rgba(11, 27, 49, 0.92));
}

.onboarding-feature-image {
  width: min(100%, 15rem);
  aspect-ratio: 1;
  border-radius: 1.2rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 252, 0.96));
  box-shadow:
    0 18px 34px rgba(6, 18, 37, 0.22),
    inset 0 0 0 1px rgba(15, 36, 68, 0.07);
  object-fit: contain;
  padding: 0.9rem;
}

.onboarding-feature-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(10, 20, 38, 0.72);
  padding: 0.4rem 0.8rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(234, 242, 255, 0.9);
}

.onboarding-panel__kicker {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(207, 227, 255, 0.72);
}

.onboarding-panel__title {
  margin-top: 0.35rem;
  font-size: 1.18rem;
  font-weight: 800;
  line-height: 1.35;
  color: #fff;
}

.onboarding-feature-body {
  display: flex;
  flex-direction: column;
}

.onboarding-feature-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.2rem;
}

.onboarding-feature-chip {
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  padding: 0.45rem 0.85rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(234, 242, 255, 0.84);
}

.onboarding-panel__copy {
  margin-top: 1rem;
  color: rgba(218, 231, 250, 0.82);
  line-height: 1.75;
}

.onboarding-points {
  display: grid;
  gap: 0.8rem;
}

.onboarding-point {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: rgba(234, 242, 255, 0.82);
  line-height: 1.6;
}

.onboarding-point__dot {
  margin-top: 0.45rem;
  height: 0.48rem;
  width: 0.48rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: linear-gradient(135deg, #f97316, #fb923c);
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.14);
}

.workflow-card {
  display: flex;
  gap: 1rem;
  border: 1px solid rgba(184, 207, 240, 0.12);
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.06);
  padding: 1.2rem;
  backdrop-filter: blur(12px);
}

.workflow-step {
  display: flex;
  height: 2.6rem;
  width: 2.6rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: linear-gradient(135deg, #f97316, #fb923c);
  color: white;
  font-weight: 800;
  box-shadow: 0 14px 26px rgba(249, 115, 22, 0.24);
}

.workflow-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: white;
}

.workflow-description {
  margin-top: 0.35rem;
  color: rgba(218, 231, 250, 0.8);
  line-height: 1.7;
}

.role-value-section {
  background: #fff;
}

.role-value-section-title {
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #1a1a1a;
  line-height: 0.95;
}

.role-value-carousel {
  position: relative;
  max-width: 1140px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 4.5rem;
}

.role-value-swiper {
  position: relative;
  overflow: visible;
  isolation: isolate;
  perspective: 1600px;
}

.role-value-card-stack {
  position: absolute;
  inset: 0 0 4.5rem 0;
  pointer-events: none;
  z-index: 0;
}

.role-value-card-stack span {
  position: absolute;
  top: 1.35rem;
  bottom: 0;
  width: min(100% - 3.4rem, 22rem);
  border-radius: 1.5rem;
  background: #ebebeb;
  border: 1px solid rgba(15, 36, 68, 0.12);
  box-shadow: 0 10px 24px rgba(15, 36, 68, 0.06);
}

.role-value-card-stack.is-first span:first-child {
  right: 1.25rem;
  transform: translate(0.35rem, 1.1rem);
  opacity: 0.96;
}

.role-value-card-stack.is-first span:last-child {
  right: 0.1rem;
  transform: translate(0.85rem, 2.1rem);
  opacity: 0.9;
}

.role-value-card-stack.is-middle span:first-child {
  left: 0.15rem;
  transform: translate(-0.85rem, 2.1rem);
  opacity: 0.9;
}

.role-value-card-stack.is-middle span:last-child {
  right: 0.15rem;
  transform: translate(0.85rem, 2.1rem);
  opacity: 0.9;
}

.role-value-card-stack.is-last span:first-child {
  left: 1.25rem;
  transform: translate(-0.35rem, 1.1rem);
  opacity: 0.96;
}

.role-value-card-stack.is-last span:last-child {
  left: 0.1rem;
  transform: translate(-0.85rem, 2.1rem);
  opacity: 0.9;
}

.role-value-swiper-slide {
  width: min(100%, 22rem);
  padding: 0 0.2rem;
  display: flex;
  justify-content: center;
  transform-style: preserve-3d;
}

:deep(.role-value-swiper .swiper-wrapper) {
  align-items: stretch;
  overflow: visible;
}

:deep(.role-value-swiper .swiper-slide) {
  height: auto;
  overflow: visible;
}

:deep(.role-value-swiper .swiper-slide-shadow) {
  display: none;
}

:deep(.role-value-swiper .swiper-slide-prev),
:deep(.role-value-swiper .swiper-slide-next) {
  opacity: 0;
}

:deep(.role-value-swiper .swiper-slide-active) {
  z-index: 3;
}

:deep(.role-value-swiper .swiper-pagination) {
  bottom: 0;
}

:deep(.role-value-swiper .swiper-pagination-bullet) {
  width: 0.9rem;
  height: 0.9rem;
  background: #d0d5de;
  opacity: 1;
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.9);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

:deep(.role-value-swiper .swiper-pagination-bullet-active) {
  background: #1b3b6f;
  transform: scale(1.05);
}

.cta-section {
  background: #f6f4ef;
}

.cta-panel {
  display: grid;
  gap: 1.5rem;
  align-items: center;
  border-radius: 1.6rem;
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.1), transparent 28%),
    linear-gradient(180deg, #0f2444 0%, #17345f 100%);
  padding: 2rem;
  box-shadow: 0 20px 46px rgba(15, 36, 68, 0.12);
}

.cta-panel .section-title,
.cta-panel .section-intro {
  color: white;
}

.cta-panel .section-intro {
  color: rgba(222, 234, 248, 0.8);
}

@keyframes heroZoom {
  0% {
    transform: scale(1.01);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1.01);
  }
}

@media (min-width: 768px) {
  .proof-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .onboarding-feature-card {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .cta-panel {
    grid-template-columns: minmax(0, 1.3fr) auto;
    padding: 2.4rem 2.6rem;
  }
}

@media (max-width: 640px) {
  .role-value-carousel {
    max-width: 22rem;
    padding-bottom: 4rem;
  }

  .role-value-card-stack {
    inset: 0 0 4rem 0;
  }

  .role-value-card-stack span {
    top: 1.25rem;
  }
}

@media (max-width: 768px) {
  .hero-content-shell {
    min-height: 100%;
  }

  .hero-btn {
    width: 100%;
  }

  .hero-trust {
    gap: 0.55rem;
  }

  .hero-glow-left {
    width: 70%;
  }

  .proof-section {
    margin-top: -2.25rem;
  }

  .role-value-swiper {
    max-width: 100%;
  }
}

@media (min-width: 900px) {
  .role-value-card-stack span {
    width: min(100% - 4rem, 70rem);
  }

.role-value-card-stack.is-first span:first-child {
  right: 1.5rem;
  transform: translate(1.9rem, 1.65rem);
}

.role-value-card-stack.is-first span:last-child {
  right: 0.15rem;
  transform: translate(2.8rem, 2.55rem);
  opacity: 0.88;
}

.role-value-card-stack.is-middle span:first-child {
  left: 0.15rem;
  transform: translate(-2.8rem, 2.55rem);
  opacity: 0.88;
}

.role-value-card-stack.is-middle span:last-child {
  right: 0.15rem;
  transform: translate(2.8rem, 2.55rem);
  opacity: 0.88;
}

.role-value-card-stack.is-last span:first-child {
  left: 1.5rem;
  transform: translate(-1.9rem, 1.65rem);
}

.role-value-card-stack.is-last span:last-child {
  left: 0.15rem;
  transform: translate(-2.8rem, 2.55rem);
  opacity: 0.88;
}

  .role-value-swiper-slide {
    width: min(100%, 70rem);
    padding: 0 0.85rem;
  }
}
</style>
