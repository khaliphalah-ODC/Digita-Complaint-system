<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../../services/api';
import LiveSupportModal from '../../../components/LiveSupportModal.vue';
import { useSessionStore } from '../../../stores/session';

const router = useRouter();
const session = useSessionStore();
const loading = ref(false);
const error = ref('');
const complaints = ref([]);
const search = ref('');
const statusFilter = ref('all');
const priorityFilter = ref('all');
const activeChatComplaintId = ref(null);
const activeChatTitle = ref('');
const page = ref(1);
const pageSize = 8;
const isOrgAdmin = computed(() => session.currentUser?.role === 'org_admin');
const complaintsRoutePrefix = computed(() => (isOrgAdmin.value ? '/org-admin/complaints' : '/admin/complaints'));
const statusOptions = ['submitted', 'in_review', 'resolved', 'closed'];
const priorityOptions = ['low', 'medium', 'high', 'urgent'];

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const needsResponse = (item) => !String(item?.admin_response || '').trim();

const fetchComplaints = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/complaint');
    complaints.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch complaints') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch complaints');
  } finally {
    loading.value = false;
  }
};

const openChat = (item) => {
  activeChatComplaintId.value = item.id;
  activeChatTitle.value = item.title || `Complaint #${item.id}`;
};

const deleteComplaint = async (item) => {
  const ok = window.confirm(`Delete complaint "${item.title || item.id}"?`);
  if (!ok) return;
  error.value = '';
  try {
    await api.delete(`/complaint/${item.id}`);
    await fetchComplaints();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete complaint');
  }
};

const filteredComplaints = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return complaints.value.filter((item) => {
    const matchesText =
      !keyword ||
      item.title?.toLowerCase().includes(keyword) ||
      item.complaint?.toLowerCase().includes(keyword) ||
      item.tracking_code?.toLowerCase().includes(keyword);
    const matchesStatus = statusFilter.value === 'all' || item.status === statusFilter.value;
    const matchesPriority = priorityFilter.value === 'all' || item.priority === priorityFilter.value;
    return matchesText && matchesStatus && matchesPriority;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredComplaints.value.length / pageSize)));

const paginatedComplaints = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredComplaints.value.slice(start, start + pageSize);
});

const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

onMounted(fetchComplaints);
</script>

<template>
  <section class="w-full space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="app-kicker">Case Queue</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-900">{{ isOrgAdmin ? 'Organization Complaints' : 'Admin Complaints' }}</h1>
        <p class="text-sm text-slate-600">
          {{ isOrgAdmin ? 'Review complaints that belong to your organization.' : 'Review and update complaint status and priority.' }}
        </p>
      </div>
      <button class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700" @click="fetchComplaints">
        Refresh
      </button>
    </header>

    <section class="app-shell-panel rounded-[30px] p-5">
      <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-bold text-slate-900">Complaint Queue</h2>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model="search" placeholder="Search complaint or tracking..." class="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm">
          <select v-model="statusFilter" class="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm">
            <option value="all">All status</option>
            <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
          </select>
          <select v-model="priorityFilter" class="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm">
            <option value="all">All priority</option>
            <option v-for="priority in priorityOptions" :key="priority" :value="priority">{{ priority }}</option>
          </select>
        </div>
      </div>

      <p v-if="loading" class="text-sm text-slate-500">Loading complaints...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="filteredComplaints.length === 0" class="text-sm text-slate-500">No complaints found.</p>

      <div v-else class="space-y-3">
        <article
          v-for="item in paginatedComplaints"
          :key="item.id"
          class="app-ink-card rounded-[24px] p-4"
        >
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div class="space-y-1">
              <h3 class="text-base font-bold text-slate-900">{{ item.title || 'Untitled Complaint' }}</h3>
              <p class="text-sm text-slate-700">{{ item.complaint }}</p>
              <p class="text-xs text-slate-500">Tracking: {{ item.tracking_code || 'N/A' }}</p>
              <p class="text-xs text-slate-500">
                Reporter: {{ item.is_anonymous ? (item.anonymous_label || 'Anonymous') : (item.user_full_name || 'N/A') }}
                <span v-if="!item.is_anonymous && item.user_email"> ({{ item.user_email }})</span>
              </p>
              <p class="text-xs text-slate-500">
                Organization: {{ item.organization_name || 'N/A' }}
                <span v-if="item.organization_type"> ({{ item.organization_type }})</span>
              </p>
              <p class="text-xs text-slate-500">Department: {{ item.department_name || 'Not specified' }}</p>
              <p v-if="item.organization_email || item.organization_phone" class="text-xs text-slate-500">
                Contact: {{ item.organization_email || 'N/A' }}<span v-if="item.organization_phone"> | {{ item.organization_phone }}</span>
              </p>
              <p v-if="item.admin_response" class="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                Admin Response: {{ item.admin_response }}
              </p>
              <p v-if="item.reviewed_at" class="text-xs text-slate-500">
                Reviewed by {{ item.reviewer_name || 'Admin' }} at {{ item.reviewed_at }}
              </p>
            </div>
            <div class="flex gap-2">
              <span
                v-if="needsResponse(item)"
                class="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800"
              >
                Needs Response
              </span>
              <span class="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{{ item.priority }}</span>
              <span class="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{{ item.status }}</span>
            </div>
          </div>

          <div class="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
            <button class="rounded-full bg-[var(--app-primary)] px-4 py-2 text-xs font-semibold text-white" @click="router.push(`${complaintsRoutePrefix}/${item.id}`)">
              Review & Respond
            </button>
            <button class="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700" @click="openChat(item)">
              Open Chat
            </button>
            <button class="rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700" @click="deleteComplaint(item)">
              Delete
            </button>
          </div>
        </article>
      </div>

      <div class="mt-3 flex items-center justify-between text-xs text-slate-600">
        <p>Showing {{ paginatedComplaints.length }} of {{ filteredComplaints.length }} complaints</p>
        <div class="flex items-center gap-2">
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="page <= 1" @click="goToPage(page - 1)">Prev</button>
          <span>Page {{ page }} / {{ totalPages }}</span>
          <button class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50" :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</button>
        </div>
      </div>
    </section>

    <LiveSupportModal
      :visible="Boolean(activeChatComplaintId)"
      :complaint-id="activeChatComplaintId"
      :current-role="isOrgAdmin ? 'org_admin' : 'super_admin'"
      :title="`Live Chat - ${activeChatTitle}`"
      @close="activeChatComplaintId = null"
    />
  </section>
</template>
