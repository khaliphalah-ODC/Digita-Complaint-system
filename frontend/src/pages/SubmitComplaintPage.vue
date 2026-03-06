<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session.js';
import { useComplaintStore } from '../stores/complaint.js';

const router = useRouter();
const session = useSessionStore();
const complaintStore = useComplaintStore();

const submitting = ref(false);
const formError = ref('');
const lastSubmitted = ref(null);

const categorySuggestions = ['Infrastructure', 'Sanitation', 'Billing', 'Security', 'Health'];
const priorityOptions = ['low', 'medium', 'urgent'];

const form = reactive({
  title: '',
  category: '',
  complaint: '',
  priority: 'medium',
  is_anonymous: false,
  anonymous_label: ''
});

const hasOrganization = computed(() => Boolean(session.currentUser?.organization_id));
const nonAnonymousBlocked = computed(() => !form.is_anonymous && !hasOrganization.value);
const activeTrackingCode = computed(() => lastSubmitted.value?.tracking_code || 'TRK-000-000');

const qrUrl = computed(() => {
  const trackUrl = `${window.location.origin}/track-complaint?code=${encodeURIComponent(activeTrackingCode.value)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(trackUrl)}`;
});

const priorityClasses = (priority) => {
  if (priority === 'low') return 'bg-slate-500 text-white';
  if (priority === 'medium') return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
};

const resetForm = () => {
  form.title = '';
  form.category = '';
  form.complaint = '';
  form.priority = 'medium';
  form.is_anonymous = false;
  form.anonymous_label = '';
};

const submitComplaint = async () => {
  formError.value = '';

  if (nonAnonymousBlocked.value) {
    formError.value = 'Create or join an organization before submitting a non-anonymous complaint.';
    return;
  }
  if (!form.title.trim() || !form.complaint.trim()) {
    formError.value = 'Complaint title and description are required.';
    return;
  }

  submitting.value = true;
  try {
    const created = await complaintStore.createComplaint({
      title: form.title.trim(),
      complaint: form.complaint.trim(),
      category: form.category.trim() || null,
      priority: form.priority,
      is_anonymous: form.is_anonymous,
      anonymous_label: form.is_anonymous ? (form.anonymous_label.trim() || 'Guest Citizen') : null
    });

    lastSubmitted.value = created;
    resetForm();
    await router.push({
      path: '/track-complaint',
      query: { code: created?.tracking_code || '' }
    });
  } catch (error) {
    formError.value = error?.message || complaintStore.error || 'Failed to submit complaint';
  } finally {
    submitting.value = false;
  }
};

