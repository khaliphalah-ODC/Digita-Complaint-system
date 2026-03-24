<script setup>
import { computed, onMounted, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import { useSessionStore } from '../../stores/session.js';

const session = useSessionStore();
const loading = ref(false);
const actingId = ref(null);
const error = ref('');
const testimonials = ref([]);

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const fetchTestimonials = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/testimonials');
    testimonials.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch testimonials') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch testimonials');
  } finally {
    loading.value = false;
  }
};

const approve = async (id) => {
  actingId.value = id;
  error.value = '';
  try {
    await api.patch(`/testimonials/${id}/approve`);
    await fetchTestimonials();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to approve testimonial');
  } finally {
    actingId.value = null;
  }
};

const reject = async (id) => {
  actingId.value = id;
  error.value = '';
  try {
    await api.patch(`/testimonials/${id}/reject`);
    await fetchTestimonials();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to reject testimonial');
  } finally {
    actingId.value = null;
  }
};

const remove = async (id) => {
  const confirmed = window.confirm('Delete this testimonial permanently?');
  if (!confirmed) return;

  actingId.value = id;
  error.value = '';
  try {
    await api.delete(`/testimonials/${id}`);
    await fetchTestimonials();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete testimonial');
  } finally {
    actingId.value = null;
  }
};

const pendingTestimonials = computed(() =>
  testimonials.value.filter((item) => Number(item.is_approved) !== 1)
);

const approvedTestimonials = computed(() =>
  testimonials.value.filter((item) => Number(item.is_approved) === 1)
);

const isSuperAdmin = computed(() => session.currentUser?.role === 'super_admin');
const pageKicker = computed(() => (isSuperAdmin.value ? 'Platform Testimonials' : 'Testimonials'));
const pageTitle = computed(() => (isSuperAdmin.value ? 'Manage Testimonials' : 'Testimonials'));
const pageDescription = computed(() => (
  isSuperAdmin.value
    ? 'Review testimonials submitted by users across the platform and decide which ones should appear on the homepage.'
    : 'Testimonial moderation is handled by the super-admin workspace.'
));
const totalCaption = computed(() => (
  isSuperAdmin.value ? 'Testimonials submitted across the platform.' : 'Testimonials visible in this workspace.'
));

onMounted(fetchTestimonials);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-workspace-stack">
    <div class="org-admin-gradient-panel">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="app-kicker text-[var(--app-primary)]">{{ pageKicker }}</p>
          <h1 class="mt-2 text-3xl font-black text-[var(--app-title-color)] sm:text-4xl">{{ pageTitle }}</h1>
          <p class="mt-3 max-w-3xl text-sm leading-7 text-[var(--app-muted-color)]">
            {{ pageDescription }}
          </p>
        </div>
        <button class="app-btn-secondary" @click="fetchTestimonials">
          Refresh
        </button>
      </header>

      <section class="mt-6 org-admin-stat-row">
        <article class="app-section-card org-admin-stat-card">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--app-muted-color)]">Total</p>
          <p class="mt-2 text-3xl font-black text-[var(--app-title-color)]">{{ testimonials.length }}</p>
          <p class="text-xs text-[var(--app-muted-color)]">{{ totalCaption }}</p>
        </article>
        <article class="app-section-card org-admin-stat-card">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--app-muted-color)]">Pending Review</p>
          <p class="mt-2 text-3xl font-black text-[var(--app-title-color)]">{{ pendingTestimonials.length }}</p>
          <p class="text-xs text-[var(--app-muted-color)]">Waiting for approval.</p>
        </article>
        <article class="app-section-card org-admin-stat-card">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--app-muted-color)]">Approved</p>
          <p class="mt-2 text-3xl font-black text-[var(--app-title-color)]">{{ approvedTestimonials.length }}</p>
          <p class="text-xs text-[var(--app-muted-color)]">Currently visible on homepage.</p>
        </article>
      </section>
    </div>

    <p v-if="loading" class="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">Loading testimonials...</p>
    <p v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <section class="app-section-card">
        <div class="mb-4">
          <p class="text-xs uppercase tracking-[0.18em] text-[var(--app-muted-color)]">Pending</p>
          <h2 class="mt-2 text-2xl font-black text-[var(--app-title-color)]">Awaiting Approval</h2>
        </div>

        <div v-if="!pendingTestimonials.length" class="app-empty-state text-sm">
          No pending testimonials.
        </div>

        <div v-else class="space-y-4">
          <article
            v-for="item in pendingTestimonials"
            :key="`pending-${item.id}`"
            class="app-card rounded-[22px] p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ item.display_name || 'Anonymous' }}</p>
                <p class="text-xs text-[var(--app-muted-color)]">{{ item.role_label || 'System User' }}</p>
                <p v-if="item.user_email || item.organization_id" class="mt-1 text-[11px] text-[var(--app-muted-color)]">
                  {{ item.user_email || 'No email' }}<span v-if="item.organization_id"> | Org #{{ item.organization_id }}</span>
                </p>
              </div>
              <span class="app-badge app-badge-warning">
                {{ item.rating }}/5
              </span>
            </div>
            <p class="mt-3 text-sm leading-6 text-[var(--app-muted-color)]">{{ item.message }}</p>
            <div class="app-action-row mt-4 flex flex-wrap gap-2">
              <button class="app-btn-primary text-xs disabled:opacity-60" :disabled="actingId === item.id" @click="approve(item.id)">
                Approve
              </button>
              <button class="app-btn-secondary text-xs disabled:opacity-60" :disabled="actingId === item.id" @click="reject(item.id)">
                Keep Hidden
              </button>
              <button class="app-btn-danger rounded-lg px-4 py-2 text-xs disabled:opacity-60" :disabled="actingId === item.id" @click="remove(item.id)">
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="app-section-card">
        <div class="mb-4">
          <p class="text-xs uppercase tracking-[0.18em] text-[var(--app-muted-color)]">Approved</p>
          <h2 class="mt-2 text-2xl font-black text-[var(--app-title-color)]">Homepage Testimonials</h2>
        </div>

        <div v-if="!approvedTestimonials.length" class="app-empty-state text-sm">
          No approved testimonials yet.
        </div>

        <div v-else class="space-y-4">
          <article
            v-for="item in approvedTestimonials"
            :key="`approved-${item.id}`"
            class="app-card rounded-[22px] p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ item.display_name || 'Anonymous' }}</p>
                <p class="text-xs text-[var(--app-muted-color)]">{{ item.role_label || 'System User' }}</p>
                <p v-if="item.user_email || item.organization_id" class="mt-1 text-[11px] text-[var(--app-muted-color)]">
                  {{ item.user_email || 'No email' }}<span v-if="item.organization_id"> | Org #{{ item.organization_id }}</span>
                </p>
              </div>
              <span class="app-badge app-badge-success">
                Live on homepage
              </span>
            </div>
            <p class="mt-3 text-sm leading-6 text-[var(--app-muted-color)]">{{ item.message }}</p>
            <div class="app-action-row mt-4 flex flex-wrap gap-2">
              <button class="app-btn-secondary text-xs disabled:opacity-60" :disabled="actingId === item.id" @click="reject(item.id)">
                Hide
              </button>
              <button class="app-btn-danger rounded-lg px-4 py-2 text-xs disabled:opacity-60" :disabled="actingId === item.id" @click="remove(item.id)">
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>
    </section>
    </div>
  </section>
</template>
