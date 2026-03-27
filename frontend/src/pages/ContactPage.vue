<script setup>
import { computed, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AuthTopNav from '../components/AuthTopNav.vue';
import api, { extractApiError } from '../services/api';

const contactChannels = [
  {
    title: 'General Support',
    meta: 'Mon - Fri, 8:00 AM to 5:00 PM',
    value: 'support@complaintms.com',
    href: 'mailto:support@complaintms.com'
  },
  {
    title: 'Phone Line',
    meta: 'Fast help for urgent guidance',
    value: '+231 77 000 0000',
    href: 'tel:+231770000000'
  },
  {
    title: 'Team Updates',
    meta: 'Stay connected through public channels',
    value: '@ComplaintMS',
    href: '/features'
  }
];

const supportPoints = [
  'Questions about how the platform works',
  'Support with account access or sign-in flow',
  'Help understanding role-based workspaces',
  'Guidance on complaint submission and follow-up'
];

const faqCards = [
  {
    title: 'How quickly should I expect a response?',
    description: 'Response times depend on the receiving organization, but the platform is designed to keep progress visible so people are not left guessing.'
  },
  {
    title: 'Can I use the platform as an organization?',
    description: 'Yes. Complaint MS supports organization administrators, department-based routing, and reporting tools for institutional response teams.'
  },
  {
    title: 'Is this suitable for public service environments?',
    description: 'That is exactly the direction of the product. The design is focused on clearer accountability, better service communication, and structured complaint handling.'
  }
];

const form = reactive({
  full_name: '',
  email: '',
  organization: '',
  subject: '',
  message: ''
});

const sending = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const trimmedMessageLength = computed(() => String(form.message || '').trim().length);

const fieldErrors = computed(() => {
  const errors = {};

  if (form.full_name && String(form.full_name).trim().length < 3) {
    errors.full_name = 'Please enter at least 3 characters.';
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email).trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (form.subject && String(form.subject).trim().length < 5) {
    errors.subject = 'Subject should be at least 5 characters.';
  }

  if (form.message && trimmedMessageLength.value < 20) {
    errors.message = 'Message should be at least 20 characters.';
  }

  return errors;
});

const submitForm = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  if (!form.full_name.trim() || !form.email.trim() || !form.subject.trim() || trimmedMessageLength.value < 20) {
    errorMessage.value = 'Complete the required fields before sending your message.';
    return;
  }

  if (Object.keys(fieldErrors.value).length > 0) {
    errorMessage.value = 'Please fix the highlighted form details and try again.';
    return;
  }

  sending.value = true;
  try {
    const response = await api.post('/email/contact', {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      organization: form.organization.trim(),
      subject: form.subject.trim(),
      message: form.message.trim()
    }, { skipAuth: true });

    successMessage.value = response?.data?.message || 'Your message has been sent successfully.';
    form.full_name = '';
    form.email = '';
    form.organization = '';
    form.subject = '';
    form.message = '';
  } catch (error) {
    errorMessage.value = extractApiError(error, 'Unable to send your message right now.');
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <div class="contact-page flex min-h-screen w-full flex-col">
    <AuthTopNav fixed />

    <section class="contact-hero relative overflow-hidden pt-24 sm:pt-28 lg:pt-32">
      <div class="mx-auto grid max-w-6xl gap-8 px-6 pb-12 pt-8 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-16 lg:items-end lg:pb-16">
        <div>
          <p class="contact-kicker">Contact</p>
          <h1 class="contact-title mt-4">Let’s make complaint support clearer, faster, and easier to understand.</h1>
          <p class="contact-copy mt-5 max-w-2xl text-base leading-7 text-blue-100/82 sm:text-lg">
            Reach out if you need help with the public site, account access, or understanding how the platform supports users and organizations.
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <a href="mailto:support@complaintms.com" class="contact-btn contact-btn-primary">Email Support</a>
            <RouterLink to="/signup" class="contact-btn contact-btn-secondary">Create Account</RouterLink>
          </div>
        </div>

        <div class="contact-hero-panel">
          <p class="contact-panel-label">Support Focus</p>
          <ul class="mt-4 space-y-3">
            <li v-for="item in supportPoints" :key="item" class="contact-list-row">
              <span class="contact-list-dot"></span>
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
            <p class="contact-section-kicker">Ways To Reach Us</p>
            <h2 class="contact-section-title mt-3">Choose the support channel that matches what you need.</h2>
          </div>

          <div class="mt-8 grid gap-6 lg:grid-cols-3">
            <article v-for="item in contactChannels" :key="item.title" class="contact-panel">
              <p class="contact-panel-meta">{{ item.meta }}</p>
              <h3 class="contact-panel-title mt-3">{{ item.title }}</h3>
              <a :href="item.href" class="contact-panel-link mt-5">{{ item.value }}</a>
            </article>
          </div>
        </section>

        <section class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div class="contact-panel">
            <p class="contact-section-kicker">What We Help With</p>
            <h2 class="contact-section-title mt-3">Support that feels practical instead of overwhelming.</h2>
            <p class="contact-panel-copy mt-4">
              This project is designed to help users and institutions navigate complaint handling with more confidence. The goal is not only to collect issues, but to make progress easier to understand and easier to trust.
            </p>

            <div class="mt-8 grid gap-4 sm:grid-cols-2">
              <div class="contact-mini-panel">
                <p class="contact-mini-label">Public guidance</p>
                <p class="contact-mini-copy">Understand how public pages, sign-in, and complaint submission are meant to work.</p>
              </div>
              <div class="contact-mini-panel">
                <p class="contact-mini-label">Organization support</p>
                <p class="contact-mini-copy">Clarify how admins, departments, and organizational workflows fit into the platform.</p>
              </div>
            </div>
          </div>

          <form class="contact-panel contact-form-panel" @submit.prevent="submitForm">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="contact-section-kicker">Live Contact Form</p>
                <h2 class="contact-section-title mt-3">Send a message directly from the site.</h2>
              </div>
              <span class="contact-live-chip">Real-time</span>
            </div>

            <p class="contact-panel-copy mt-4">
              Use the form for support questions, platform clarification, or partnership-style inquiries. Messages are sent to the configured project support inbox.
            </p>

            <div class="mt-7 grid gap-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="contact-field">
                  <span class="contact-field-label">Full name</span>
                  <input v-model="form.full_name" type="text" class="contact-input" placeholder="Your full name">
                  <span v-if="fieldErrors.full_name" class="contact-field-error">{{ fieldErrors.full_name }}</span>
                </label>

                <label class="contact-field">
                  <span class="contact-field-label">Email</span>
                  <input v-model="form.email" type="email" class="contact-input" placeholder="you@example.com">
                  <span v-if="fieldErrors.email" class="contact-field-error">{{ fieldErrors.email }}</span>
                </label>
              </div>

              <div class="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                <label class="contact-field">
                  <span class="contact-field-label">Organization</span>
                  <input v-model="form.organization" type="text" class="contact-input" placeholder="Optional">
                </label>

                <label class="contact-field">
                  <span class="contact-field-label">Subject</span>
                  <input v-model="form.subject" type="text" class="contact-input" placeholder="What do you need help with?">
                  <span v-if="fieldErrors.subject" class="contact-field-error">{{ fieldErrors.subject }}</span>
                </label>
              </div>

              <label class="contact-field">
                <span class="contact-field-label">Message</span>
                <textarea
                  v-model="form.message"
                  rows="6"
                  class="contact-input contact-textarea"
                  placeholder="Tell us what you need, what you're trying to do, or what support would be helpful."
                ></textarea>
                <div class="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span v-if="fieldErrors.message" class="contact-field-error">{{ fieldErrors.message }}</span>
                  <span class="ml-auto">{{ trimmedMessageLength }}/4000</span>
                </div>
              </label>
            </div>

            <p v-if="errorMessage" class="contact-alert contact-alert-error mt-5">{{ errorMessage }}</p>
            <p v-if="successMessage" class="contact-alert contact-alert-success mt-5">{{ successMessage }}</p>

            <div class="mt-6 flex flex-wrap gap-3">
              <button type="submit" class="contact-btn contact-btn-primary" :disabled="sending">
                {{ sending ? 'Sending Message...' : 'Send Message' }}
              </button>
              <RouterLink to="/services" class="contact-btn contact-btn-secondary">View Services</RouterLink>
            </div>
          </form>
        </section>

        <section>
          <div class="max-w-3xl">
            <p class="contact-section-kicker">FAQ</p>
            <h2 class="contact-section-title mt-3">A few common questions, answered clearly.</h2>
          </div>

          <div class="mt-8 grid gap-6 lg:grid-cols-3">
            <article v-for="item in faqCards" :key="item.title" class="contact-panel">
              <h3 class="contact-panel-title">{{ item.title }}</h3>
              <p class="contact-panel-copy mt-4">{{ item.description }}</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.contact-page {
  font-family: 'Times New Roman', Times, serif;
}

.contact-hero {
  background:
    radial-gradient(circle at 12% 22%, rgba(59, 130, 246, 0.22), transparent 24%),
    radial-gradient(circle at 84% 22%, rgba(249, 115, 22, 0.16), transparent 22%),
    linear-gradient(135deg, rgba(8, 24, 52, 0.98) 0%, rgba(13, 39, 74, 0.96) 50%, rgba(18, 56, 95, 0.93) 100%);
}

.contact-kicker,
.contact-section-kicker {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f97316;
}

.contact-title {
  max-width: 14ch;
  font-size: clamp(2.45rem, 5vw, 4.5rem);
  line-height: 0.98;
  font-weight: 900;
  letter-spacing: -0.045em;
  color: white;
}

.contact-copy,
.contact-panel-copy,
.contact-mini-copy {
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
}

.contact-btn {
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
  transition: transform 0.22s ease, background-color 0.22s ease, border-color 0.22s ease;
}

.contact-btn:hover {
  transform: translateY(-1px);
}

.contact-btn-primary,
.contact-btn-light {
  background: #f97316;
  color: white;
}

.contact-btn-primary:hover,
.contact-btn-light:hover {
  background: #ea6c0c;
}

.contact-btn-secondary {
  border: 1px solid rgba(24, 58, 99, 0.12);
  background: rgba(24, 58, 99, 0.06);
  color: #183a63;
}

.contact-btn-secondary:hover,
.contact-btn-outline-light:hover {
  background: rgba(24, 58, 99, 0.1);
}

.contact-btn-outline-light {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.contact-hero-panel,
.contact-panel,
.contact-mini-panel {
  border: 1px solid rgba(17, 28, 48, 0.08);
  background: white;
  box-shadow: 0 16px 34px rgba(12, 32, 61, 0.08);
}

.contact-hero-panel {
  border-radius: 1.6rem;
  padding: 1.35rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.08));
  border-color: rgba(255, 255, 255, 0.12);
  color: white;
  box-shadow: 0 18px 34px rgba(4, 15, 31, 0.22);
}

.contact-panel-label,
.contact-panel-meta,
.contact-mini-label {
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.contact-panel-label {
  color: rgba(255, 255, 255, 0.72);
}

.contact-panel-meta,
.contact-mini-label {
  color: #6c7b91;
}

.contact-list-row {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  color: rgba(245, 248, 255, 0.94);
  line-height: 1.5;
}

.contact-list-dot {
  width: 0.7rem;
  height: 0.7rem;
  margin-top: 0.35rem;
  border-radius: 999px;
  background: #f97316;
  box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.16);
  flex-shrink: 0;
}

.contact-section-title,
.contact-dark-title {
  font-size: clamp(1.9rem, 3vw, 2.9rem);
  line-height: 1.04;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #102947;
}

.contact-panel,
.contact-mini-panel {
  border-radius: 1.45rem;
  padding: 1.45rem;
}

.contact-panel-title {
  font-size: 1.08rem;
  font-weight: 800;
  color: #102947;
}

.contact-panel-link {
  display: inline-flex;
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #183a63;
  text-decoration: none;
}

.contact-panel-link:hover {
  color: #f97316;
}

.contact-form-panel {
  align-self: start;
}

.contact-live-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  background: rgba(24, 58, 99, 0.08);
  color: #183a63;
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.contact-field {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.contact-field-label {
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  font-size: 0.84rem;
  font-weight: 700;
  color: #17304f;
}

.contact-input {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgba(17, 28, 48, 0.1);
  background: #f8fafc;
  padding: 0.95rem 1rem;
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  font-size: 0.95rem;
  color: #102947;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.contact-input:focus {
  border-color: rgba(24, 58, 99, 0.32);
  background: white;
  box-shadow: 0 0 0 4px rgba(24, 58, 99, 0.08);
}

.contact-textarea {
  resize: vertical;
  min-height: 10rem;
}

.contact-field-error {
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  font-size: 0.76rem;
  color: #b42318;
}

.contact-alert {
  border-radius: 1rem;
  padding: 0.95rem 1rem;
  font-family: Inter, Roboto, "Segoe UI", sans-serif;
  font-size: 0.9rem;
  line-height: 1.6;
}

.contact-alert-error {
  border: 1px solid rgba(180, 35, 24, 0.16);
  background: #fef3f2;
  color: #b42318;
}

.contact-alert-success {
  border: 1px solid rgba(18, 183, 106, 0.16);
  background: #ecfdf3;
  color: #027a48;
}

@media (max-width: 767px) {
  .contact-title {
    max-width: 100%;
  }

  .contact-hero-panel,
  .contact-panel,
  .contact-mini-panel {
    border-radius: 1.2rem;
    padding: 1.15rem;
    box-shadow: 0 10px 22px rgba(12, 32, 61, 0.08);
  }
}
</style>
