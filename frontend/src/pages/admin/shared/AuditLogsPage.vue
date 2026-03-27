<script setup>
import { computed, onMounted, ref } from 'vue';
import MobileDataCardList from '../../../components/MobileDataCardList.vue';
import PageHeader from '../../../components/superAdmin/PageHeader.vue';
import api, { extractApiError, unwrapResponse } from '../../../services/api';

const loading = ref(false);
const error = ref('');
const logs = ref([]);
const search = ref('');
const page = ref(1);
const pageSize = 12;

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const fetchLogs = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/status-logs');
    logs.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch audit logs') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch audit logs');
  } finally {
    loading.value = false;
  }
};

const filteredLogs = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return logs.value;
  return logs.value.filter((row) => {
    return (
      String(row.accessment_id || '').toLowerCase().includes(keyword) ||
      String(row.changed_by || '').toLowerCase().includes(keyword) ||
      String(row.old_status || '').toLowerCase().includes(keyword) ||
      String(row.new_status || '').toLowerCase().includes(keyword) ||
      String(row.notes || '').toLowerCase().includes(keyword)
    );
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / pageSize)));

const paginatedLogs = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredLogs.value.slice(start, start + pageSize);
});
const auditLogCardFields = [
  { key: 'assessment', label: 'Assessment' },
  { key: 'changedBy', label: 'Changed By' },
  { key: 'oldStatus', label: 'Old Status' },
  { key: 'newStatus', label: 'New Status' },
  { key: 'notes', label: 'Notes' },
  { key: 'createdAt', label: 'Created At' }
];

const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

const auditSummary = computed(() => {
  const uniqueAccessments = new Set(logs.value.map((row) => row.accessment_id).filter(Boolean)).size;
  const latestEvent = logs.value[0]?.created_at || 'No events yet';
  return {
    total: logs.value.length,
    uniqueAccessments,
    latestEvent,
    visible: paginatedLogs.value.length
  };
});

onMounted(fetchLogs);
</script>

<template>
  <section class="app-page-shell app-admin-page-shell space-y-5 rounded-[var(--app-radius-xl)]">
    <PageHeader
      kicker="Oversight History"
      title="Audit Logs"
      description="Review platform status-change history and maintain a clear actor trail for assessed complaint records."
    >
      <template #actions>
        <button class="app-btn-secondary" @click="fetchLogs">
          Refresh Logs
        </button>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="app-section-card">
        <p class="text-xs uppercase tracking-wide text-[var(--app-muted-color)]">Total Events</p>
        <p class="mt-2 text-3xl font-black text-[var(--app-title-color)]">{{ auditSummary.total }}</p>
        <p class="text-sm text-[var(--app-muted-color)]">All audit entries currently loaded from the platform history feed.</p>
      </article>
      <article class="app-section-card">
        <p class="text-xs uppercase tracking-wide text-[var(--app-muted-color)]">Assessed Records</p>
        <p class="mt-2 text-3xl font-black text-[var(--app-primary)]">{{ auditSummary.uniqueAccessments }}</p>
        <p class="text-sm text-[var(--app-muted-color)]">Unique assessment records represented in the current log list.</p>
      </article>
      <article class="app-section-card">
        <p class="text-xs uppercase tracking-wide text-[var(--app-muted-color)]">Visible On Page</p>
        <p class="mt-2 text-3xl font-black text-[var(--app-primary)]">{{ auditSummary.visible }}</p>
        <p class="text-sm text-[var(--app-muted-color)]">Entries visible in the current paginated view.</p>
      </article>
      <article class="app-section-card">
        <p class="text-xs uppercase tracking-wide text-[var(--app-muted-color)]">Latest Event</p>
        <p class="mt-2 text-sm font-bold text-[var(--app-title-color)]">{{ auditSummary.latestEvent }}</p>
        <p class="text-sm text-[var(--app-muted-color)]">Most recent audit timestamp loaded into the table.</p>
      </article>
    </section>

    <section class="app-section-card p-5">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-bold text-[var(--app-title-color)]">Status Change Events</h2>
        <input v-model="search" placeholder="Search by assessment, status, notes..." class="app-input md:max-w-sm">
      </div>

      <p v-if="loading" class="text-sm text-[var(--app-muted-color)]">Loading logs...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="filteredLogs.length === 0" class="text-sm text-[var(--app-muted-color)]">No audit logs found.</p>

      <MobileDataCardList
        v-else
        :items="paginatedLogs"
        :fields="auditLogCardFields"
        key-field="id"
      >
        <template #field-assessment="{ item }">
          <p class="font-medium text-[var(--app-title-color)]">#{{ item.accessment_id }}</p>
        </template>
        <template #field-changedBy="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ item.changed_by }}</p>
        </template>
        <template #field-oldStatus="{ item }">
          <p class="font-medium text-[var(--app-title-color)]">{{ item.old_status || 'N/A' }}</p>
        </template>
        <template #field-newStatus="{ item }">
          <p class="font-medium text-[var(--app-title-color)]">{{ item.new_status }}</p>
        </template>
        <template #field-notes="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ item.notes || 'N/A' }}</p>
        </template>
        <template #field-createdAt="{ item }">
          <p class="break-words font-medium text-[var(--app-title-color)]">{{ item.created_at }}</p>
        </template>
      </MobileDataCardList>

      <div v-if="filteredLogs.length > 0" class="hidden md:block app-table-shell overflow-x-auto">
        <table class="app-table app-table-responsive min-w-full text-left text-sm">
          <thead>
            <tr>
              <th>Assessment</th>
              <th>Changed By</th>
              <th>Old Status</th>
              <th>New Status</th>
              <th>Notes</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginatedLogs" :key="row.id">
              <td data-label="Assessment">#{{ row.accessment_id }}</td>
              <td data-label="Changed By">{{ row.changed_by }}</td>
              <td data-label="Old Status">{{ row.old_status || 'N/A' }}</td>
              <td data-label="New Status">{{ row.new_status }}</td>
              <td data-label="Notes">{{ row.notes || 'N/A' }}</td>
              <td data-label="Created At">{{ row.created_at }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 flex items-center justify-between text-xs text-[var(--app-muted-color)]">
        <p>Showing {{ paginatedLogs.length }} of {{ filteredLogs.length }} logs</p>
        <div class="flex items-center gap-2">
          <button class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs disabled:opacity-50" :disabled="page <= 1" @click="goToPage(page - 1)">Prev</button>
          <span>Page {{ page }} / {{ totalPages }}</span>
          <button class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs disabled:opacity-50" :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</button>
        </div>
      </div>
    </section>
  </section>
</template>
