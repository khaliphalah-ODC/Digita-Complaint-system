<script setup>
import { RouterLink } from 'vue-router';
import AuthTopNav from '../components/AuthTopNav.vue';

const servicePillars = [
  {
    title: 'Complaint Intake',
    description: 'Structured submission flows help people report issues clearly, route them faster, and keep essential context attached from the first step.',
    icon: ['fas', 'file-lines']
  },
  {
    title: 'Case Visibility',
    description: 'Every complaint moves through a visible timeline so users and administrators can see progress, ownership, and current status without confusion.',
    icon: ['fas', 'eye']
  },
  {
    title: 'Response Coordination',
    description: 'Departments, organization admins, and platform administrators can work inside role-based spaces built to reduce delays and improve accountability.',
    icon: ['fas', 'sitemap']
  }
];

const serviceMoments = [
  'Role-based dashboards for users, organization admins, and platform admins',
  'Clear complaint routing to the right organization and department',
  'Status updates and response visibility across the full complaint lifecycle',
  'Analytics and oversight tools for stronger service quality decisions'
];

const serviceAudience = [
  {
    title: 'Public Users',
    description: 'Submit issues confidently, understand what happens next, and stay informed through a cleaner complaint experience.'
  },
  {
    title: 'Organizations',
    description: 'Receive better-structured cases, coordinate responses faster, and keep service delivery more transparent to the people you serve.'
  },
  {
    title: 'Platform Oversight',
    description: 'Monitor trends, improve policy decisions, and support accountability across multiple organizations from one central system.'
  }
];
</script>

<template>
  <div class="services-page flex min-h-screen w-full flex-col">
    <AuthTopNav fixed />

    <section class="services-hero relative overflow-hidden pt-24 sm:pt-28 lg:pt-32">
      <div class="services-hero__grid absolute inset-0"></div>
      <div class="services-hero__glow services-hero__glow-left absolute left-0 top-16 h-64 w-64 rounded-full"></div>
      <div class="services-hero__glow services-hero__glow-right absolute right-0 top-20 h-72 w-72 rounded-full"></div>

      <div class="relative z-10 mx-auto grid max-w-6xl gap-6 px-6 pb-10 pt-6 sm:px-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:px-16 lg:pb-12">
        <div class="max-w-4xl">
          <p class="services-kicker">Services</p>
          <h1 class="services-title mt-4">Digital complaint services built for faster response and stronger accountability.</h1>
          <p class="services-intro mt-4 max-w-3xl text-base leading-7 text-blue-100/82 sm:text-lg">
            SpeakUp helps institutions receive, manage, and resolve complaints with clearer workflows, visible progress, and better user communication.
          </p>

          <div class="mt-5 flex flex-wrap gap-3">
            <RouterLink to="/signup" class="services-btn services-btn-primary">
              Get Started
            </RouterLink>
            <RouterLink to="/contact" class="services-btn services-btn-secondary">
              Talk to Us
            </RouterLink>
          </div>
        </div>

        <div class="services-hero-card w-full max-w-lg justify-self-end">
          <p class="services-card-label">What this includes</p>
          <ul class="mt-4 space-y-3">
            <li v-for="item in serviceMoments" :key="item" class="services-check-row">
              <span class="services-check-dot"></span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <main class="flex-1 bg-[linear-gradient(180deg,#f8fafc_0%,#f4f6fb_100%)] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
      <div class="mx-auto flex max-w-6xl flex-col gap-14">
        <section>
          <div class="max-w-3xl">
            <p class="services-section-kicker">Core Services</p>
            <h2 class="services-section-title mt-3">A service experience designed for real complaint workflows.</h2>
            <p class="services-section-copy mt-4">
              The platform is shaped around the moments that matter most: collecting clear information, keeping progress visible, and helping teams respond with confidence.
            </p>
          </div>

          <div class="mt-8 grid gap-6 lg:grid-cols-3">
            <article v-for="item in servicePillars" :key="item.title" class="services-panel">
              <div class="services-panel-icon">
                <font-awesome-icon :icon="item.icon" />
              </div>
              <h3 class="services-panel-title mt-5">{{ item.title }}</h3>
              <p class="services-panel-copy mt-3">{{ item.description }}</p>
            </article>
          </div>
        </section>

        <section class="services-flow grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="services-flow-panel">
            <p class="services-section-kicker">Service Flow</p>
            <h2 class="services-section-title mt-3">How the experience stays clear from submission to resolution.</h2>

            <div class="mt-8 space-y-5">
              <div class="services-step">
                <span class="services-step-index">01</span>
                <div>
                  <h3 class="services-step-title">Capture the issue clearly</h3>
                  <p class="services-step-copy">Users submit complaints with enough structure to reduce back-and-forth and improve routing accuracy.</p>
                </div>
              </div>

              <div class="services-step">
                <span class="services-step-index">02</span>
                <div>
                  <h3 class="services-step-title">Route the case intentionally</h3>
                  <p class="services-step-copy">Organizations and departments receive the right cases faster, with the right level of visibility.</p>
                </div>
              </div>

              <div class="services-step">
                <span class="services-step-index">03</span>
                <div>
                  <h3 class="services-step-title">Keep progress visible</h3>
                  <p class="services-step-copy">Status updates, response checkpoints, and case history help people trust the system while work continues.</p>
                </div>
              </div>
            </div>
          </div>

          <aside class="services-stats-panel">
            <p class="services-card-label">Designed For</p>
            <div class="mt-5 space-y-4">
              <article v-for="item in serviceAudience" :key="item.title" class="services-audience-card">
                <h3 class="services-audience-title">{{ item.title }}</h3>
                <p class="services-audience-copy mt-2">{{ item.description }}</p>
              </article>
            </div>
          </aside>
        </section>

        <section class="services-cta">
          <div>
            <p class="services-section-kicker services-section-kicker-light">Need a clearer service experience?</p>
            <h2 class="services-cta-title mt-3">Bring complaint handling into one visible, coordinated workflow.</h2>
          </div>
          <div class="flex flex-wrap gap-3">
            <RouterLink to="/signup" class="services-btn services-btn-light">
              Create Account
            </RouterLink>
            <RouterLink to="/contact" class="services-btn services-btn-outline-light">
              Contact Team
            </RouterLink>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.services-page {
  font-family: 'Times New Roman', Times, serif;
}

