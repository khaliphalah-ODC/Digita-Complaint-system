<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import DataTable from '../../components/ui/DataTable.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import FormField from '../../components/ui/FormField.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { extractApiError, publicFeedbackApi } from '../../services/api';
import {
  attachFieldDrafts,
  buildPublishWorkflow,
  createFieldDraft,
  parseFieldOptions,
  reorderItemsByDrag
} from '../../services/public-feedback-builder.service.js';

const router = useRouter();
const loading = ref(false);
const savingForm = ref(false);
const creatingField = ref(false);
const error = ref('');
const actionMessage = ref('');
const formModel = ref(null);
const qrPayload = ref(null);
const submissionRows = ref([]);
const submissionPage = ref(1);
const submissionPagination = ref({
  page: 1,
  page_size: 10,
  total_items: 0,
  total_pages: 1
});
const submissionFilters = reactive({
  search: '',
  anonymous: 'all',
  rating: 0
});
const draggingFieldId = ref(null);
const expandedFieldId = ref(null);

const formState = reactive({
  title: '',
  description: '',
  is_public: true,
  is_active: true,
  allow_anonymous: true
});

const newField = reactive({
  label: '',
  field_key: '',
  field_type: 'short_text',
  placeholder: '',
  help_text: '',
  is_required: false,
  is_active: true,
  optionsText: ''
});

const fieldTypeOptions = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'rating', label: 'Rating' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'yes_no', label: 'Yes / No' }
];

const setFormState = (payload) => {
  formModel.value = payload;
  formState.title = payload?.title || '';
  formState.description = payload?.description || '';
  formState.is_public = Boolean(payload?.is_public);
  formState.is_active = Boolean(payload?.is_active);
  formState.allow_anonymous = Boolean(payload?.allow_anonymous);
};

const resetNewField = () => {
  newField.label = '';
  newField.field_key = '';
  newField.field_type = 'short_text';
  newField.placeholder = '';
  newField.help_text = '';
  newField.is_required = false;
  newField.is_active = true;
  newField.optionsText = '';
};

const syncFieldDraft = (field) => {
  if (!field._draft) {
    field._draft = createFieldDraft(field);
  }
  return field._draft;
};

const hydrateFormFields = (payload) => {
  formModel.value.fields = attachFieldDrafts(payload?.fields || []);
  const currentFields = formModel.value.fields || [];
  if (!currentFields.length) {
    expandedFieldId.value = null;
    return;
  }

  const hasExpandedField = currentFields.some((field) => Number(field.id) === Number(expandedFieldId.value));
  if (!hasExpandedField) {
    expandedFieldId.value = currentFields[0].id;
  }
};

const loadSubmissions = async (page = submissionPage.value) => {
  const response = await publicFeedbackApi.listManagedSubmissions({
    page,
    page_size: submissionPagination.value.page_size,
    search: submissionFilters.search || undefined,
    anonymous: submissionFilters.anonymous,
    rating: submissionFilters.rating || undefined
  });
  submissionRows.value = response.items || [];
  submissionPagination.value = response.pagination || submissionPagination.value;
  submissionPage.value = response.pagination?.page || page;
};

const refreshPage = async () => {
  loading.value = true;
  error.value = '';
  actionMessage.value = '';
  try {
    const [formResponse, qrResponse] = await Promise.all([
      publicFeedbackApi.getManagedForm(),
      publicFeedbackApi.getQr()
    ]);
    setFormState(formResponse);
    qrPayload.value = qrResponse;
    hydrateFormFields(formResponse);
    await loadSubmissions(1);
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load public feedback management data');
  } finally {
    loading.value = false;
  }
};

const saveFormSettings = async () => {
  if (!formModel.value) return;
  savingForm.value = true;
  error.value = '';
  actionMessage.value = '';
  try {
    const response = await publicFeedbackApi.updateManagedForm({
      title: formState.title,
      description: formState.description,
      is_public: formState.is_public,
      is_active: formState.is_active,
      allow_anonymous: formState.allow_anonymous
    });
    setFormState(response);
    qrPayload.value = await publicFeedbackApi.getQr();
    hydrateFormFields(response);
    actionMessage.value = 'Feedback form settings updated successfully.';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save feedback form settings');
  } finally {
    savingForm.value = false;
  }
};

