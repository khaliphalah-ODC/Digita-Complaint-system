<script setup>
import { onMounted, reactive, ref } from 'vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import FormField from '../../components/ui/FormField.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { extractApiError, publicFeedbackApi, settingsApi } from '../../services/api';

const MAX_IMAGE_FILE_SIZE_BYTES = 1024 * 1024 * 2;
const loading = ref(false);
const savingOrg = ref(false);
const savingFeedback = ref(false);
const error = ref('');
const success = ref('');
const orgPayload = ref(null);
const feedbackPayload = ref(null);
const qrPayload = ref(null);
const orgImageError = ref('');

const orgForm = reactive({
  name: '',
  organization_type: '',
  email: '',
  phone: '',
  address: '',
  logo: '',
  description: '',
  anonymous_complaints_enabled: true,
  default_department_id: '',
  auto_route_to_department: false,
  escalation_threshold_hours: 72,
  response_sla_hours: 48,
  notify_on_new_complaints: true,
  notify_on_public_feedback: true,
  notify_on_escalations: true,
  allow_org_admin_user_management: true,
  self_signup_enabled: true
});

const feedbackForm = reactive({
  title: '',
  description: '',
  is_public: true,
  is_active: true,
  allow_anonymous: true
});

const hydrateOrgForm = (payload) => {
  orgPayload.value = payload;
  orgForm.name = payload?.organization?.name || '';
  orgForm.organization_type = payload?.organization?.organization_type || '';
  orgForm.email = payload?.organization?.email || '';
  orgForm.phone = payload?.organization?.phone || '';
  orgForm.address = payload?.organization?.address || '';
  orgForm.logo = payload?.organization?.logo || '';
  orgForm.description = payload?.organization?.description || '';
  orgForm.self_signup_enabled = Boolean(payload?.organization?.self_signup_enabled);
  orgForm.anonymous_complaints_enabled = Boolean(payload?.workflow?.anonymous_complaints_enabled);
  orgForm.default_department_id = payload?.workflow?.default_department_id ?? '';
  orgForm.auto_route_to_department = Boolean(payload?.workflow?.auto_route_to_department);
  orgForm.escalation_threshold_hours = Number(payload?.workflow?.escalation_threshold_hours || 72);
  orgForm.response_sla_hours = Number(payload?.workflow?.response_sla_hours || 48);
  orgForm.notify_on_new_complaints = Boolean(payload?.notifications?.notify_on_new_complaints);
  orgForm.notify_on_public_feedback = Boolean(payload?.notifications?.notify_on_public_feedback);
  orgForm.notify_on_escalations = Boolean(payload?.notifications?.notify_on_escalations);
  orgForm.allow_org_admin_user_management = Boolean(payload?.access_controls?.allow_org_admin_user_management);
};

const hydrateFeedbackForm = (payload) => {
  feedbackPayload.value = payload;
  feedbackForm.title = payload?.title || '';
  feedbackForm.description = payload?.description || '';
  feedbackForm.is_public = Boolean(payload?.is_public);
  feedbackForm.is_active = Boolean(payload?.is_active);
  feedbackForm.allow_anonymous = Boolean(payload?.allow_anonymous);
};

const loadPage = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';
  orgImageError.value = '';
  try {
    const [orgSettings, managedFeedback, qr] = await Promise.all([
      settingsApi.getOrganizationCurrent(),
      publicFeedbackApi.getManagedForm(),
      publicFeedbackApi.getQr()
    ]);
    hydrateOrgForm(orgSettings);
    hydrateFeedbackForm(managedFeedback);
    qrPayload.value = qr;
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load organization settings');
  } finally {
    loading.value = false;
  }
};

const onOrgLogoFileChange = (event) => {
  orgImageError.value = '';
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    orgImageError.value = 'Please select an image file.';
    return;
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    orgImageError.value = 'Image is too large. Maximum allowed size is 2MB.';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    orgForm.logo = String(reader.result || '');
  };
  reader.onerror = () => {
    orgImageError.value = 'Failed to read image file.';
  };
  reader.readAsDataURL(file);
};

