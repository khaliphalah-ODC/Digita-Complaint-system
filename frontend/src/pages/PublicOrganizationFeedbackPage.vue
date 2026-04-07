<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import EmptyState from '../components/ui/EmptyState.vue';
import ErrorState from '../components/ui/ErrorState.vue';
import FormField from '../components/ui/FormField.vue';
import LoadingSpinner from '../components/ui/LoadingSpinner.vue';
import { extractApiError, publicFeedbackApi } from '../services/api';

const route = useRoute();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const successMessage = ref('');
const formDefinition = ref(null);
const responses = reactive({});
const submitAnonymously = ref(false);

const slug = computed(() => String(route.params.slug || '').trim());
const activeFields = computed(() => (
  Array.isArray(formDefinition.value?.fields)
    ? formDefinition.value.fields.filter((field) => field.is_active)
    : []
));

const visibleFields = computed(() => activeFields.value.filter((field) => {
  if (!submitAnonymously.value) return true;
  return !['respondent_name', 'respondent_email', 'respondent_phone'].includes(field.field_key);
}));

const initializeResponses = (fields) => {
  Object.keys(responses).forEach((key) => {
    delete responses[key];
  });

  fields.forEach((field) => {
    if (field.field_type === 'checkbox') {
      responses[field.field_key] = Array.isArray(field.options) && field.options.length ? [] : false;
      return;
    }
    responses[field.field_key] = '';
  });
};

const validateBeforeSubmit = () => {
  const requiredFields = visibleFields.value.filter((field) => field.is_required);
  for (const field of requiredFields) {
    const value = responses[field.field_key];
    if (field.field_type === 'checkbox') {
      if (Array.isArray(value) && value.length) continue;
      if (value === true) continue;
      return `${field.label} is required.`;
    }
    if (String(value ?? '').trim()) continue;
    return `${field.label} is required.`;
  }
  return '';
};

const fetchForm = async () => {
  if (!slug.value) {
    error.value = 'Public feedback link is invalid.';
    return;
  }

  loading.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const payload = await publicFeedbackApi.getPublicForm(slug.value);
    formDefinition.value = payload;
    submitAnonymously.value = Boolean(payload.allow_anonymous);
    initializeResponses(activeFields.value);
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load public feedback form');
    formDefinition.value = null;
  } finally {
    loading.value = false;
  }
};

const toggleCheckboxOption = (fieldKey, option) => {
  const current = Array.isArray(responses[fieldKey]) ? [...responses[fieldKey]] : [];
  const next = current.includes(option)
    ? current.filter((item) => item !== option)
    : [...current, option];
  responses[fieldKey] = next;
};

const submitFeedback = async () => {
  if (!formDefinition.value) return;

  const validationMessage = validateBeforeSubmit();
  if (validationMessage) {
    error.value = validationMessage;
    return;
  }

  saving.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    await publicFeedbackApi.submitPublicSubmission(slug.value, {
      is_anonymous: submitAnonymously.value,
      responses: { ...responses }
    });
    successMessage.value = 'Thank you for your feedback. Your response has been submitted successfully.';
    initializeResponses(activeFields.value);
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to submit public feedback');
  } finally {
    saving.value = false;
  }
};

onMounted(fetchForm);

watch(slug, () => {
  void fetchForm();
});
</script>

