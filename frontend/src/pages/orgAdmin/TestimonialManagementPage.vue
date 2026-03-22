<script setup>
import { computed, onMounted, ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';

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

onMounted(fetchTestimonials);
</script>

<template>
  <section class="space-y-5">
    <div class="org-admin-gradient-panel">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="app-kicker text-white/80">Organization Testimonials</p>
          <h1 class="mt-2 text-3xl font-black text-white sm:text-4xl">Manage Testimonials</h1>
          <p class="mt-3 max-w-3xl text-sm leading-7 text-white/75">
            Review testimonials submitted by users in your organization and decide which ones should appear on the homepage.
          </p>
        </div>
        <button class="org-admin-outline-btn" @click="fetchTestimonials">
          Refresh
        </button>
      </header>

      <section class="mt-6 org-admin-stat-row">
        <article class="org-admin-panel-card org-admin-stat-card">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/70">Total</p>
          <p class="mt-2 text-3xl font-black text-white">{{ testimonials.length }}</p>
          <p class="text-xs text-white/60">Testimonials from your organization.</p>
        </article>
        <article class="org-admin-panel-card org-admin-stat-card">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/70">Pending Review</p>
          <p class="mt-2 text-3xl font-black text-white">{{ pendingTestimonials.length }}</p>
          <p class="text-xs text-white/60">Waiting for approval.</p>
        </article>
        <article class="org-admin-panel-card org-admin-stat-card">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/70">Approved</p>
          <p class="mt-2 text-3xl font-black text-white">{{ approvedTestimonials.length }}</p>
          <p class="text-xs text-white/60">Currently visible on homepage.</p>
        </article>
      </section>
    </div>

    <p v-if="loading" class="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">Loading testimonials...</p>
    <p v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <section class="org-admin-panel-card">
        <div class="mb-4">
          <p class="text-xs uppercase tracking-[0.18em] text-white/60">Pending</p>
          <h2 class="mt-2 text-2xl font-black text-white">Awaiting Approval</h2>
        </div>

        <div v-if="!pendingTestimonials.length" class="rounded-[22px] border border-white/10 bg-white/6 p-4 text-sm text-white/70">
          No pending testimonials.
        </div>

        <div v-else class="space-y-4">
          <article
            v-for="item in pendingTestimonials"
            :key="`pending-${item.id}`"
            class="rounded-[22px] border border-white/10 bg-white/6 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-white">{{ item.display_name || 'Anonymous' }}</p>
                <p class="text-xs text-white/60">{{ item.role_label || 'System User' }}</p>
              </div>
              <span class="rounded-full bg-amber-400/18 px-3 py-1 text-xs font-semibold text-amber-100">
                {{ item.rating }}/5
              </span>
            </div>
            <p class="mt-3 text-sm leading-6 text-white/82">{{ item.message }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button class="org-admin-btn text-xs disabled:opacity-60" :disabled="actingId === item.id" @click="approve(item.id)">
                Approve
              </button>
              <button class="org-admin-outline-btn text-xs disabled:opacity-60" :disabled="actingId === item.id" @click="reject(item.id)">
                Keep Hidden
              </button>
              <button class="rounded-full bg-red-500/16 px-4 py-2 text-xs font-semibold text-red-100 disabled:opacity-60" :disabled="actingId === item.id" @click="remove(item.id)">
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="org-admin-panel-card">
        <div class="mb-4">
          <p class="text-xs uppercase tracking-[0.18em] text-white/60">Approved</p>
          <h2 class="mt-2 text-2xl font-black text-white">Homepage Testimonials</h2>
        </div>

        <div v-if="!approvedTestimonials.length" class="rounded-[22px] border border-white/10 bg-white/6 p-4 text-sm text-white/70">
          No approved testimonials yet.
        </div>

        <div v-else class="space-y-4">
          <article
            v-for="item in approvedTestimonials"
            :key="`approved-${item.id}`"
            class="rounded-[22px] border border-white/10 bg-white/6 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-white">{{ item.display_name || 'Anonymous' }}</p>
                <p class="text-xs text-white/60">{{ item.role_label || 'System User' }}</p>
              </div>
              <span class="rounded-full bg-emerald-400/18 px-3 py-1 text-xs font-semibold text-emerald-100">
                Live on homepage
              </span>
            </div>
            <p class="mt-3 text-sm leading-6 text-white/82">{{ item.message }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button class="org-admin-outline-btn text-xs disabled:opacity-60" :disabled="actingId === item.id" @click="reject(item.id)">
                Hide
              </button>
              <button class="rounded-full bg-red-500/16 px-4 py-2 text-xs font-semibold text-red-100 disabled:opacity-60" :disabled="actingId === item.id" @click="remove(item.id)">
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>
    </section>
  </section>
</template>