const saveOrganizationSettings = async () => {
  savingOrg.value = true;
  error.value = '';
  success.value = '';
  orgImageError.value = '';
  try {
    if (orgForm.logo && orgForm.logo.startsWith('data:') && orgForm.logo.length > MAX_IMAGE_FILE_SIZE_BYTES * 1.4) {
      throw new Error('Logo data is too large. Use a smaller image or a hosted URL.');
    }

    const response = await settingsApi.updateOrganizationCurrent({
      organization: {
        name: orgForm.name,
        organization_type: orgForm.organization_type,
        email: orgForm.email,
        phone: orgForm.phone,
        address: orgForm.address,
        logo: orgForm.logo,
        description: orgForm.description
      },
      workflow: {
        anonymous_complaints_enabled: orgForm.anonymous_complaints_enabled,
        default_department_id: orgForm.default_department_id || null,
        auto_route_to_department: orgForm.auto_route_to_department,
        escalation_threshold_hours: Number(orgForm.escalation_threshold_hours),
        response_sla_hours: Number(orgForm.response_sla_hours)
      },
      notifications: {
        notify_on_new_complaints: orgForm.notify_on_new_complaints,
        notify_on_public_feedback: orgForm.notify_on_public_feedback,
        notify_on_escalations: orgForm.notify_on_escalations
      },
      access_controls: {
        allow_org_admin_user_management: orgForm.allow_org_admin_user_management
      }
    });
    hydrateOrgForm(response);
    success.value = 'Organization settings updated successfully.';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save organization settings');
  } finally {
    savingOrg.value = false;
  }
};

const saveFeedbackSettings = async () => {
  savingFeedback.value = true;
  error.value = '';
  success.value = '';
  try {
    const [feedbackResponse, refreshedQr] = await Promise.all([
      publicFeedbackApi.updateManagedForm({
        title: feedbackForm.title,
        description: feedbackForm.description,
        is_public: feedbackForm.is_public,
        is_active: feedbackForm.is_active,
        allow_anonymous: feedbackForm.allow_anonymous
      }),
      publicFeedbackApi.getQr()
    ]);
    hydrateFeedbackForm(feedbackResponse);
    qrPayload.value = refreshedQr;
    success.value = 'Public feedback and QR settings updated successfully.';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save public feedback settings');
  } finally {
    savingFeedback.value = false;
  }
};

