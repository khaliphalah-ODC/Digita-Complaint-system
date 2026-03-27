<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session.js';
import { useComplaintStore } from '../stores/complaint.js';
import api, { extractApiError, unwrapResponse } from '../services/api.js';

const router = useRouter();
const session = useSessionStore();
const complaintStore = useComplaintStore();

const submitting = ref(false);
const formError = ref('');
const lastSubmitted = ref(null);
const organizationOptions = ref([]);
const loadingOrganizations = ref(false);
const departmentOptions = ref([]);
const loadingDepartments = ref(false);

const categorySuggestions = ['Infrastructure', 'Sanitation', 'Billing', 'Security', 'Health'];
const priorityOptions = ['low', 'medium', 'urgent'];

const form = reactive({
  title: '',
  category: '',
  complaint: '',
  priority: 'medium',
  is_anonymous: false,
  anonymous_label: '',
  organization_id: '',
  department_id: '',
  unknown_organization: false
});

const hasOrganization = computed(() => Boolean(session.currentUser?.organization_id));
const isGuestUser = computed(() => !session.currentUser?.id);
const isOrganizationMemberUser = computed(() => session.currentUser?.role === 'user' && hasOrganization.value);
const complaintAudienceLabel = computed(() => (isOrganizationMemberUser.value ? 'Organization Member Complaint' : 'Public Complaint'));
const complaintAudienceDescription = computed(() => {
  if (isOrganizationMemberUser.value) {
    return 'Your complaint is treated as an organization-linked report and routes into your organization with an optional department selection.';
  }
  return 'Your complaint is treated as a public complaint and must be routed to a specific organization, unless you explicitly send it to platform triage.';
});
const namedComplaintNeedsLogin = computed(() => isGuestUser.value && !form.is_anonymous);
const organizationSelectionRequired = computed(
  () => !hasOrganization.value && !form.unknown_organization && !form.organization_id
);
const activeTrackingCode = computed(() => lastSubmitted.value?.tracking_code || 'TRK-000-000');
const selectedOrganization = computed(() =>
  organizationOptions.value.find((organization) => Number(organization.organization_id) === Number(form.organization_id)) || null
);
const currentUserOrganization = computed(() =>
  organizationOptions.value.find(
    (organization) => Number(organization.organization_id) === Number(session.currentUser?.organization_id)
  ) || null
);
const routeSummary = computed(() => {
  if (hasOrganization.value) {
    return currentUserOrganization.value?.name || `Organization #${session.currentUser?.organization_id}`;
  }
  if (form.unknown_organization) {
    return 'Platform triage (unassigned)';
  }
  return selectedOrganization.value?.name || 'Select organization';
});
const selectedOrganizationId = computed(() => {
  if (hasOrganization.value) {
    return Number(session.currentUser?.organization_id || 0) || null;
  }
  if (form.unknown_organization || !form.organization_id) {
    return null;
  }
  return Number(form.organization_id);
});

