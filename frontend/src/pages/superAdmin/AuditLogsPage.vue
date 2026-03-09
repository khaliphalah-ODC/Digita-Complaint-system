<script setup>
import { computed, onMounted, ref } from 'vue';
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

onMounted(fetchLogs);
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p class="text-sm text-slate-600">Track status change history and actor trail across accessments.</p>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="fetchLogs">
        Refresh
      </button>
    </header>

    <section class="rounded-2xl border border-slate-200 bg-white p-4">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-bold text-slate-900">Status Change Events</h2>
        <input v-model="search" placeholder="Search by accessment, status, notes..." class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
      </div>

      <p v-if="loading" class="text-sm text-slate-500">Loading logs...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="filteredLogs.length === 0" class="text-sm text-slate-500">No audit logs found.</p>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="text-slate-500">
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
            <tr v-for="row in paginatedLogs" :key="row.id" class="border-t border-slate-100">
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

      <div class="mt-3 flex items-center justify-between text-xs text-slate-600">
        <p>Showing {{ paginatedLogs.length }} of {{ filteredLogs.length }} logs</p>
        <div class="flex items-center gap-2">
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="page <= 1" @click="goToPage(page - 1)">Prev</button>
          <span>Page {{ page }} / {{ totalPages }}</span>
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</button>
        </div>
      </div>
    </section>
  </section>
</template>
