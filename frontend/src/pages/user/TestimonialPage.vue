<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../../stores/session.js';
import AppFooter from '../../components/AppFooter.vue';
import api, { extractApiError } from '../../services/api.js';

const router = useRouter();
const session = useSessionStore();

const form = ref({
  display_name: '',
  role_label: '',
  message: '',
  rating: 0,
  is_anonymous: false,
});

onMounted(() => {
  form.value.display_name = session.currentUser?.full_name || '';
});

const hoverRating = ref(0);
const submitting = ref(false);
const submitted = ref(false);
const error = ref('');
let redirectTimer = null;

const setRating = (val) => { form.value.rating = val; };
const setHover = (val) => { hoverRating.value = val; };
const clearHover = () => { hoverRating.value = 0; };
const activeRating = () => hoverRating.value || form.value.rating;

const handleAnonymous = () => {
  if (form.value.is_anonymous) {
    form.value.display_name = 'Anonymous';
  } else {
    form.value.display_name = session.currentUser?.full_name || '';
  }
};

const submit = async () => {
  error.value = '';

  if (!form.value.rating) {
    error.value = 'Please select a star rating.';
    return;
  }
  if (!form.value.message.trim()) {
    error.value = 'Please write your experience.';
    return;
  }
  if (form.value.message.trim().length < 20) {
    error.value = 'Please write at least 20 characters.';
    return;
  }

  submitting.value = true;
  try {
    await api.post('/testimonials', {
      display_name: form.value.is_anonymous ? 'Anonymous' : form.value.display_name,
      role_label: form.value.role_label || 'System User',
      message: form.value.message.trim(),
      rating: form.value.rating,
    });
    submitted.value = true;
    redirectTimer = window.setTimeout(() => {
      router.push('/user/dashboard');
    }, 1800);
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to submit testimonial');
  } finally {
    submitting.value = false;
  }
};

onBeforeUnmount(() => {
  if (redirectTimer) {
    window.clearTimeout(redirectTimer);
  }
});
</script>


<template>
 <div class="min-h-screen w-screen flex flex-col">
    <AuthTopNav fixed />
    <section class="testimonial-page w-full flex-1 pt-24">

    <!-- ── Success state ───────────────────────────────────────── -->
    <div v-if="submitted" class="success-card">
      <div class="success-icon">
        <svg class="h-10 w-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h2 class="success-title font-family">Thank you for sharing your experience!</h2>
      <p class="success-desc">Your testimonial has been submitted and is pending review. Once approved by an admin it will appear publicly on the homepage.</p>
      <p class="mt-3 text-xs font-medium text-slate-400">Redirecting you back to the dashboard...</p>
      <button class="back-btn" @click="router.push('/user/dashboard')">
        ← Back to Dashboard
      </button>
    </div>

    <!-- ── Form ────────────────────────────────────────────────── -->
    <div v-else class="form-wrapper">

      <!-- Header -->
      <div class="form-header">
        <div class="form-header-icon">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </div>
        <div>
          <p class="form-kicker">Public Testimonial</p>
          <h1 class="form-title">Share Your Experience</h1>
          <p class="form-subtitle">Your testimonial will be visible to the public on the homepage after admin approval. It will not contain any complaint or organization data.</p>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-banner">
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ error }}
      </div>

      <!-- Star Rating -->
      <div class="field-group">
        <label class="field-label">Your Rating <span class="text-red-400">*</span></label>
        <div class="stars-row" @mouseleave="clearHover">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="star-btn"
            :class="{ 'star-active': n <= activeRating(), 'star-hover': n <= hoverRating }"
            @mouseenter="setHover(n)"
            @click="setRating(n)"
          >★</button>
        </div>
        <p class="rating-label">
          <span v-if="activeRating() === 1">Poor</span>
          <span v-else-if="activeRating() === 2">Fair</span>
          <span v-else-if="activeRating() === 3">Good</span>
          <span v-else-if="activeRating() === 4">Very Good</span>
          <span v-else-if="activeRating() === 5">Excellent</span>
          <span v-else class="text-slate-400">Click to rate</span>
        </p>
      </div>

      <!-- Message -->
      <div class="field-group">
        <label class="field-label">Your Experience <span class="text-red-400">*</span></label>
        <textarea
          v-model="form.message"
          class="field-textarea"
          rows="4"
          placeholder="Tell others what it was like using ComplaintTrack. What did you find most useful? How did it help you?"
          maxlength="500"
        ></textarea>
        <p class="char-count">{{ form.message.length }} / 500</p>
      </div>

      <!-- Display Name + Role -->
      <div class="two-col">
        <div class="field-group">
          <label class="field-label">Display Name</label>
          <input
            v-model="form.display_name"
            type="text"
            class="field-input"
            placeholder="Your name or alias"
            :disabled="form.is_anonymous"
          />
        </div>
        <div class="field-group">
          <label class="field-label">Your Role / Description</label>
          <input
            v-model="form.role_label"
            type="text"
            class="field-input"
            placeholder="e.g. Student, Community Member"
          />
        </div>
      </div>

      <!-- Anonymous toggle -->
      <div class="anon-row">
        <label class="anon-label">
          <div class="anon-toggle" :class="{ 'anon-on': form.is_anonymous }" @click="form.is_anonymous = !form.is_anonymous; handleAnonymous()">
            <div class="anon-knob"></div>
          </div>
          <span class="text-sm text-slate-600">Submit anonymously — your name will show as "Anonymous"</span>
        </label>
      </div>

      <!-- Notice -->
      <div class="notice-box">
        <svg class="h-4 w-4 flex-shrink-0 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p class="text-xs text-slate-500">This testimonial is completely separate from your complaints and organization data. No sensitive information will be shared publicly.</p>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" class="cancel-btn" @click="router.push('/user/dashboard')">
          Cancel
        </button>
        <button type="button" class="submit-btn" :disabled="submitting" @click="submit">
          <svg v-if="submitting" class="spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          {{ submitting ? 'Submitting...' : 'Submit Testimonial' }}
        </button>
      </div>

    </div>
  </section>
    <AppFooter/>
  </div>
