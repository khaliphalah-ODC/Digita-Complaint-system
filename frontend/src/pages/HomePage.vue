<script setup>
import { RouterLink } from 'vue-router';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import AuthTopNav from '../components/AuthTopNav.vue';
import AppFooter from '../components/AppFooter.vue';
import TestimonialsSection from '../components/TestimonialsSection.vue';
import heroImage1 from '../asset/heroImage/image1.avif';
import heroImage2 from '../asset/heroImage/Gemini_Generated_Image_96bcsk96bcsk96bc.png';
import heroImage3 from '../asset/heroImage/image3.png';
import heroImage4 from '../asset/heroImage/image4.png';

const heroModules = [Autoplay, EffectFade, Pagination];
const heroSlides = [heroImage1, heroImage2, heroImage3, heroImage4];
const benefitCards = [
  {
    title: 'Submit complaints easily',
    description: 'Use a guided form to report issues and send them to the right organization.',
    icon: ['fas', 'file-lines'],
  },
  {
    title: 'Track progress clearly',
    description: 'Follow status updates, timelines, and responses without confusion.',
    icon: ['fas', 'chart-line'],
  },
  {
    title: 'Stay protected',
    description: 'Choose anonymous options when needed and report with more confidence.',
    icon: ['fas', 'user-shield'],
  },
];
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col font-sans">
    <AuthTopNav fixed />

    <section class="hero-section relative flex items-center justify-center overflow-hidden pt-20">
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
          <img
            :src="slide"
            alt=""
            class="hero-image-layer"
          />
        </SwiperSlide>
      </Swiper>

      <div class="hero-overlay absolute inset-0 z-10"></div>
      <div class="hero-glow hero-glow-left absolute inset-y-0 left-0 z-10 w-[48%]"></div>
      <div class="hero-glow hero-glow-center absolute inset-x-0 top-[12%] z-10 mx-auto h-72 w-72"></div>

      <div class="hero-content-shell app-shell-gutter absolute inset-0 z-20 flex items-center justify-center pt-16">
        <div class="hero-content-group flex w-full max-w-3xl flex-col items-center justify-center text-center">
          <p class="hero-kicker">Trusted complaint reporting and tracking</p>
          <h1 class="hero-title text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-8xl">
            Submit Your
            <span class="block text-[#f97316]">Complaints.</span>
          </h1>

          <p class="hero-subtitle mx-auto mt-7 max-w-2xl text-base leading-7 text-blue-100/80 sm:text-lg">
            Report issues, send them to the right organization, and track every step of the response in one clear place.
          </p>

          <div class="hero-actions mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <RouterLink to="/submit-complaint" class="hero-btn hero-btn-primary">
              Submit a Complaint
            </RouterLink>
            <RouterLink to="/track-complaint" class="hero-btn hero-btn-secondary">
              Track a Complaint
            </RouterLink>
          </div>

          <div class="hero-trust mt-9 flex flex-wrap items-center justify-center gap-4 text-sm text-blue-100/80">
            <span class="hero-trust-pill">Direct routing</span>
            <span class="hero-trust-pill">Status tracking</span>
            <span class="hero-trust-pill">Anonymous options</span>
          </div>
        </div>
      </div>
    </section>

    <section class="benefits-section app-shell-gutter py-16 lg:py-20">
      <div class="app-container">
        <div class="mx-auto max-w-3xl text-center">
          <p class="section-kicker">How It Works</p>
          <h2 class="section-title">A clearer way to report and follow up on issues</h2>
          <p class="section-intro">
            The platform is designed to make complaint reporting easier to start, easier to understand, and easier to trust.
          </p>
        </div>

        <div class="mt-10 grid gap-6 md:grid-cols-3">
          <article
            v-for="card in benefitCards"
            :key="card.title"
            class="benefit-card"
          >
            <div class="benefit-icon">
              <font-awesome-icon :icon="card.icon" />
            </div>
            <h3 class="benefit-title">{{ card.title }}</h3>
            <p class="benefit-description">{{ card.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <TestimonialsSection />

    <AppFooter />
  </div>
</template>

<style scoped>
.hero-section {
  height: 82vh;
  min-height: 560px;
  max-height: 700px;
  background: #0f2444;
}

.hero-content-shell {
  min-height: 100%;
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
    linear-gradient(135deg, rgba(9, 26, 61, 0.54) 0%, rgba(17, 47, 94, 0.4) 42%, rgba(28, 63, 115, 0.28) 100%),
    linear-gradient(180deg, rgba(8, 23, 53, 0.12) 0%, rgba(8, 23, 53, 0.2) 100%);
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
  font-family: 'Times New Roman', Times, serif;
  letter-spacing: -0.02em;
  color: rgba(250, 252, 255, 0.98);
  text-shadow: 0 16px 42px rgba(7, 18, 45, 0.28);
}

.hero-subtitle {
  text-wrap: balance;
  color: rgba(240, 245, 252, 0.88);
  max-width: 38rem;
}

.hero-btn {
  display: inline-flex;
  min-height: 50px;
  min-width: 198px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0 1.3rem;
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

.hero-btn-secondary {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  backdrop-filter: blur(10px);
}

.hero-btn-secondary:hover {
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

.benefits-section {
  background: #f6f4ef;
}

.section-kicker {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Times New Roman', Times, serif;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #f97316;
}

.section-title {
  margin-top: 0.5rem;
  font-family: 'Times New Roman', Times, serif;
  font-size: clamp(2rem, 4vw, 2.75rem);
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

.benefit-card {
  border: 1px solid rgba(15, 36, 68, 0.08);
  border-radius: 1.1rem;
  background: #fff;
  padding: 1.75rem;
  box-shadow: 0 8px 28px rgba(15, 36, 68, 0.05);
}

.benefit-icon {
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

.benefit-title {
  margin-top: 1.1rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f2444;
}

.benefit-description {
  margin-top: 0.65rem;
  color: #5f6f86;
  line-height: 1.7;
  font-size: 0.97rem;
}

@media (max-width: 768px) {
  .hero-section {
    height: 80vh;
    min-height: 540px;
    max-height: 640px;
  }

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
}
</style>