.services-hero {
  background:
    linear-gradient(135deg, rgba(8, 24, 52, 0.97) 0%, rgba(12, 40, 77, 0.94) 45%, rgba(18, 56, 95, 0.9) 100%);
}

.services-hero__grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 42px 42px;
  opacity: 0.32;
}

.services-hero__glow {
  filter: blur(46px);
  opacity: 0.42;
}

.services-hero__glow-left {
  background: rgba(61, 142, 255, 0.28);
}

.services-hero__glow-right {
  background: rgba(249, 115, 22, 0.18);
}

.services-kicker,
.services-section-kicker {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f97316;
}

.services-section-kicker-light {
  color: rgba(255, 255, 255, 0.75);
}

.services-title {
  max-width: 18ch;
  font-size: clamp(2rem, 3.5vw, 3.2rem);
  line-height: 0.92;
  font-weight: 900;
  letter-spacing: -0.045em;
  color: white;
}

.services-intro {
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
}

.services-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  border-radius: 999px;
  padding: 0.85rem 1.35rem;
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  font-size: 0.92rem;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.22s ease, background-color 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.services-btn:hover {
  transform: translateY(-1px);
}

.services-btn-primary,
.services-btn-light {
  background: #f97316;
  color: white;
  box-shadow: 0 14px 28px rgba(249, 115, 22, 0.24);
}

.services-btn-primary:hover,
.services-btn-light:hover {
  background: #ea6c0c;
}

.services-btn-secondary {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.services-btn-secondary:hover,
.services-btn-outline-light:hover {
  background: rgba(255, 255, 255, 0.14);
}

.services-btn-outline-light {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.services-hero-card,
.services-stats-panel,
.services-flow-panel,
.services-panel {
  border: 1px solid rgba(17, 28, 48, 0.08);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 34px rgba(12, 32, 61, 0.08);
  backdrop-filter: blur(12px);
}

.services-hero-card {
  border-color: rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.08));
  color: white;
  border-radius: 1.6rem;
  padding: 1.3rem;
  box-shadow: 0 18px 34px rgba(4, 15, 31, 0.22);
}

.services-card-label {
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.services-check-row {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  color: rgba(245, 248, 255, 0.94);
  line-height: 1.5;
}

.services-check-dot {
  width: 0.7rem;
  height: 0.7rem;
  margin-top: 0.35rem;
  border-radius: 999px;
  background: #f97316;
  box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.16);
  flex-shrink: 0;
}

.services-section-title,
.services-cta-title {
  font-size: clamp(1.9rem, 3vw, 3rem);
  line-height: 1.04;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #102947;
}

.services-section-copy,
.services-panel-copy,
.services-step-copy,
.services-audience-copy {
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  color: #627187;
  line-height: 1.72;
}

.services-panel,
.services-flow-panel,
.services-stats-panel {
  border-radius: 1.45rem;
  padding: 1.55rem;
}

.services-panel-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(24, 58, 99, 0.12), rgba(249, 115, 22, 0.14));
  color: #183a63;
  font-size: 1rem;
}

.services-panel-title,
.services-step-title,
.services-audience-title {
  font-size: 1.08rem;
  font-weight: 800;
  color: #102947;
}

.services-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: start;
}

.services-step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  background: #183a63;
  color: white;
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.services-audience-card {
  border-radius: 1.2rem;
  border: 1px solid rgba(17, 28, 48, 0.08);
  background: white;
  padding: 1.15rem;
}

.services-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  border-radius: 1.6rem;
  padding: 1.8rem;
  background: linear-gradient(135deg, #0f2444 0%, #183a63 100%);
  box-shadow: 0 18px 40px rgba(12, 32, 61, 0.14);
}

.services-cta-title {
  max-width: 15ch;
  color: white;
}

@media (max-width: 767px) {
  .services-hero {
    overflow-x: clip;
  }

  .services-hero-card,
  .services-panel,
  .services-flow-panel,
  .services-stats-panel,
  .services-cta {
    border-radius: 1.2rem;
    padding: 1.1rem;
    box-shadow: 0 10px 22px rgba(12, 32, 61, 0.08);
  }

  .services-title {
    max-width: 100%;
  }

  .services-btn {
    width: 100%;
  }

  .services-cta {
    align-items: stretch;
  }
}

@media (max-width: 640px) {
  .services-title {
    font-size: clamp(1.95rem, 10vw, 2.5rem);
    line-height: 1.02;
  }

  .services-section-title,
  .services-cta-title {
    font-size: clamp(1.7rem, 9vw, 2.2rem);
    line-height: 1.08;
  }

  .services-btn {
    min-height: 3.05rem;
    padding-inline: 1rem;
  }

  .services-check-row,
  .services-section-copy,
  .services-panel-copy,
  .services-step-copy,
  .services-audience-copy {
    font-size: 0.95rem;
  }
}
</style>