</template>

<style scoped>
.testimonial-page {
  font-family: 'Times New Roman', Times, serif;
  padding: 1.5rem;
}

/* ── Success ───────────────────────────────── */
.success-card {
  max-width: 32rem; margin: 4rem auto;
  font-family:'Georgia''Times New Roman';
  text-align: center; padding: 3rem 2rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(16,185,129,0.15);
  background: linear-gradient(135deg, #5098c9, #ffffff);
  box-shadow: 0 8px 40px rgba(16,185,129,0.08);
}


.success-icon { display: flex; justify-content: center; margin-bottom: 1.25rem; }
.success-title { font-size: 1.5rem; font-weight: 900; color: #0f2444; }
.success-desc { margin-top: 0.75rem; font-size: 0.875rem; line-height: 1.7; color: #09090a; max-width: 22rem; margin-left: auto; margin-right: auto; }
.back-btn {
  margin-top: 2rem; display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1.75rem; border-radius: 9999px;
  background: #0f2444; color: white; font-size: 0.875rem; font-weight: 700;
  border: none; cursor: pointer; transition: all 0.2s;
  
}
.back-btn:hover { background: #162d5c; transform: translateY(-1px); }

/* ── Form wrapper ──────────────────────────── */
.form-wrapper {
 max-width: 100%; margin: 0 auto;
  background: white;
  border: 1px solid rgba(15,36,68,0.08);
  border-radius: 1.5rem;
   padding: 6.5rem 11rem 18rem 11rem;
  box-shadow: 0 4px 30px rgba(15,36,68,0.07);
  display: flex; flex-direction: column; gap: 1.5rem;
}

/* ── Form header ───────────────────────────── */
.form-header {
  display: flex; gap: 1rem; align-items: flex-start;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}
.form-header-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 3rem; height: 3rem; border-radius: 0.875rem;
  background: #faf8f6; color: #072f6d; flex-shrink: 0;
}
.form-kicker {
  font-size: 0.70rem; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase; color: #f78f07;
   font-family: 'Times New Roman';
}
.form-title {
  font-size: 1.25rem; font-weight: 900; color: #0f2444; margin-top: 0.2rem;
  font-family:'Times New Roman';
}
.form-subtitle {
  margin-top: 0.4rem; font-size: 0.8rem; line-height: 1.6; color: #94a3b8;
   font-family: 'Georgia''Times New Roman';
}

/* ── Error banner ──────────────────────────── */
.error-banner {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.75rem 1rem; border-radius: 0.75rem;
  background: #fef2f2; border: 1px solid #fecaca;
  font-size: 0.85rem; color: #dc2626; font-weight: 500;
}

/* ── Field ─────────────────────────────────── */
.field-group { display: flex; flex-direction: column; gap: 0.4rem; }
.field-label { font-size: 0.8rem; font-weight: 700; color: #110f30; }
.field-input {
  padding: 0.65rem 0.875rem;
  border: 1px solid #e2e8f0; border-radius: 0.625rem;
  font-size: 0.875rem; color: #0f172a; background: #f8fafc;
  outline: none; transition: border 0.2s;
  font-family: 'Times New Roman', Times, serif;
}
.field-input:focus { border-color: #f97316; background: white; box-shadow: 0 0 0 3px rgba(249,115,22,0.08); }
.field-input:disabled { opacity: 0.5; cursor: not-allowed; }
.field-textarea {
  padding: 0.75rem 0.875rem;
  border: 1px solid #e2e8f0; border-radius: 0.625rem;
  font-size: 0.875rem; color:  #0f172a; background: #f8fafc;
  outline: none; resize: vertical; transition: border 0.2s;
  font-family: 'Times New Roman', Times, serif; line-height: 1.6;
}
.field-textarea:focus { border-color: #f97316; background: white; box-shadow: 0 0 0 3px rgba(249,115,22,0.08); }
.char-count { font-size: 0.72rem; color: #94a3b8; text-align: right; }

.two-col { display: grid; gap: 1rem; grid-template-columns: 1fr 1fr; }
@media (max-width: 540px) { .two-col { grid-template-columns: 1fr; } }

/* ── Stars ─────────────────────────────────── */
.stars-row { display: flex; gap: 0.35rem; }
.star-btn {
  font-size: 2rem; background: none; border: none; cursor: pointer;
  color: #e2e8f0; transition: color 0.15s, transform 0.15s; line-height: 1;
  padding: 0;
}
.star-active { color: #f59e0b; }
.star-btn:hover { transform: scale(1.15); }
.rating-label { font-size: 0.8rem; font-weight: 600; color: #f97316; min-height: 1.2rem; }

/* ── Anonymous toggle ──────────────────────── */
.anon-row { display: flex; align-items: center; }
.anon-label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; user-select: none; }
.anon-toggle {
  width: 2.75rem; height: 1.5rem; border-radius: 9999px;
  background: #e2e8f0; position: relative; transition: background 0.2s; flex-shrink: 0;
}
.anon-on { background: #e7760c; }
.anon-knob {
  position: absolute; top: 3px; left: 3px;
  width: 1.125rem; height: 1.125rem; border-radius: 9999px;
  background: white; transition: transform 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.anon-on .anon-knob { transform: translateX(1.25rem); }

/* ── Notice ────────────────────────────────── */
.notice-box {
  display: flex; gap: 0.6rem; align-items: flex-start;
  padding: 0.75rem 1rem; border-radius: 0.75rem;
  background: #f0f9ff; border: 1px solid #bae6fd;
}

/* ── Actions ───────────────────────────────── */
.form-actions {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding-top: 1rem; border-top: 1px solid #f1f5f9;
}
.cancel-btn {
  padding: 0.7rem 1.5rem; border-radius: 9999px;
  border: 1px solid #e2e8f0; background: white;
  font-size: 0.875rem; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.2s;
}
.cancel-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
.submit-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 1.75rem; border-radius: 9999px;
  background: #072f6d; color: white;
  font-size: 0.875rem; font-weight: 700; border: none; cursor: pointer;
  box-shadow: 0 4px 16px rgba(249,115,22,0.35);
  transition: all 0.2s;
}
.submit-btn:hover:not(:disabled) { background: #ea6c0c; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.4); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* ── Spinner ───────────────────────────────── */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
