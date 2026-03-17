<script setup>
import { computed, onMounted, ref } from 'vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import api, { extractApiError, unwrapResponse } from '../../services/api';

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
  <section class="app-dark-stage space-y-5 rounded-[34px] p-4 sm:p-6">
    <PageHeader
      theme="dark"
      kicker="Oversight History"
      title="Audit Logs"
      description="Review platform status-change history and maintain a clear actor trail for assessed complaint records."
    >
      <template #actions>
        <button class="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/84" @click="fetchLogs">
          Refresh Logs
        </button>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Total Events</p>
        <p class="mt-2 text-3xl font-black text-white">{{ auditSummary.total }}</p>
        <p class="text-sm text-white/58">All audit entries currently loaded from the platform history feed.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Assessed Records</p>
        <p class="mt-2 text-3xl font-black text-blue-200">{{ auditSummary.uniqueAccessments }}</p>
        <p class="text-sm text-white/58">Unique assessment records represented in the current log list.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Visible On Page</p>
        <p class="mt-2 text-3xl font-black text-blue-200">{{ auditSummary.visible }}</p>
        <p class="text-sm text-white/58">Entries visible in the current paginated view.</p>
      </article>
      <article class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
        <p class="text-xs uppercase tracking-wide text-white/46">Latest Event</p>
        <p class="mt-2 text-sm font-bold text-white">{{ auditSummary.latestEvent }}</p>
        <p class="text-sm text-white/58">Most recent audit timestamp loaded into the table.</p>
      </article>
    </section>

    <section class="app-dark-panel rounded-[30px] p-5">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-bold text-white">Status Change Events</h2>
        <input v-model="search" placeholder="Search by accessment, status, notes..." class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/36">
      </div>

      <p v-if="loading" class="text-sm text-white/58">Loading logs...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="filteredLogs.length === 0" class="text-sm text-white/58">No audit logs found.</p>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="text-white/46">
            <tr>
              <th class="pb-2 pr-3">Accessment</th>
              <th class="pb-2 pr-3">Changed By</th>
              <th class="pb-2 pr-3">Old Status</th>
              <th class="pb-2 pr-3">New Status</th>
              <th class="pb-2 pr-3">Notes</th>
              <th class="pb-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginatedLogs" :key="row.id" class="border-t border-white/8 text-white/82">
              <td class="py-2 pr-3">#{{ row.accessment_id }}</td>
              <td class="py-2 pr-3">{{ row.changed_by }}</td>
              <td class="py-2 pr-3">{{ row.old_status || 'N/A' }}</td>
              <td class="py-2 pr-3">{{ row.new_status }}</td>
              <td class="py-2 pr-3">{{ row.notes || 'N/A' }}</td>
              <td class="py-2">{{ row.created_at }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 flex items-center justify-between text-xs text-white/56">
        <p>Showing {{ paginatedLogs.length }} of {{ filteredLogs.length }} logs</p>
        <div class="flex items-center gap-2">
          <button class="rounded-full border border-white/10 px-3 py-1.5 disabled:opacity-50" :disabled="page <= 1" @click="goToPage(page - 1)">Prev</button>
          <span>Page {{ page }} / {{ totalPages }}</span>
          <button class="rounded-full border border-white/10 px-3 py-1.5 disabled:opacity-50" :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</button>
        </div>
      </div>
    </section>
  </section>
</template>
