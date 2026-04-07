<script setup>
import { RouterLink } from 'vue-router';
import AuthTopNav from '../components/AuthTopNav.vue';
import teamLeadImage from '../asset/teamImage/IMG-20260330-WA0018.jpg';
import teamSupportImage from '../asset/teamImage/image4.png';
import teamMemberTwoImage from '../asset/teamImage/team2.jpg';
import teamMemberThreeImage from '../asset/teamImage/team3.jpg';

const impactCards = [
  {
    title: 'For internal users',
    description: 'Give staff and organization members a clearer way to raise issues and follow what happens next.'
  },
  {
    title: 'For organizations',
    description: 'Help teams move beyond scattered inboxes and manual follow-up with structured routing, review, and response workflows.'
  },
  {
    title: 'For accountability',
    description: 'Create a more visible record of complaint intake, status changes, response timelines, and final resolution.'
  }
];

const valueCards = [
  {
    title: 'Transparency',
    description: 'Every complaint, status update, and response stays easier to see and understand. The process should not feel hidden.'
  },
  {
    title: 'Accountability',
    description: 'Organizations need a structured path for intake, review, escalation, and closure instead of informal handoffs.'
  },
  {
    title: 'Privacy',
    description: 'Anonymous reporting remains important for users who need to speak up without exposing their identity.'
  }
];

const capabilityPoints = [
  'Internal complaint submission and complaint tracking',
  'Organization-aware workflows, departments, and escalation',
  'User, organization-admin, and super-admin experiences',
  'Join-code and QR-assisted onboarding for organization access',
  'Public feedback forms and organization-specific public links',
  'Notifications, status history, and operational visibility'
];

const missionHighlights = [
  {
    label: 'Trackable',
    text: 'Users can follow complaints with clearer status visibility instead of waiting in silence.'
  },
  {
    label: 'Structured',
    text: 'Organizations get one connected flow for intake, review, escalation, and resolution.'
  },
  {
    label: 'Scalable',
    text: 'The platform supports public workflows, organization workflows, and multi-role administration.'
  }
];

const teamMembers = [
  {
    name: 'Yyeto',
    role: 'Team Lead / System Designer',
    image: teamLeadImage,
    bio: 'Responsible for the overall system structure and coordination of the project. Contributions included designing the system architecture and development approach, leading the setup of the development environment, and guiding the team throughout the implementation process while programming along the way.'
  },
  {
    name: 'Khaliphalah Bility',
    role: 'Backend Developer (Core)',
    image: teamSupportImage,
    bio: 'Responsible for backend development and core system functionality. Contributions included building server-side logic with Node.js, implementing password hashing with bcrypt, handling authentication, developing API routes and business logic, and managing database interactions.'
  },
  {
    name: 'Aboubacar T. Diallo',
    role: 'Product Lead / Frontend Support Developer',
    image: teamMemberThreeImage,
    bio: 'Responsible for guiding the overall product direction from a usability and business perspective. Contributions included keeping the system simple and user-friendly, removing unnecessary features for the MVP, refining components, pages, and routes, and contributing to the Super Admin dashboard and UI improvements.'
  },
  {
    name: 'Stanley',
    role: 'Security & Backend Support Developer',
    image: teamMemberTwoImage,
    bio: 'Responsible for strengthening system security and supporting backend tasks. Contributions included supporting authentication and backend features, contributing to dashboards and components, improving overall system features, and helping design endpoints and routes.'
  },
  {
    name: 'George',
    role: 'UI/UX Designer',
    image: teamLeadImage,
    bio: 'Responsible for the visual interface and overall user experience. Contributions included designing layouts and user interfaces, ensuring visual consistency across the application, supporting frontend implementation, and contributing to multiple features across the system.'
  },
  {
    name: 'Smith',
    role: 'Full-Stack Support Developer',
    image: teamMemberTwoImage,
    bio: 'Responsible for providing support across both frontend and backend development. Contributions included supporting component development, assisting with routing and integration, and contributing to various features across the system.'
  }
];
</script>