const qrUrl = computed(() => {
  const trackUrl = `${window.location.origin}/track-complaint?code=${encodeURIComponent(activeTrackingCode.value)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(trackUrl)}`;
});
const isAdminFamily = computed(() => ['super_admin', 'org_admin'].includes(session.currentUser?.role || ''));
const isUserWorkspace = computed(() => session.currentUser?.role === 'user');
const shellClass = computed(() => (isUserWorkspace.value ? 'user-shell-panel w-full rounded-[30px]' : 'app-shell-panel w-full rounded-[30px]'));
const heroClass = computed(() => (
  isUserWorkspace.value
    ? 'rounded-t-[30px] border-b border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-5 sm:px-6 md:px-8 md:py-6'
    : 'rounded-t-[30px] border-b border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-5 sm:px-6 md:px-8 md:py-6'
));
const heroTitleClass = computed(() => (isUserWorkspace.value ? 'text-3xl font-semibold tracking-tight text-[var(--app-primary-ink)] sm:text-4xl' : 'text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl'));
const bodyTextClass = computed(() => (isUserWorkspace.value ? 'text-[var(--app-muted-color)]' : 'text-slate-600'));
const cardClass = computed(() => (isUserWorkspace.value ? 'user-shell-card rounded-[24px] p-4' : 'app-ink-card rounded-[24px] p-4'));
const compactCardClass = computed(() => (isUserWorkspace.value ? 'user-shell-card rounded-[24px] px-4 py-3' : 'app-ink-card rounded-[24px] px-4 py-3'));
const fieldClass = computed(() => (
  isUserWorkspace.value
    ? 'app-input text-[var(--app-primary-ink)]'
    : 'app-input'
));
const ghostChipClass = computed(() => (
  isUserWorkspace.value
    ? 'app-badge app-badge-neutral'
    : 'app-badge app-badge-neutral'
));
const inactivePriorityClass = computed(() => (isUserWorkspace.value ? 'bg-[var(--app-primary-mist)] text-[var(--app-primary-ink)]' : 'bg-slate-100 text-slate-700'));
const infoPanelClass = computed(() => (
  isUserWorkspace.value
    ? 'rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-3 text-sm text-[var(--app-primary-ink)]'
    : 'rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-3 text-sm text-[var(--app-primary-ink)]'
));
const submitButtonClass = computed(() => (
  'w-full rounded-xl bg-[linear-gradient(90deg,#163462_0%,#1f4db7_58%,#4f8df7_100%)] px-6 py-3 text-sm font-bold text-white shadow-[var(--app-shadow-sm)] hover:brightness-110 disabled:opacity-60 sm:w-auto'
));
const footerActionClass = computed(() => (
  'w-full rounded-full border border-blue-300 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60 sm:w-auto'
));
const footerSecondaryActionClass = computed(() => (
  'w-full rounded-full px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto'
));

const priorityClasses = (priority) => {
  if (priority === 'low') return 'bg-slate-500 text-white';
  if (priority === 'medium') return 'bg-[var(--app-accent-soft)] text-[var(--app-primary-ink)]';
  return 'bg-[var(--app-primary)] text-white';
};

const applyOrganizationDefaults = () => {
  form.organization_id = hasOrganization.value ? String(session.currentUser.organization_id) : '';
  form.department_id = session.currentUser?.department_id ? String(session.currentUser.department_id) : '';
  form.unknown_organization = false;
};

const resetForm = () => {
  form.title = '';
  form.category = '';
  form.complaint = '';
  form.priority = 'medium';
  form.is_anonymous = false;
  form.anonymous_label = '';
  applyOrganizationDefaults();
};

const handleUnknownOrganizationToggle = () => {
  if (form.unknown_organization) {
    form.organization_id = '';
    form.department_id = '';
    departmentOptions.value = [];
  }
};

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) {
    throw new Error(payload?.message || fallbackMessage);
  }
  return payload.data;
};

const fetchOrganizationOptions = async () => {
  loadingOrganizations.value = true;
  try {
    const response = await api.get('/public/organizations', { skipAuth: true });
    organizationOptions.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch organizations') || [];
  } catch (error) {
    organizationOptions.value = [];
    if (!formError.value) {
      formError.value = extractApiError(error, 'Failed to fetch organizations');
    }
  } finally {
    loadingOrganizations.value = false;
  }
};

const fetchDepartmentOptions = async (organizationId) => {
  if (!organizationId) {
    departmentOptions.value = [];
    form.department_id = '';
    return;
  }

  loadingDepartments.value = true;
  try {
    const response = await api.get(`/public/organizations/${organizationId}/departments`, { skipAuth: true });
    const rows = ensureSuccess(unwrapResponse(response), 'Failed to fetch departments') || [];
    departmentOptions.value = rows;

    if (!rows.some((department) => String(department.id) === String(form.department_id))) {
      form.department_id = '';
    }
  } catch (error) {
    departmentOptions.value = [];
    form.department_id = '';
    if (!formError.value) {
      formError.value = extractApiError(error, 'Failed to fetch departments');
    }
  } finally {
    loadingDepartments.value = false;
  }
};