onMounted(loadPage);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <PageHeader
          kicker="Org Admin Settings"
          title="Organization Settings"
          description="Manage organization profile details, complaint workflow defaults, public feedback access, notification behavior, and team-level access controls for your organization only."
        />

        <LoadingSpinner v-if="loading" label="Loading organization settings..." />
        <ErrorState v-else-if="error && !orgPayload" title="Unable to load organization settings" :description="error" />

        <template v-else>
          <ErrorState v-if="error" title="Action failed" :description="error" />

          <div
            v-if="success"
            class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"
          >
            {{ success }}
          </div>

          <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr),minmax(320px,0.8fr)]">
            <section class="space-y-4">
              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Organization Profile</p>
                  <h2 class="app-section-title">Core Organization Details</h2>
                  <p class="app-section-description">Control the name, contact information, brand details, and descriptive context used for your organization.</p>
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField v-model="orgForm.name" label="Organization Name" />
                  <FormField v-model="orgForm.organization_type" label="Organization Type" />
                  <FormField v-model="orgForm.email" label="Contact Email" type="email" />
                  <FormField v-model="orgForm.phone" label="Phone" />
                  <FormField v-model="orgForm.address" label="Address" wrapper-class="md:col-span-2" />
                  <FormField v-model="orgForm.description" as="textarea" label="Description" wrapper-class="md:col-span-2" :rows="4" />
                </div>

                <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[140px,minmax(0,1fr)]">
                  <div class="flex h-32 w-32 items-center justify-center rounded-[24px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] text-lg font-semibold text-[var(--app-primary)]">
                    <img v-if="orgForm.logo" :src="orgForm.logo" alt="Organization logo preview" class="h-32 w-32 rounded-[24px] object-cover">
                    <span v-else>ORG</span>
                  </div>

                  <div class="space-y-3">
                    <label class="flex flex-col gap-2">
                      <span class="text-sm font-medium text-[var(--app-title-color)]">Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        class="w-full rounded-xl border border-[var(--app-line)] bg-white px-4 py-3 text-sm text-slate-900 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--app-surface-soft)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 focus:border-[var(--app-primary)]"
                        @change="onOrgLogoFileChange"
                      >
                    </label>
                    <FormField
                      v-model="orgForm.logo"
                      label="Logo URL"
                      wrapper-class="md:col-span-2"
                      help="You can upload an image or paste a hosted image URL."
                    />
                    <p v-if="orgImageError" class="text-sm text-red-600">{{ orgImageError }}</p>
                  </div>
                </div>
              </section>

              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Complaint Workflow</p>
                  <h2 class="app-section-title">Routing and Response Defaults</h2>
                  <p class="app-section-description">Set the complaint handling defaults that apply across your organization workflow.</p>
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    v-model="orgForm.default_department_id"
                    as="select"
                    label="Default Department"
                    :options="[
                      { value: '', label: 'No default routing' },
                      ...((orgPayload?.departments || []).map((department) => ({ value: department.id, label: department.name })))
                    ]"
                  />
                  <FormField v-model="orgForm.escalation_threshold_hours" type="number" label="Escalation Threshold (Hours)" />
                  <FormField v-model="orgForm.response_sla_hours" type="number" label="Response SLA (Hours)" />
                </div>

                <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="orgForm.anonymous_complaints_enabled" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Anonymous Complaints</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Allow anonymous complaint submission.</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="orgForm.auto_route_to_department" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Auto Route</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Apply default department routing automatically.</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="orgForm.self_signup_enabled" type="checkbox" disabled class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Self Signup</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Managed centrally for the organization record.</p>
                    </div>
                  </label>
                </div>
              </section>

              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Notification Preferences</p>
                  <h2 class="app-section-title">Org Notification Toggles</h2>
                  <p class="app-section-description">Decide which organization-level events should surface as operational notifications.</p>
                </div>

                <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="orgForm.notify_on_new_complaints" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">New Complaints</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Notify team leads when complaints are filed.</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="orgForm.notify_on_public_feedback" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Public Feedback</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Notify when new public feedback arrives.</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="orgForm.notify_on_escalations" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Escalations</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Notify when complaints cross escalation thresholds.</p>
                    </div>
                  </label>
                </div>
              </section>

              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Team and Access</p>
                  <h2 class="app-section-title">Team Management Controls</h2>
                  <p class="app-section-description">Keep organization-level team administration separate from personal user preferences.</p>
                </div>

                <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                  <input v-model="orgForm.allow_org_admin_user_management" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                  <div>
                    <p class="text-sm font-semibold text-[var(--app-title-color)]">Allow Org-Admin User Management</p>
                    <p class="mt-1 text-xs text-[var(--app-muted-color)]">Keep team management enabled for org-admin within this organization.</p>
                  </div>
                </label>
              </section>

              <div class="flex justify-end">
                <button class="app-btn-primary" :disabled="savingOrg" @click="saveOrganizationSettings">
                  {{ savingOrg ? 'Saving...' : 'Save Organization Settings' }}
                </button>
              </div>
            </section>

            <section class="space-y-4">
              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Public Feedback / QR</p>
                  <h2 class="app-section-title">Feedback Channel Settings</h2>
                  <p class="app-section-description">Manage the public feedback title, description, publish state, and QR-accessible link for this organization.</p>
                </div>

                <div class="space-y-4">
                  <FormField v-model="feedbackForm.title" label="Public Feedback Title" />
                  <FormField v-model="feedbackForm.description" as="textarea" label="Public Feedback Description" :rows="4" />
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                  <StatusBadge :value="feedbackForm.is_public ? 'Public' : 'Private'" :tone="feedbackForm.is_public ? 'success' : 'neutral'" />
                  <StatusBadge :value="feedbackForm.is_active ? 'Active' : 'Inactive'" :tone="feedbackForm.is_active ? 'success' : 'warning'" />
                  <StatusBadge :value="feedbackForm.allow_anonymous ? 'Anonymous Enabled' : 'Anonymous Disabled'" tone="neutral" />
                </div>

                <div class="mt-4 grid grid-cols-1 gap-3">
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="feedbackForm.is_public" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Public Link Enabled</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Allow the public form page to be discoverable through the slug route and QR code.</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="feedbackForm.is_active" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Accept Responses</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Pause or resume public feedback submissions without removing the QR code.</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="feedbackForm.allow_anonymous" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Anonymous Feedback</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Allow public respondents to hide their identity fields.</p>
                    </div>
                  </label>
                </div>

                <div class="mt-5 rounded-[22px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Public Feedback URL</p>
                  <p class="mt-2 break-all text-sm font-medium text-[var(--app-title-color)]">{{ qrPayload?.public_url || orgPayload?.public_feedback?.public_url || 'Not available' }}</p>
                  <img
                    v-if="qrPayload?.qr_url"
                    :src="qrPayload.qr_url"
                    alt="Feedback QR code"
                    class="mt-4 h-40 w-40 rounded-[20px] border border-[var(--app-line)] bg-white p-3"
                  >
                </div>

                <div class="mt-5 flex justify-end">
                  <button class="app-btn-primary" :disabled="savingFeedback" @click="saveFeedbackSettings">
                    {{ savingFeedback ? 'Saving...' : 'Save Feedback Settings' }}
                  </button>
                </div>
              </section>
            </section>
          </section>
        </template>
      </div>
    </div>
  </section>
</template>