<template>
  <div class="page-root flex min-h-screen w-full flex-col">
    <AuthTopNav fixed />

    <section class="hero-section relative flex items-center justify-center overflow-hidden pt-20">
      <div class="hero-overlay absolute inset-0 z-10"></div>

      <div class="absolute inset-0 z-0">
        <svg class="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,160 L80,160 L80,80 L160,80 L160,160 L240,160 L240,40 L320,40 L320,160 L400,160 L400,100 L480,100 L480,160 L560,160 L560,60 L640,60 L640,160 L720,160 L720,120 L800,120 L800,160 L880,160 L880,50 L960,50 L960,160 L1040,160 L1040,90 L1120,90 L1120,160 L1200,160 L1200,70 L1280,70 L1280,160 L1360,160 L1360,110 L1440,110 L1440,320 L0,320 Z" fill="white"/>
        </svg>
      </div>

      <div class="relative z-20 mx-auto max-w-5xl px-6 py-20 text-center sm:py-28 lg:py-36">
        <p class="section-kicker-light">About VoiceLink</p>
        <h1 class="hero-title text-4xl font-black leading-[0.98] tracking-tight text-white sm:text-5xl lg:text-7xl xl:text-8xl">
          Built for
          <span class="block text-[#f97316]">Accountability.</span>
        </h1>

        <p class="mx-auto mt-6 max-w-3xl text-base leading-7 text-blue-100/80 sm:text-lg">
          VoiceLink exists to make complaint handling more transparent, more structured, and more trustworthy for organizations and the people working within them.
        </p>
      </div>
    </section>

    <section class="about-section-surface px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div class="mx-auto max-w-7xl">
        <div class="text-center">
          <p class="section-kicker">Our Mission</p>
          <h2 class="section-title mt-2">Every complaint deserves a real response.</h2>
          <p class="mx-auto mt-6 max-w-4xl text-base leading-8 text-slate-600">
            Too often, complaints disappear into inboxes, get passed around informally, or never receive a visible resolution. VoiceLink was created to improve that experience by giving people a clearer path to report issues and a better way to understand what happens after submission.
          </p>
          <p class="mx-auto mt-4 max-w-4xl text-base leading-8 text-slate-600">
            The goal is not only to collect complaints, but to help organizations respond in a more organized, accountable, and user-centered way. The platform connects complaint intake, tracking, review, escalation, and feedback into one operational flow.
          </p>
        </div>

        <div class="mission-panel mt-10">
          <p class="mission-panel__kicker">Why it matters</p>
          <h3 class="mission-panel__title">A complaint system should reduce uncertainty, not create more of it.</h3>
          <p class="mission-panel__copy">
            VoiceLink is designed to help users and institutions navigate complaint handling with more confidence. The process becomes easier to follow, easier to manage, and easier to trust.
          </p>

          <div class="mt-6 grid gap-4 md:grid-cols-3">
            <div
              v-for="item in impactCards"
              :key="item.title"
              class="mission-mini-card"
            >
              <p class="mission-mini-card__kicker">{{ item.title }}</p>
              <p class="mission-mini-card__text">{{ item.description }}</p>
            </div>
          </div>

          <div class="mission-highlight-grid mt-6">
            <article
              v-for="item in missionHighlights"
              :key="item.label"
              class="mission-highlight-card"
            >
              <p class="mission-highlight-label">{{ item.label }}</p>
              <p class="mission-highlight-text">{{ item.text }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-[#eef3fa] px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div class="mx-auto max-w-6xl">
        <div class="mb-14 text-center">
          <p class="section-kicker">What We Stand For</p>
          <h2 class="section-title mt-2">Principles behind the product</h2>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="value in valueCards"
            :key="value.title"
            class="value-card"
          >
            <h3 class="value-title">{{ value.title }}</h3>
            <p class="value-description">{{ value.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="about-section-muted px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div class="mx-auto max-w-6xl">
        <div class="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <p class="section-kicker">What VoiceLink Solves</p>
            <h2 class="section-title mt-2">A product structure designed for real workflows</h2>
            <p class="mt-6 text-base leading-8 text-slate-600">
              The platform is not limited to a single complaint form. It combines public entry points, structured internal workflows, organization-level controls, and platform-wide oversight in one system.
            </p>
          </div>

          <div class="capability-panel">
            <ul class="capability-list">
              <li
                v-for="point in capabilityPoints"
                :key="point"
                class="capability-item"
              >
                <span class="capability-dot"></span>
                <span>{{ point }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-[#f8fafc] px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div class="mx-auto max-w-7xl">
        <div class="mb-14 text-center">
          <p class="section-kicker">The Team</p>
          <h2 class="section-title mt-2">Built by a collaborative project team</h2>
          <p class="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
            This platform was developed as a team effort focused on civic technology, user experience, and practical complaint workflow design.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="member in teamMembers"
            :key="member.name"
            class="team-card team-card-member"
          >
            <div class="team-image-shell">
              <img
                :src="member.image"
                :alt="member.name"
                class="team-avatar-img"
              />
              <div class="team-image-overlay"></div>
              <p class="team-role-badge">{{ member.role }}</p>
            </div>
            <h3 class="mt-4 text-base font-bold text-[#0f2444]">{{ member.name }}</h3>
            <p class="mt-3 text-sm leading-7 text-slate-500">
              {{ member.bio }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="cta-section px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div class="mx-auto max-w-5xl">
        <div class="cta-panel">
          <div>
            <p class="section-kicker-light">Next Step</p>
            <h2 class="cta-title">Explore the platform in action.</h2>
            <p class="cta-copy">
              Submit a complaint, track a case, or create an account to see how VoiceLink turns complaint handling into a more transparent and structured experience.
            </p>
          </div>

          <div class="cta-actions">
            <RouterLink to="/signup" class="cta-btn cta-btn-primary">Create Account</RouterLink>
            <RouterLink to="/track-complaint" class="cta-btn cta-btn-secondary">Track Complaint</RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page-root {
  font-family: Georgia, 'Times New Roman', serif;
}

.hero-section {
  min-height: 540px;
  background-image: url('https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1600&q=80');
  background-size: cover;
  background-position: center top;
}

.hero-overlay {
  background: linear-gradient(135deg, rgba(10, 28, 64, 0.88) 0%, rgba(15, 52, 100, 0.82) 50%, rgba(30, 60, 110, 0.75) 100%);
}

.about-section-surface {
  background: linear-gradient(180deg, #f8fafd 0%, #f3f6fb 100%);
}

.about-section-muted {
  background: linear-gradient(180deg, #f4f7fb 0%, #edf2f8 100%);
}

.hero-title {
  font-family: Georgia, 'Times New Roman', serif;
  letter-spacing: -0.02em;
}

.section-kicker,
.section-kicker-light {
  display: block;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.section-kicker {
  color: #f97316;
}

.section-kicker-light {
  color: #fb923c;
}

.section-title,
.cta-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 900;
  line-height: 1.08;
  color: #0f2444;
}

.mission-panel,
.capability-panel,
.team-card {
  border-radius: 1.5rem;
  border: 1px solid rgba(15, 36, 68, 0.08);
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 10px 32px rgba(15, 36, 68, 0.06);
  backdrop-filter: blur(14px);
}

.mission-panel,
.capability-panel {
  padding: 1.6rem;
}

.mission-panel__kicker,
.mission-mini-card__kicker,
.team-summary-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #667a97;
}

.mission-panel__title,
.team-summary-title {
  margin-top: 0.5rem;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.35;
  color: #0f2444;
}

.mission-panel__copy {
  margin-top: 0.9rem;
  color: #5f6f86;
  line-height: 1.75;
}

.mission-highlight-grid {
  display: grid;
  gap: 1rem;
}

.mission-highlight-card {
  border-radius: 1.2rem;
  border: 1px solid rgba(15, 36, 68, 0.08);
  background: rgba(255, 255, 255, 0.64);
  padding: 1.15rem 1.2rem;
  box-shadow: 0 8px 24px rgba(15, 36, 68, 0.04);
}

.mission-highlight-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #667a97;
}

.mission-highlight-text {
  margin-top: 0.45rem;
  color: #314866;
  line-height: 1.65;
}

.mission-mini-card {
  border-radius: 1.2rem;
  border: 1px solid rgba(15, 36, 68, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 251, 255, 0.82) 100%);
  padding: 1.2rem;
}

.mission-mini-card__text {
  margin-top: 0.45rem;
  color: #233b60;
  line-height: 1.65;
}

.value-card {
  border: 1px solid rgba(15, 36, 68, 0.07);
  border-radius: 1.3rem;
  background: rgba(255, 255, 255, 0.84);
  padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(15, 36, 68, 0.05);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  backdrop-filter: blur(12px);
}

.value-card:hover,
.team-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(15, 36, 68, 0.1);
}

.value-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f2444;
}

.value-description {
  margin-top: 0.65rem;
  color: #5f6f86;
  line-height: 1.75;
}

.capability-list,
.team-summary-list {
  display: grid;
  gap: 0.9rem;
}

.capability-item {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  color: #2c4467;
  line-height: 1.7;
}

.capability-dot {
  margin-top: 0.45rem;
  height: 0.48rem;
  width: 0.48rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: linear-gradient(135deg, #f97316, #fb923c);
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
}

.team-card {
  padding: 0 0 2rem 0;
}

.team-card-featured,
.team-card-member {
  text-align: center;
}

.team-card-member {
  width: 100%;
  margin: 0;
  overflow: hidden;
  height: 100%;
}

.team-image-shell {
  position: relative;
  width: 100%;
  margin: 0;
}

.team-avatar-img {
  width: 100%;
  height: 18rem;
  border-radius: 1.5rem 1.5rem 0 0;
  object-fit: cover;
  object-position: center top;
  border: none;
  box-shadow: 0 12px 24px rgba(15, 36, 68, 0.14);
  display: block;
}

.team-image-overlay {
  position: absolute;
  inset: 0;
  border-radius: 1.5rem 1.5rem 0 0;
  background: linear-gradient(180deg, rgba(15, 36, 68, 0.04) 0%, rgba(15, 36, 68, 0.42) 100%);
  pointer-events: none;
}

.team-role-badge {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  z-index: 1;
  border-radius: 9999px;
  background: rgba(15, 36, 68, 0.72);
  padding: 0.65rem 0.9rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f8fafc;
  backdrop-filter: blur(10px);
}

.team-card-member h3,
.team-card-member > p:not(.team-role-badge) {
  padding-left: 1.4rem;
  padding-right: 1.4rem;
}

.cta-section {
  background: linear-gradient(180deg, #102442 0%, #17345f 100%);
}

.cta-panel {
  display: grid;
  gap: 1.5rem;
  align-items: center;
  border-radius: 1.7rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.12), transparent 28%),
    rgba(255, 255, 255, 0.04);
  padding: 2rem;
  backdrop-filter: blur(14px);
}

.cta-title,
.cta-copy {
  color: white;
}

.cta-copy {
  margin-top: 0.9rem;
  max-width: 40rem;
  line-height: 1.75;
  color: rgba(221, 234, 248, 0.82);
}

.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
}

.cta-btn {
  display: inline-flex;
  min-height: 50px;
  min-width: 180px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0 1.25rem;
  text-decoration: none;
  font-weight: 700;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.cta-btn:hover {
  transform: translateY(-2px);
}

.cta-btn-primary {
  background: #f97316;
  color: white;
  box-shadow: 0 14px 32px rgba(249, 115, 22, 0.22);
}

.cta-btn-primary:hover {
  background: #ea580c;
}

.cta-btn-secondary {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: white;
}

.cta-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}

@media (min-width: 1024px) {
  .cta-panel {
    grid-template-columns: minmax(0, 1.2fr) auto;
    padding: 2.3rem 2.4rem;
  }

  .mission-highlight-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .team-avatar-img {
    height: 15rem;
  }

  .team-role-badge {
    left: 0.8rem;
    right: 0.8rem;
    bottom: 0.8rem;
    padding: 0.55rem 0.75rem;
    font-size: 0.72rem;
  }

  .cta-actions {
    width: 100%;
  }

  .cta-btn {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .hero-section {
    min-height: 460px;
  }

  .section-title,
  .cta-title {
    font-size: clamp(1.75rem, 8.8vw, 2.2rem);
  }

  .mission-panel,
  .capability-panel,
  .value-card,
  .team-card,
  .cta-panel {
    border-radius: 1.2rem;
  }

  .value-card,
  .cta-panel {
    padding: 1.2rem;
  }
}
</style>