const downloadReceiptPdf = () => {
  if (!lastSubmitted.value) return;

  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Complaint Receipt</title></head>
  <body style="font-family: Arial, sans-serif; padding: 24px;">
    <h2>Complaint Receipt</h2>
    <p><strong>Tracking:</strong> ${lastSubmitted.value.tracking_code || 'N/A'}</p>
    <p><strong>Title:</strong> ${lastSubmitted.value.title || ''}</p>
    <p><strong>Category:</strong> ${lastSubmitted.value.category || 'N/A'}</p>
    <p><strong>Priority:</strong> ${lastSubmitted.value.priority || 'N/A'}</p>
    <p><strong>Status:</strong> ${lastSubmitted.value.status || 'submitted'}</p>
    <p><strong>Submitted:</strong> ${lastSubmitted.value.created_at || new Date().toISOString()}</p>
    <p><strong>Description:</strong> ${lastSubmitted.value.complaint || ''}</p>
    <hr />
    <p>Complaint Management System</p>
    <script>window.print()<\/script>
  </body></html>`;

  const popup = window.open('', '_blank', 'width=840,height=700');
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
};

const returnHome = () => {
  const isAdmin = session.currentUser?.role === 'admin';
  router.push(isAdmin ? '/admin/dashboard' : '/team-dashboard');
};
</script>

<template>
  <section class="w-full rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-xl">
    <header class="rounded-t-3xl border-b border-slate-200 bg-slate-100/70 px-6 py-6 md:px-8">
      <h1 class="text-4xl font-black tracking-tight text-slate-800">How can we help you today?</h1>
      <p class="mt-1 text-sm text-slate-600">Submit your feedback or report an issue. We typically respond within 24 hours.</p>
    </header>

    <div class="grid grid-cols-1 gap-5 px-6 py-6 md:grid-cols-[1.2fr,0.9fr] md:px-8">
      <form class="space-y-4" @submit.prevent="submitComplaint">
        <div>
          <label class="mb-1 block text-sm font-semibold text-slate-700">Complaint Title</label>
          <input
            v-model="form.title"
            placeholder="e.g. Broken streetlight on 5th Ave"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Category</label>
            <input
              v-model="form.category"
              placeholder="Infrastructure, Sanitation, Billing"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="category in categorySuggestions"
                :key="category"
                type="button"
                class="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-700"
                @click="form.category = category"
              >
                {{ category }}
              </button>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Priority</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="priority in priorityOptions"
                :key="priority"
                type="button"
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="form.priority === priority ? priorityClasses(priority) : 'bg-slate-100 text-slate-700'"
                @click="form.priority = priority"
              >
                {{ priority }}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Description</label>
          <textarea
            v-model="form.complaint"
            rows="4"
            placeholder="Describe the issue in detail"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Submit as anonymous</label>
          <input
            v-if="form.is_anonymous"
            v-model="form.anonymous_label"
            placeholder="Guest Name (optional)"
            class="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
          <label class="inline-flex items-center gap-2 text-sm text-slate-700">
            <span class="relative inline-flex h-6 w-11 items-center rounded-full" :class="form.is_anonymous ? 'bg-blue-500' : 'bg-slate-300'">
              <input v-model="form.is_anonymous" type="checkbox" class="peer sr-only">
              <span class="inline-block h-5 w-5 transform rounded-full bg-white transition" :class="form.is_anonymous ? 'translate-x-5' : 'translate-x-1'"></span>
            </span>
            Submit as anonymous (Anonymous Form)
          </label>
        </div>

        <p v-if="nonAnonymousBlocked" class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You need an organization for non-anonymous complaints.
          <RouterLink to="/organizations" class="font-semibold underline">Create organization</RouterLink>
          or switch on anonymous mode.
        </p>

        <p v-if="formError" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>

        <button
          type="submit"
          :disabled="submitting || nonAnonymousBlocked"
          class="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow hover:brightness-110 disabled:opacity-60"
        >
          {{ submitting ? 'Submitting...' : 'Submit Complaint' }}
        </button>
      </form>

      <aside class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xl font-black text-white">✓</div>
          <p class="mt-2 text-sm font-semibold text-slate-800">Thank you for your feedback!</p>
          <div class="mt-3 rounded-lg border border-violet-300 bg-white px-3 py-2 text-base font-black tracking-wide text-slate-800">
            {{ activeTrackingCode }}
          </div>
        </div>

        <div class="mt-4 grid grid-cols-[1fr,auto] items-center gap-3 rounded-xl border border-slate-200 p-3">
          <p class="text-xs text-slate-500">Scan to track on mobile</p>
          <img :src="qrUrl" alt="Track QR" class="h-20 w-20 rounded border border-slate-300 bg-white p-1">
        </div>

        <p class="mt-3 text-xs text-slate-500">Organization: {{ session.currentUser?.organization_id || 'Guest/Unassigned' }}</p>
      </aside>
    </div>

    <footer class="flex flex-col items-center justify-center gap-3 border-t border-slate-200 px-6 py-5 text-sm md:flex-row md:px-8">
      <button
        class="rounded-full border border-blue-300 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
        :disabled="!lastSubmitted"
        @click="downloadReceiptPdf"
      >
        Download Receipt (PDF)
      </button>
      <button class="rounded-full px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100" @click="returnHome">
        Return to Home
      </button>
    </footer>
  </section>
</template>