const addField = async () => {
  creatingField.value = true;
  error.value = '';
  actionMessage.value = '';
  try {
    const response = await publicFeedbackApi.createField({
      label: newField.label,
      field_key: newField.field_key,
      field_type: newField.field_type,
      placeholder: newField.placeholder,
      help_text: newField.help_text,
      is_required: newField.is_required,
      is_active: newField.is_active,
      options: parseFieldOptions(newField.optionsText)
    });
    setFormState(response);
    hydrateFormFields(response);
    const createdField = [...(response?.fields || [])].sort((a, b) => b.sort_order - a.sort_order)[0];
    expandedFieldId.value = createdField?.id || expandedFieldId.value;
    resetNewField();
    actionMessage.value = 'Feedback field added successfully.';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to add feedback field');
  } finally {
    creatingField.value = false;
  }
};

const saveField = async (field) => {
  const draft = syncFieldDraft(field);
  field._saving = true;
  error.value = '';
  actionMessage.value = '';
  try {
    const response = await publicFeedbackApi.updateField(field.id, {
      label: draft.label,
      field_key: draft.field_key,
      field_type: draft.field_type,
      placeholder: draft.placeholder,
      help_text: draft.help_text,
      is_required: draft.is_required,
      is_active: draft.is_active,
      sort_order: field.sort_order,
      options: parseFieldOptions(draft.optionsText)
    });
    setFormState(response);
    hydrateFormFields(response);
    actionMessage.value = `Saved field "${draft.label}".`;
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save feedback field');
  } finally {
    field._saving = false;
  }
};

const deleteField = async (field) => {
  const confirmed = window.confirm(`Delete the field "${field.label}"?`);
  if (!confirmed) return;

  error.value = '';
  actionMessage.value = '';
  try {
    const response = await publicFeedbackApi.deleteField(field.id);
    setFormState(response);
    hydrateFormFields(response);
    if (Number(expandedFieldId.value) === Number(field.id)) {
      expandedFieldId.value = response?.fields?.[0]?.id || null;
    }
    actionMessage.value = `Deleted field "${field.label}".`;
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete feedback field');
  }
};

const persistFieldOrder = async (reordered) => {
  error.value = '';
  actionMessage.value = '';
  try {
    const response = await publicFeedbackApi.reorderFields(reordered.map((item) => item.id));
    setFormState(response);
    hydrateFormFields(response);
    actionMessage.value = 'Field order updated.';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to reorder fields');
  }
};

const reorderField = async (field, direction) => {
  const currentFields = [...(formModel.value?.fields || [])].sort((a, b) => a.sort_order - b.sort_order);
  const currentIndex = currentFields.findIndex((item) => Number(item.id) === Number(field.id));
  const targetIndex = currentIndex + direction;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= currentFields.length) return;
  const reordered = [...currentFields];
  const [moved] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, moved);
  await persistFieldOrder(reordered);
};

const handleFieldDragStart = (fieldId) => {
  draggingFieldId.value = fieldId;
};

const handleFieldDrop = async (targetFieldId) => {
  if (!draggingFieldId.value || Number(draggingFieldId.value) === Number(targetFieldId)) {
    draggingFieldId.value = null;
    return;
  }

  const reordered = reorderItemsByDrag(orderedFields.value, draggingFieldId.value, targetFieldId);
  draggingFieldId.value = null;
  await persistFieldOrder(reordered);
};

const copyPublicLink = async () => {
  if (!qrPayload.value?.public_url) return;
  error.value = '';
  actionMessage.value = '';
  try {
    await navigator.clipboard.writeText(qrPayload.value.public_url);
    actionMessage.value = 'Public feedback link copied to clipboard.';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to copy public feedback link');
  }
};

