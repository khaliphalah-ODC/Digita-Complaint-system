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

const priorityClasses = (priority) => {
  if (priority === 'low') return 'bg-slate-500 text-white';
  if (priority === 'medium') return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
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
    class="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white px-4 py-8 text-center shadow-xl sm:px-6 md:px-8 md:py-10"
  >
    <h1 class="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">Complaint Submission Is User Only</h1>
    <p class="mt-2 text-sm text-slate-600">
      Organization admins review complaints for their organization, and super admins manage organizations only.
    </p>
    <button
      class="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
      @click="returnHome"
    >
      Return to Dashboard
    </button>
  </section>

  <section v-else class="w-full rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-xl">
    <header class="rounded-t-3xl border-b border-slate-200 bg-slate-100/70 px-4 py-5 sm:px-6 md:px-8 md:py-6">
      <h1 class="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">How can we help you today?</h1>
      <p class="mt-1 text-sm text-slate-600">
        {{ complaintAudienceDescription }}
      </p>
    </header>

    <div class="grid grid-cols-1 gap-5 px-4 py-5 sm:px-6 md:px-8 xl:grid-cols-[1.2fr,0.9fr] xl:items-start">
      <form class="space-y-4" @submit.prevent="submitComplaint">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Complaint Type</p>
          <p class="mt-1 text-sm font-semibold text-slate-800">{{ complaintAudienceLabel }}</p>
          <p class="mt-1 text-xs text-slate-500">{{ complaintAudienceDescription }}</p>
        </div>

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

        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label class="mb-1 block text-xs font-semibold text-slate-700">Route to organization</label>

          <div v-if="hasOrganization" class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            This organization-linked complaint will go directly to your organization:
            <span class="font-semibold">{{ routeSummary }}</span>
          </div>

          <template v-else>
            <select
              v-model="form.organization_id"
              :disabled="form.unknown_organization || loadingOrganizations"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            >
              <option value="">Select organization</option>
              <option v-for="organization in organizationOptions" :key="organization.organization_id" :value="organization.organization_id">
                {{ organization.name }}{{ organization.organization_type ? ` - ${organization.organization_type}` : '' }}
              </option>
            </select>

            <label class="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                v-model="form.unknown_organization"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                @change="handleUnknownOrganizationToggle"
              >
              I don't know the correct organization
            </label>

            <p class="mt-2 text-xs text-slate-500">
              Choose the business or organization if you know it. Use triage only when you are not sure where the complaint belongs.
            </p>
            <p v-if="loadingOrganizations" class="mt-1 text-xs text-slate-500">Loading organizations...</p>
          </template>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label class="mb-1 block text-xs font-semibold text-slate-700">Department</label>
          <select
            v-model="form.department_id"
            :disabled="!selectedOrganizationId || loadingDepartments || departmentOptions.length === 0"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
          >
            <option value="">Select department (optional)</option>
            <option v-for="department in departmentOptions" :key="department.id" :value="department.id">
              {{ department.name }}
            </option>
          </select>
          <p class="mt-2 text-xs text-slate-500">
            Select the department involved inside the chosen organization if you know it.
          </p>
          <p v-if="loadingDepartments" class="mt-1 text-xs text-slate-500">Loading departments...</p>
          <p v-else-if="selectedOrganizationId && departmentOptions.length === 0" class="mt-1 text-xs text-slate-500">
            No departments are available for this organization yet.
          </p>
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

        <p v-if="namedComplaintNeedsLogin" class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Sign in to submit a named complaint, or switch on anonymous mode if you do not want to log in.
        </p>

        <p v-if="formError" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>

        <button
          type="submit"
          :disabled="submitting || namedComplaintNeedsLogin"
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

        <div class="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr,auto] sm:items-center">
          <p class="text-xs text-slate-500">Scan to track on mobile</p>
          <img :src="qrUrl" alt="Track QR" class="h-20 w-20 rounded border border-slate-300 bg-white p-1">
        </div>

        <p class="mt-3 text-xs text-slate-500">Route: {{ routeSummary }}</p>
        <p class="mt-1 text-xs text-slate-500">
          Type: {{ complaintAudienceLabel }}
        </p>
        <p class="mt-1 text-xs text-slate-500">
          Department:
          {{ departmentOptions.find((department) => String(department.id) === String(form.department_id))?.name || 'Not selected' }}
        </p>
      </aside>
    </div>

    <footer class="flex flex-col items-stretch justify-center gap-3 border-t border-slate-200 px-4 py-5 text-sm sm:flex-row sm:items-center sm:px-6 md:px-8">
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