const submitComplaint = async () => {
  formError.value = '';

  if (namedComplaintNeedsLogin.value) {
    formError.value = 'Sign in to submit a named complaint, or switch on anonymous mode.';
    return;
  }
  if (!form.title.trim() || !form.complaint.trim()) {
    formError.value = 'Complaint title and description are required.';
    return;
  }
  if (organizationSelectionRequired.value) {
    formError.value = 'Select the organization this complaint belongs to, or choose the triage option if you are not sure.';
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
      anonymous_label: form.is_anonymous ? (form.anonymous_label.trim() || 'Guest Citizen') : null,
      organization_id: hasOrganization.value
        ? Number(session.currentUser.organization_id)
        : (form.unknown_organization ? null : Number(form.organization_id)),
      department_id: form.department_id ? Number(form.department_id) : null,
      unknown_organization: !hasOrganization.value && form.unknown_organization
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
  <body style="font-family: 'Times New Roman', Times, serif; padding: 24px;">
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
  if (session.currentUser?.role === 'super_admin') {
    router.push('/admin/dashboard');
    return;
  }
  if (session.currentUser?.role === 'org_admin') {
    router.push('/org-admin/dashboard');
    return;
  }
  router.push('/');
};

const goToSignIn = () => {
  router.push('/signin');
};

onMounted(() => {
  if (session.currentUser?.role === 'super_admin') {
    router.replace('/admin/dashboard');
    return;
  }
  if (session.currentUser?.role === 'org_admin') {
    router.replace('/org-admin/dashboard');
    return;
  }
  applyOrganizationDefaults();
  fetchOrganizationOptions();
});

watch(selectedOrganizationId, (organizationId) => {
  fetchDepartmentOptions(organizationId);
}, { immediate: true });
</script>

<template>
  <section
    v-if="isAdminFamily"
    class="app-shell-panel mx-auto w-full max-w-5xl rounded-[30px] px-4 py-8 text-center sm:px-6 md:px-8 md:py-10"
  >
    <h1 class="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">Complaint Submission Is User Only</h1>
    <p class="mt-2 text-sm text-slate-600">
      Organization admins review complaints for their organization, and super admins manage organizations only.
    </p>
    <button
      class="mt-5 rounded-full bg-[var(--app-primary)] px-5 py-3 text-sm font-bold text-white"
      @click="returnHome"
    >
      Return to Dashboard
    </button>
  </section>

  <section
    v-else-if="isGuestUser"
    class="app-shell-panel mx-auto w-full max-w-5xl rounded-[30px] px-4 py-8 text-center sm:px-6 md:px-8 md:py-10"
  >
    <h1 class="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">Sign In To Submit A Complaint</h1>
    <p class="mt-2 text-sm text-slate-600">
      Complaint submission is available to signed-in users only. Sign in to continue, or track an existing complaint.
    </p>
    <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
      <button
        class="rounded-full bg-[var(--app-primary)] px-5 py-3 text-sm font-bold text-white"
        @click="goToSignIn"
      >
        Sign In
      </button>
      <button
        class="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        @click="returnHome"
      >
        Return Home
      </button>
    </div>
  </section>

  <section v-else :class="shellClass">
    <header :class="heroClass">
      <h1 :class="heroTitleClass">How can we help you today?</h1>
      <p :class="`mt-1 text-sm ${bodyTextClass}`">
        {{ complaintAudienceDescription }}
      </p>
    </header>

    <div class="grid grid-cols-1 gap-5 px-4 py-5 sm:px-6 md:px-8 xl:grid-cols-[1.2fr,0.9fr] xl:items-start">
      <form class="space-y-4 min-w-0" @submit.prevent="submitComplaint">
        <div :class="compactCardClass">
          <p class="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted-color)]">Complaint Type</p>
          <p class="mt-1 text-sm font-semibold text-[var(--app-primary-ink)]">{{ complaintAudienceLabel }}</p>
          <p class="mt-1 text-xs text-[var(--app-muted-color)]">{{ complaintAudienceDescription }}</p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-semibold text-[var(--app-primary-ink)]">Complaint Title</label>
          <input
            v-model="form.title"
            placeholder="e.g. Broken streetlight on 5th Ave"
            :class="fieldClass"
          >
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-semibold text-[var(--app-primary-ink)]">Category</label>
            <input
              v-model="form.category"
              placeholder="Infrastructure, Sanitation, Billing"
              :class="fieldClass"
            >
            <div class="app-action-row mt-2 flex flex-wrap gap-2">
              <button
                v-for="category in categorySuggestions"
                :key="category"
                type="button"
                :class="ghostChipClass"
                @click="form.category = category"
              >
                {{ category }}
              </button>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-[var(--app-primary-ink)]">Priority</label>
            <div class="app-action-row flex flex-wrap gap-2">
              <button
                v-for="priority in priorityOptions"
                :key="priority"
                type="button"
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="form.priority === priority ? priorityClasses(priority) : inactivePriorityClass"
                @click="form.priority = priority"
              >
                {{ priority }}
              </button>
            </div>
          </div>
        </div>

        <div :class="cardClass">
          <label class="mb-1 block text-xs font-semibold text-[var(--app-primary-ink)]">Route to organization</label>

          <div v-if="hasOrganization" :class="infoPanelClass">
            This organization-linked complaint will go directly to your organization:
            <span class="font-semibold">{{ routeSummary }}</span>
          </div>

          <template v-else>
            <select
              v-model="form.organization_id"
              :disabled="form.unknown_organization || loadingOrganizations"
              :class="`${fieldClass} disabled:bg-slate-100`"
            >
              <option value="">Select organization</option>
              <option v-for="organization in organizationOptions" :key="organization.organization_id" :value="organization.organization_id">
                {{ organization.name }}{{ organization.organization_type ? ` - ${organization.organization_type}` : '' }}
              </option>
            </select>

            <label class="mt-3 inline-flex items-center gap-2 text-sm text-[var(--app-primary-ink)]">
              <input
                v-model="form.unknown_organization"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                @change="handleUnknownOrganizationToggle"
              >
              I don't know the correct organization
            </label>

            <p class="mt-2 text-xs text-[var(--app-muted-color)]">
              Choose the business or organization if you know it. Use triage only when you are not sure where the complaint belongs.
            </p>
            <p v-if="loadingOrganizations" class="mt-1 text-xs text-[var(--app-muted-color)]">Loading organizations...</p>
          </template>
        </div>

        <div :class="cardClass">
          <label class="mb-1 block text-xs font-semibold text-[var(--app-primary-ink)]">Department</label>
          <select
            v-model="form.department_id"
            :disabled="!selectedOrganizationId || loadingDepartments || departmentOptions.length === 0"
            :class="`${fieldClass} disabled:bg-slate-100`"
          >
            <option value="">Select department (optional)</option>
            <option v-for="department in departmentOptions" :key="department.id" :value="department.id">
              {{ department.name }}
            </option>
          </select>
          <p class="mt-2 text-xs text-[var(--app-muted-color)]">
            Select the department involved inside the chosen organization if you know it.
          </p>
          <p v-if="loadingDepartments" class="mt-1 text-xs text-[var(--app-muted-color)]">Loading departments...</p>
          <p v-else-if="selectedOrganizationId && departmentOptions.length === 0" class="mt-1 text-xs text-[var(--app-muted-color)]">
            No departments are available for this organization yet.
          </p>
        </div>

        <div>
          <label class="mb-1 block text-xs font-semibold text-[var(--app-primary-ink)]">Description</label>
          <textarea
            v-model="form.complaint"
            rows="4"
            placeholder="Describe the issue in detail"
            :class="fieldClass"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs font-semibold text-[var(--app-primary-ink)]">Submit as anonymous</label>
          <input
            v-if="form.is_anonymous"
            v-model="form.anonymous_label"
            placeholder="Guest Name (optional)"
            :class="`mb-2 ${fieldClass}`"
          >
          <label class="inline-flex items-center gap-2 text-sm text-[var(--app-primary-ink)]">
            <span class="relative inline-flex h-6 w-11 items-center rounded-full" :class="form.is_anonymous ? 'bg-blue-500' : 'bg-slate-300'">
              <input v-model="form.is_anonymous" type="checkbox" class="peer sr-only">
              <span class="inline-block h-5 w-5 transform rounded-full bg-white transition" :class="form.is_anonymous ? 'translate-x-5' : 'translate-x-1'"></span>
            </span>
            Submit as anonymous (Anonymous Form)
          </label>
        </div>

        <p v-if="namedComplaintNeedsLogin" class="rounded-2xl border border-[var(--app-accent-soft)] bg-[var(--app-primary-mist)] px-3 py-2 text-sm text-[var(--app-primary-ink)]">
          Sign in to submit a named complaint, or switch on anonymous mode if you do not want to log in.
        </p>

        <p v-if="formError" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>

        <button
          type="submit"
          :disabled="submitting || namedComplaintNeedsLogin"
          :class="submitButtonClass"
        >
          {{ submitting ? 'Submitting...' : 'Submit Complaint' }}
        </button>
      </form>

      <aside :class="`${cardClass} min-w-0`">
        <div :class="isUserWorkspace ? 'rounded-[22px] border border-[#d2e0f8] bg-[#dfeaff] p-4 text-center' : 'rounded-[22px] border border-slate-200 bg-[var(--app-primary-mist)] p-4 text-center'">
          <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-primary)] text-xl font-black text-white">✓</div>
          <p class="mt-2 text-sm font-semibold text-[var(--app-primary-ink)]">Thank you for your feedback!</p>
          <div class="mt-3 break-all rounded-2xl border border-[var(--app-accent-soft)] bg-white px-3 py-2 text-base font-black tracking-wide text-[var(--app-primary-ink)] sm:text-lg">
            {{ activeTrackingCode }}
          </div>
        </div>

        <div :class="isUserWorkspace ? 'mt-4 grid grid-cols-1 gap-3 rounded-xl border border-[#d2e0f8] bg-white/70 p-3 sm:grid-cols-[1fr,auto] sm:items-center' : 'mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr,auto] sm:items-center'">
          <p class="text-xs leading-5 text-[var(--app-muted-color)]">Scan to track on mobile</p>
          <img :src="qrUrl" alt="Track QR" class="h-20 w-20 rounded border border-slate-300 bg-white p-1">
        </div>

        <p class="mt-3 break-words text-xs leading-5 text-[var(--app-muted-color)]">Route: {{ routeSummary }}</p>
        <p class="mt-1 text-xs leading-5 text-[var(--app-muted-color)]">
          Type: {{ complaintAudienceLabel }}
        </p>
        <p class="mt-1 break-words text-xs leading-5 text-[var(--app-muted-color)]">
          Department:
          {{ departmentOptions.find((department) => String(department.id) === String(form.department_id))?.name || 'Not selected' }}
        </p>
      </aside>
    </div>

    <footer class="flex flex-col items-stretch justify-center gap-3 border-t border-slate-200 px-4 py-5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:px-6 md:px-8">
      <button
        :class="footerActionClass"
        :disabled="!lastSubmitted"
        @click="downloadReceiptPdf"
      >
        Download Receipt (PDF)
      </button>
      <button :class="footerSecondaryActionClass" @click="returnHome">
        Return to Home
      </button>
    </footer>
  </section>
</template>