<template>
  <section class="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="overflow-hidden rounded-[32px] border border-[var(--app-line)] bg-white shadow-[var(--app-shadow-lg)]">
      <div class="bg-[linear-gradient(135deg,rgba(24,58,99,1),rgba(40,77,122,0.92))] px-6 py-8 text-white sm:px-8">
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Public Feedback</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight">{{ formDefinition?.title || 'Organization Feedback' }}</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-white/80">
          {{ formDefinition?.description || 'Share your experience with this organization through the public feedback channel.' }}
        </p>
        <p v-if="formDefinition?.organization_name" class="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
          {{ formDefinition.organization_name }}
        </p>
      </div>

      <div class="px-6 py-8 sm:px-8">
        <LoadingSpinner v-if="loading" label="Loading feedback form..." />
        <ErrorState v-else-if="error && !formDefinition" title="Unable to open this feedback page" :description="error" />
        <EmptyState
          v-else-if="!formDefinition"
          title="Feedback form unavailable"
          description="This organization does not currently have a public feedback form available."
        />

        <div v-else class="space-y-6">
          <ErrorState
            v-if="error"
            title="We could not submit your feedback"
            :description="error"
          />

          <div
            v-if="successMessage"
            class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"
          >
            <p class="font-semibold">Feedback submitted</p>
            <p class="mt-1">{{ successMessage }}</p>
          </div>

          <label
            v-if="formDefinition.allow_anonymous"
            class="flex items-start gap-3 rounded-[24px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4"
          >
            <input
              v-model="submitAnonymously"
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]"
            >
            <div>
              <p class="text-sm font-semibold text-[var(--app-title-color)]">Submit anonymously</p>
              <p class="mt-1 text-sm text-[var(--app-muted-color)]">Your identity fields will be hidden from the organization when this is enabled.</p>
            </div>
          </label>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <template v-for="field in visibleFields" :key="field.id">
              <FormField
                v-if="['short_text', 'email', 'phone'].includes(field.field_type)"
                v-model="responses[field.field_key]"
                :label="field.label"
                :type="field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'"
                :placeholder="field.placeholder || ''"
                :help="field.help_text || ''"
              />

              <FormField
                v-else-if="field.field_type === 'long_text'"
                v-model="responses[field.field_key]"
                as="textarea"
                :label="field.label"
                :placeholder="field.placeholder || ''"
                :help="field.help_text || ''"
                :rows="5"
                wrapper-class="md:col-span-2"
              />

              <FormField
                v-else-if="field.field_type === 'select'"
                v-model="responses[field.field_key]"
                as="select"
                :label="field.label"
                :help="field.help_text || ''"
                :options="[{ value: '', label: 'Select an option' }, ...(field.options || []).map((option) => ({ value: option, label: option }))]"
              />

              <FormField
                v-else-if="field.field_type === 'rating'"
                v-model="responses[field.field_key]"
                as="select"
                :label="field.label"
                :help="field.help_text || ''"
                :options="[
                  { value: '', label: 'Select a rating' },
                  { value: 5, label: '5 - Excellent' },
                  { value: 4, label: '4 - Good' },
                  { value: 3, label: '3 - Fair' },
                  { value: 2, label: '2 - Poor' },
                  { value: 1, label: '1 - Very Poor' }
                ]"
              />

              <FormField
                v-else-if="field.field_type === 'yes_no'"
                v-model="responses[field.field_key]"
                as="select"
                :label="field.label"
                :help="field.help_text || ''"
                :options="[
                  { value: '', label: 'Choose Yes or No' },
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' }
                ]"
              />

              <div
                v-else-if="field.field_type === 'radio'"
                class="rounded-[24px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4 md:col-span-2"
              >
                <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ field.label }}</p>
                <p v-if="field.help_text" class="mt-1 text-xs text-[var(--app-muted-color)]">{{ field.help_text }}</p>
                <div class="mt-3 flex flex-col gap-2">
                  <label v-for="option in field.options" :key="option" class="flex items-center gap-2 text-sm text-[var(--app-title-color)]">
                    <input v-model="responses[field.field_key]" type="radio" :name="field.field_key" :value="option" class="h-4 w-4 border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    {{ option }}
                  </label>
                </div>
              </div>

              <div
                v-else-if="field.field_type === 'checkbox'"
                class="rounded-[24px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4 md:col-span-2"
              >
                <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ field.label }}</p>
                <p v-if="field.help_text" class="mt-1 text-xs text-[var(--app-muted-color)]">{{ field.help_text }}</p>
                <div v-if="field.options?.length" class="mt-3 flex flex-col gap-2">
                  <label v-for="option in field.options" :key="option" class="flex items-center gap-2 text-sm text-[var(--app-title-color)]">
                    <input
                      type="checkbox"
                      :checked="Array.isArray(responses[field.field_key]) && responses[field.field_key].includes(option)"
                      class="h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]"
                      @change="toggleCheckboxOption(field.field_key, option)"
                    >
                    {{ option }}
                  </label>
                </div>
                <label v-else class="mt-3 flex items-center gap-2 text-sm text-[var(--app-title-color)]">
                  <input v-model="responses[field.field_key]" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                  Confirm
                </label>
              </div>
            </template>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-[var(--app-muted-color)]">This public feedback form is separate from complaint submission and will not create a complaint record.</p>
            <button class="app-btn-primary" :disabled="saving" @click="submitFeedback">
              {{ saving ? 'Submitting...' : 'Submit Feedback' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
