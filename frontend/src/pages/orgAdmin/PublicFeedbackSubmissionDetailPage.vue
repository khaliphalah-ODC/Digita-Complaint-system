<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EmptyState from '../../components/ui/EmptyState.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { extractApiError, publicFeedbackApi } from '../../services/api';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const submission = ref(null);

const responseEntries = computed(() => {
  const responses = submission.value?.responses || {};
  return Object.entries(responses).map(([key, value]) => ({
    key,
    value: Array.isArray(value) ? value.join(', ') : value === true ? 'Yes' : value === false ? 'No' : (value || 'No response')
  }));
});

const loadSubmission = async () => {
  loading.value = true;
  error.value = '';
  try {
    submission.value = await publicFeedbackApi.getSubmissionById(route.params.id);
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load feedback submission');
    submission.value = null;
  } finally {
    loading.value = false;
  }
};

onMounted(loadSubmission);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="app-kicker">Submission Detail</p>
            <h1 class="mt-2 text-3xl font-semibold text-slate-900">Public Feedback Response</h1>
            <p class="text-sm text-slate-600">Review the submission details, metadata, and structured field responses.</p>
          </div>
          <button class="app-btn-secondary" @click="router.push('/org-admin/public-feedback')">
            Back to Builder
          </button>
        </header>

        <LoadingSpinner v-if="loading" label="Loading submission..." />
        <ErrorState v-else-if="error" title="Unable to load submission" :description="error" />

        <template v-else-if="submission">
          <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr),minmax(0,1.1fr)]">
            <section class="app-section-card">
              <div class="mb-4 flex flex-wrap items-center gap-2">
                <StatusBadge :value="submission.is_anonymous ? 'anonymous' : 'identified'" :tone="submission.is_anonymous ? 'warning' : 'success'" />
                <StatusBadge :value="submission.rating ? `${submission.rating}/5` : 'No rating'" tone="neutral" />
              </div>

              <div class="space-y-4 text-sm">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Submitted</p>
                  <p class="mt-1 font-medium text-[var(--app-title-color)]">{{ submission.created_at || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Respondent</p>
                  <p class="mt-1 font-medium text-[var(--app-title-color)]">{{ submission.is_anonymous ? 'Anonymous' : (submission.respondent_name || 'Public respondent') }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Email</p>
                  <p class="mt-1 font-medium text-[var(--app-title-color)]">{{ submission.respondent_email || 'Not provided' }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Phone</p>
                  <p class="mt-1 font-medium text-[var(--app-title-color)]">{{ submission.respondent_phone || 'Not provided' }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">Summary</p>
                  <p class="mt-1 leading-7 text-[var(--app-title-color)]">{{ submission.message_summary || 'No summary provided.' }}</p>
                </div>
              </div>
            </section>

            <section class="app-section-card">
              <div class="mb-4">
                <p class="app-kicker">Structured Responses</p>
                <h2 class="app-section-title">Captured Field Values</h2>
              </div>

              <EmptyState
                v-if="responseEntries.length === 0"
                title="No structured responses found"
                description="This submission does not contain any captured form values."
                compact
              />

              <div v-else class="space-y-3">
                <article
                  v-for="entry in responseEntries"
                  :key="entry.key"
                  class="rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4"
                >
                  <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">{{ entry.key }}</p>
                  <p class="mt-2 text-sm leading-7 text-[var(--app-title-color)]">{{ entry.value }}</p>
                </article>
              </div>
            </section>
          </section>
        </template>
      </div>
    </div>
  </section>
</template>