const downloadQr = async () => {
  if (!qrPayload.value?.qr_url) return;
  error.value = '';
  actionMessage.value = '';
  try {
    const link = document.createElement('a');
    link.href = qrPayload.value.qr_url;
    link.download = `${qrPayload.value.slug || 'feedback-form'}-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    actionMessage.value = 'QR code downloaded successfully.';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to download QR code');
  }
};

const feedbackSummary = computed(() => {
  const total = submissionPagination.value.total_items;
  const anonymous = submissionRows.value.filter((row) => row.is_anonymous).length;
  const ratedRows = submissionRows.value.filter((row) => Number(row.rating || 0) > 0);
  const average = ratedRows.length
    ? (ratedRows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / ratedRows.length).toFixed(2)
    : '0.00';

  return { total, anonymous, average };
});

const orderedFields = computed(() => [...(formModel.value?.fields || [])].sort((a, b) => a.sort_order - b.sort_order));
const previewFields = computed(() => orderedFields.value.filter((field) => field.is_active));
const previewFieldLabels = computed(() => previewFields.value.map((field) => field.label));
const showOptionsInputForNewField = computed(() => ['select', 'checkbox', 'radio'].includes(newField.field_type));
const publishWorkflow = computed(() => buildPublishWorkflow(formModel.value || {}));
const legacyMigration = computed(() => formModel.value?.legacy_migration || null);
const builderSteps = [
  '1. Set the public title and visibility.',
  '2. Add only the fields you really need.',
  '3. Open one field card at a time to edit it.',
  '4. Copy the public link or QR code when ready.'
];
const submissionColumns = [
  { key: 'created_at', label: 'Submitted' },
  { key: 'identity', label: 'Respondent' },
  { key: 'rating', label: 'Rating' },
  { key: 'message_summary', label: 'Summary' },
  { key: 'actions', label: 'Actions' }
];

const openSubmission = (row) => {
  router.push(`/org-admin/public-feedback/submissions/${row.id}`);
};

const applySubmissionFilters = async () => {
  await loadSubmissions(1);
};

const updateSubmissionPage = async (page) => {
  await loadSubmissions(page);
};

const toggleFieldEditor = (fieldId) => {
  expandedFieldId.value = Number(expandedFieldId.value) === Number(fieldId) ? null : fieldId;
};

onMounted(refreshPage);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <PageHeader
          kicker="Public Feedback"
          title="Public Feedback Form Builder"
          description="Configure your organization’s public feedback form, publish the QR-accessible link, preview the public experience, and review incoming submissions without mixing them into complaints."
        >
          <template #actions>
            <button class="app-btn-secondary" @click="refreshPage">
              Refresh
            </button>
          </template>
        </PageHeader>

        <LoadingSpinner v-if="loading" label="Loading public feedback builder..." />
        <ErrorState
          v-else-if="error && !formModel"
          title="Could not load public feedback builder"
          :description="error"
        />

        <template v-else-if="formModel">
          <ErrorState
            v-if="error"
            title="Action failed"
            :description="error"
          />

          <div
            v-if="actionMessage"
            class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"
          >
            {{ actionMessage }}
          </div>

          <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr),minmax(340px,0.75fr)]">
            <section class="space-y-4">
              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Start Here</p>
                  <h2 class="app-section-title">Simple setup flow</h2>
                  <p class="app-section-description">Use these steps to build the public form without getting lost in extra settings.</p>
                </div>

                <div class="mb-5 rounded-[22px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-4">
                  <ul class="space-y-2">
                    <li
                      v-for="step in builderSteps"
                      :key="step"
                      class="flex items-start gap-2 text-sm text-[var(--app-muted-color)]"
                    >
                      <span class="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--app-primary)]"></span>
                      <span>{{ step }}</span>
                    </li>
                  </ul>
                </div>

                <div class="grid grid-cols-1 gap-4">
                  <FormField v-model="formState.title" label="Form Title" />
                  <FormField
                    v-model="formState.description"
                    as="textarea"
                    label="Description"
                    :rows="4"
                    help="Shown publicly above the form."
                  />
                </div>

                <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="formState.is_public" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Public</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Allows public access.</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="formState.is_active" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Active</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Accepts new responses.</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="formState.allow_anonymous" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Anonymous</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Hide respondent identity.</p>
                    </div>
                  </label>
                </div>

                <div class="mt-5 flex flex-wrap items-center gap-2">
                  <StatusBadge :value="formState.is_public ? 'public' : 'private'" :tone="formState.is_public ? 'success' : 'neutral'" />
                  <StatusBadge :value="formState.is_active ? 'active' : 'inactive'" :tone="formState.is_active ? 'success' : 'warning'" />
                  <StatusBadge :value="`version ${formModel.version}`" tone="neutral" />
                </div>

                <div class="mt-5 flex justify-end">
                  <button class="app-btn-primary" :disabled="savingForm" @click="saveFormSettings">
                    {{ savingForm ? 'Saving...' : 'Save Form Settings' }}
                  </button>
                </div>
              </section>

              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Publish Workflow</p>
                  <h2 class="app-section-title">Readiness and Visibility</h2>
                  <p class="app-section-description">Track whether the form is still in draft, paused, private, or actively published.</p>
                </div>

                <div class="rounded-[22px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <StatusBadge :value="publishWorkflow.label" :tone="publishWorkflow.state === 'published' ? 'success' : publishWorkflow.state === 'paused' ? 'warning' : 'neutral'" />
                    <StatusBadge :value="publishWorkflow.progressLabel" tone="neutral" />
                  </div>
                  <p class="mt-3 text-sm text-[var(--app-muted-color)]">{{ publishWorkflow.description }}</p>
                  <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <article
                      v-for="item in publishWorkflow.checklist"
                      :key="item.key"
                      class="rounded-[18px] border border-[var(--app-line)] bg-white px-4 py-3"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <p class="text-sm font-medium text-[var(--app-title-color)]">{{ item.label }}</p>
                        <StatusBadge :value="item.complete ? 'Complete' : 'Pending'" :tone="item.complete ? 'success' : 'warning'" />
                      </div>
                    </article>
                  </div>
                </div>
              </section>

              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Migration Status</p>
                  <h2 class="app-section-title">Legacy Feedback Upgrade</h2>
                  <p class="app-section-description">Visibility into whether older public-feedback data was migrated and whether the old storage tables have been retired.</p>
                </div>

                <div class="rounded-[22px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <StatusBadge :value="legacyMigration?.label || 'No Legacy Data'" :tone="legacyMigration?.state === 'retired' ? 'success' : legacyMigration?.state === 'active' ? 'warning' : 'neutral'" />
                    <StatusBadge
                      :value="legacyMigration?.archived_legacy_tables ? 'Archived Backup Present' : legacyMigration?.active_legacy_tables ? 'Legacy Tables Still Active' : 'No Legacy Tables'"
                      tone="neutral"
                    />
                  </div>
                  <p class="mt-3 text-sm text-[var(--app-muted-color)]">
                    {{ legacyMigration?.description || 'This organization has no earlier public-feedback tables to migrate.' }}
                  </p>

                  <div v-if="legacyMigration?.organization_had_legacy_records" class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <article class="rounded-[18px] border border-[var(--app-line)] bg-white px-4 py-3">
                      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Archived Legacy Forms</p>
                      <p class="mt-2 text-2xl font-semibold text-[var(--app-title-color)]">{{ legacyMigration?.retained_records?.archived_forms || 0 }}</p>
                    </article>
                    <article class="rounded-[18px] border border-[var(--app-line)] bg-white px-4 py-3">
                      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Archived Legacy Submissions</p>
                      <p class="mt-2 text-2xl font-semibold text-[var(--app-title-color)]">{{ legacyMigration?.retained_records?.archived_submissions || 0 }}</p>
                    </article>
                  </div>
                </div>
              </section>

              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Step 2</p>
                  <h2 class="app-section-title">Add a New Field</h2>
                  <p class="app-section-description">Keep it short. Most forms work well with just rating, feedback, and one optional contact field.</p>
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField v-model="newField.label" label="Label" />
                  <FormField v-model="newField.field_key" label="System Key" help="Used by the system behind the scenes. Keep it unique. Example: service_quality" />
                  <FormField v-model="newField.field_type" as="select" label="Field Type" :options="fieldTypeOptions" />
                  <FormField v-model="newField.placeholder" label="Placeholder" />
                  <FormField v-model="newField.help_text" label="Help Text" wrapper-class="md:col-span-2" />
                  <FormField
                    v-if="showOptionsInputForNewField"
                    v-model="newField.optionsText"
                    label="Options"
                    placeholder="Option A, Option B, Option C"
                    wrapper-class="md:col-span-2"
                  />
                </div>

                <div class="mt-4 flex flex-wrap gap-4">
                  <label class="flex items-center gap-2 text-sm text-[var(--app-title-color)]">
                    <input v-model="newField.is_required" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    Required
                  </label>
                  <label class="flex items-center gap-2 text-sm text-[var(--app-title-color)]">
                    <input v-model="newField.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    Active
                  </label>
                </div>

                <div class="mt-5 flex justify-end gap-2">
                  <button class="app-btn-secondary" @click="resetNewField">Clear</button>
                  <button class="app-btn-primary" :disabled="creatingField" @click="addField">
                    {{ creatingField ? 'Adding...' : 'Add Field' }}
                  </button>
                </div>
              </section>

              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Step 3</p>
                  <h2 class="app-section-title">Edit One Field at a Time</h2>
                  <p class="app-section-description">Open a field when you want to change it. Move and delete controls stay visible in the summary row.</p>
                </div>

                <EmptyState
                  v-if="orderedFields.length === 0"
                  title="No fields configured yet"
                  description="Add the first field above to start building this public feedback form."
                  compact
                />

                <div v-else class="space-y-4">
                  <article
                    v-for="(field, index) in orderedFields"
                    :key="field.id"
                    class="rounded-[24px] border border-[var(--app-line)] bg-[var(--app-surface)] p-4"
                    :class="draggingFieldId === field.id ? 'opacity-70 ring-2 ring-[var(--app-primary)]' : ''"
                    draggable="true"
                    @dragstart="handleFieldDragStart(field.id)"
                    @dragover.prevent
                    @drop.prevent="handleFieldDrop(field.id)"
                  >
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div class="flex flex-wrap items-center gap-2">
                        <button
                          class="app-btn-secondary min-h-[36px] px-3 py-2 text-xs"
                          @click="toggleFieldEditor(field.id)"
                        >
                          {{ Number(expandedFieldId) === Number(field.id) ? 'Hide Editor' : 'Edit Field' }}
                        </button>
                        <StatusBadge value="drag to reorder" tone="neutral" />
                        <StatusBadge :value="field.label" tone="neutral" />
                        <StatusBadge :value="field.field_type" tone="neutral" />
                        <StatusBadge :value="field.is_active ? 'active' : 'inactive'" :tone="field.is_active ? 'success' : 'warning'" />
                        <StatusBadge :value="field.is_required ? 'required' : 'optional'" :tone="field.is_required ? 'warning' : 'neutral'" />
                        <StatusBadge :value="`order ${field.sort_order}`" tone="neutral" />
                      </div>
                      <div class="flex flex-wrap gap-2">
                        <button class="app-btn-secondary min-h-[36px] px-3 py-2 text-xs" :disabled="index === 0" @click="reorderField(field, -1)">Move Up</button>
                        <button class="app-btn-secondary min-h-[36px] px-3 py-2 text-xs" :disabled="index === orderedFields.length - 1" @click="reorderField(field, 1)">Move Down</button>
                        <button class="app-btn-danger min-h-[36px] px-3 py-2 text-xs" @click="deleteField(field)">Delete</button>
                      </div>
                    </div>

                    <div v-if="Number(expandedFieldId) === Number(field.id)">
                      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField v-model="syncFieldDraft(field).label" label="Label" />
                        <FormField v-model="syncFieldDraft(field).field_key" label="System Key" help="Used internally to identify this field. Example: service_quality" />
                        <FormField v-model="syncFieldDraft(field).field_type" as="select" label="Field Type" :options="fieldTypeOptions" />
                        <FormField v-model="syncFieldDraft(field).placeholder" label="Placeholder" />
                        <FormField v-model="syncFieldDraft(field).help_text" label="Help Text" wrapper-class="md:col-span-2" />
                        <FormField
                          v-if="['select', 'checkbox', 'radio'].includes(syncFieldDraft(field).field_type)"
                          v-model="syncFieldDraft(field).optionsText"
                          label="Options"
                          placeholder="Option A, Option B, Option C"
                          wrapper-class="md:col-span-2"
                        />
                      </div>

                      <div class="mt-4 flex flex-wrap gap-4">
                        <label class="flex items-center gap-2 text-sm text-[var(--app-title-color)]">
                          <input v-model="syncFieldDraft(field).is_required" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                          Required
                        </label>
                        <label class="flex items-center gap-2 text-sm text-[var(--app-title-color)]">
                          <input v-model="syncFieldDraft(field).is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                          Active
                        </label>
                      </div>

                      <div class="mt-5 flex justify-end">
                        <button class="app-btn-primary min-h-[38px] px-4 py-2 text-sm" :disabled="field._saving" @click="saveField(field)">
                          {{ field._saving ? 'Saving...' : 'Save Field' }}
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            </section>

            <section class="space-y-4">
              <section class="app-section-card">
                <p class="app-kicker">Public Access</p>
                <h2 class="app-section-title">Link and QR Code</h2>
                <p class="app-section-description">Use this stable route for posters, flyers, counters, and public campaigns.</p>

                <div class="mt-4 space-y-4">
                  <div class="rounded-[22px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-4">
                    <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Public URL</p>
                    <p class="mt-2 break-all text-sm font-medium text-[var(--app-title-color)]">{{ qrPayload?.public_url || formModel.public_url }}</p>
                    <div class="mt-4 flex flex-wrap gap-2">
                      <button class="app-btn-secondary" @click="copyPublicLink">Copy Link</button>
                      <a class="app-btn-secondary" :href="qrPayload?.public_url || formModel.public_url" target="_blank" rel="noreferrer">Open Public Page</a>
                    </div>
                  </div>

                  <div class="rounded-[22px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-4">
                    <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">QR Code</p>
                    <div class="mt-3 flex flex-col items-start gap-3">
                      <img
                        v-if="qrPayload?.qr_url || formModel.public_qr_url"
                        :src="qrPayload?.qr_url || formModel.public_qr_url"
                        alt="Public feedback QR code"
                        class="h-40 w-40 rounded-[20px] border border-[var(--app-line)] bg-white p-3"
                      >
                      <button class="app-btn-secondary" @click="downloadQr">Download QR</button>
                    </div>
                  </div>
                </div>
              </section>

              <section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <article class="app-section-card">
                  <p class="text-sm font-medium text-slate-500">Submissions</p>
                  <p class="mt-2 text-3xl font-semibold text-slate-900">{{ feedbackSummary.total }}</p>
                </article>
                <article class="app-section-card">
                  <p class="text-sm font-medium text-slate-500">Anonymous</p>
                  <p class="mt-2 text-3xl font-semibold text-slate-900">{{ feedbackSummary.anonymous }}</p>
                </article>
                <article class="app-section-card">
                  <p class="text-sm font-medium text-slate-500">Average Rating</p>
                  <p class="mt-2 text-3xl font-semibold text-slate-900">{{ feedbackSummary.average }}</p>
                </article>
              </section>

              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Step 4</p>
                  <h2 class="app-section-title">What the Public Will See</h2>
                  <p class="app-section-description">A simple summary so you can confirm the form makes sense without reading every field twice.</p>
                </div>

                <div class="rounded-[24px] border border-[var(--app-line)] bg-white p-5">
                  <h3 class="text-xl font-semibold text-[var(--app-title-color)]">{{ formState.title }}</h3>
                  <p class="mt-2 text-sm text-[var(--app-muted-color)]">{{ formState.description }}</p>

                  <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <article class="rounded-[18px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-4">
                      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Visible Fields</p>
                      <p class="mt-2 text-2xl font-semibold text-[var(--app-title-color)]">{{ previewFields.length }}</p>
                    </article>
                    <article class="rounded-[18px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-4">
                      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Public Access</p>
                      <p class="mt-2 text-sm font-semibold text-[var(--app-title-color)]">{{ formState.is_public ? 'Visible to the public' : 'Hidden from the public' }}</p>
                    </article>
                    <article class="rounded-[18px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-4">
                      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Submission Status</p>
                      <p class="mt-2 text-sm font-semibold text-[var(--app-title-color)]">{{ formState.is_active ? 'Accepting new responses' : 'Not accepting responses' }}</p>
                    </article>
                  </div>

                  <div class="mt-5 rounded-[18px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] p-4">
                    <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Field Summary</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <span
                        v-for="label in previewFieldLabels"
                        :key="label"
                        class="inline-flex items-center rounded-full border border-[var(--app-line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--app-title-color)]"
                      >
                        {{ label }}
                      </span>
                      <span
                        v-if="previewFieldLabels.length === 0"
                        class="text-sm text-[var(--app-muted-color)]"
                      >
                        No active fields yet.
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </section>
          </section>

          <section class="app-section-card">
            <div class="mb-4">
              <p class="app-kicker">Submissions</p>
              <h2 class="app-section-title">Public Feedback Responses</h2>
              <p class="app-section-description">Review organization-specific submissions without mixing them into complaint records.</p>
            </div>

            <div class="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr),220px,160px,auto]">
              <FormField v-model="submissionFilters.search" label="Search" placeholder="Name, email, phone, or response text" />
              <FormField
                v-model="submissionFilters.anonymous"
                as="select"
                label="Identity"
                :options="[
                  { value: 'all', label: 'All submissions' },
                  { value: 'yes', label: 'Anonymous only' },
                  { value: 'no', label: 'Identified only' }
                ]"
              />
              <FormField
                v-model="submissionFilters.rating"
                as="select"
                label="Rating"
                :options="[
                  { value: 0, label: 'All ratings' },
                  { value: 5, label: '5 only' },
                  { value: 4, label: '4 only' },
                  { value: 3, label: '3 only' },
                  { value: 2, label: '2 only' },
                  { value: 1, label: '1 only' }
                ]"
              />
              <div class="flex items-end gap-2">
                <button class="app-btn-secondary" @click="applySubmissionFilters">Apply Filters</button>
              </div>
            </div>

            <DataTable
              :rows="submissionRows"
              :columns="submissionColumns"
              row-key="id"
              :loading="false"
              empty-title="No public submissions yet"
              empty-description="Once people open the public link or scan the QR code, their submissions will appear here."
              :page="submissionPagination.page"
              :total-pages="submissionPagination.total_pages"
              :total-items="submissionPagination.total_items"
              :visible-count="submissionRows.length"
              pagination-label="submissions"
              @update:page="updateSubmissionPage"
            >
              <template #cell-created_at="{ row }">
                {{ row.created_at || 'N/A' }}
              </template>
              <template #cell-identity="{ row }">
                <div class="space-y-1">
                  <p class="font-medium text-[var(--app-title-color)]">{{ row.is_anonymous ? 'Anonymous' : (row.respondent_name || 'Public respondent') }}</p>
                  <p class="text-xs text-[var(--app-muted-color)]">
                    {{ row.is_anonymous ? 'Identity hidden' : (row.respondent_email || row.respondent_phone || 'No contact details') }}
                  </p>
                </div>
              </template>
              <template #cell-rating="{ row }">
                <StatusBadge :value="row.rating ? `${row.rating}/5` : 'No rating'" tone="neutral" />
              </template>
              <template #cell-message_summary="{ row }">
                <p class="max-w-[26rem] text-sm text-[var(--app-title-color)]">{{ row.message_summary || 'No summary provided.' }}</p>
              </template>
              <template #cell-actions="{ row }">
                <button class="app-btn-secondary min-h-[36px] px-3 py-2 text-xs" @click="openSubmission(row)">
                  View Detail
                </button>
              </template>
            </DataTable>
          </section>
        </template>

        <EmptyState
          v-else
          title="Feedback builder unavailable"
          description="The builder could not be initialized for this organization."
        />
      </div>
    </div>
  </section>
</template>
