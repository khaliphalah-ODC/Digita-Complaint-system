<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import LiveSupportModal from '../../components/LiveSupportModal.vue';
import MobileDataCardList from '../../components/MobileDataCardList.vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import { useSessionStore } from '../../stores/session';

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

const getComplaintWorkflowLabel = (item) => {
  const status = String(item?.status || 'submitted').toLowerCase();
  if (status === 'closed') return 'Closed';
  if (status === 'resolved') return 'Resolved';
  if (status === 'in_review') {
    return item?.department_name || item?.reviewer_name || item?.reviewed_at ? 'Assigned' : 'Reviewed';
  }
  return 'Submitted';
};

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

const openComplaints = computed(() =>
  complaints.value.filter((item) => ['submitted', 'in_review'].includes(String(item.status || '').toLowerCase()))
);

const complaintsNeedingResponse = computed(() =>
  complaints.value.filter((item) => needsResponse(item))
);

const unassignedComplaints = computed(() =>
  openComplaints.value.filter((item) => !item.department_name && !item.department_id)
);

const urgentComplaints = computed(() =>
  complaints.value.filter((item) => String(item.priority || '').toLowerCase() === 'urgent')
);

const summaryCards = computed(() => [
  {
    label: 'Open Queue',
    value: openComplaints.value.length,
    detail: 'submitted and in review'
  },
  {
    label: 'Needs Response',
    value: complaintsNeedingResponse.value.length,
    detail: 'awaiting official reply'
  },
  {
    label: 'Unassigned',
    value: unassignedComplaints.value.length,
    detail: 'missing department routing'
  },
  {
    label: 'Urgent Cases',
    value: urgentComplaints.value.length,
    detail: 'high-priority complaints'
  }
]);

const totalPages = computed(() => Math.max(1, Math.ceil(filteredComplaints.value.length / pageSize)));

const paginatedComplaints = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredComplaints.value.slice(start, start + pageSize);
});
const mobileCardFields = [
  { key: 'complaint', label: 'Complaint' },
  { key: 'reporter', label: 'Reporter' },
  { key: 'department', label: 'Department' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'workflow', label: 'Workflow' }
];

const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

const statusBadgeClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'resolved') return 'app-badge app-badge-success';
  if (normalized === 'closed') return 'app-badge app-badge-neutral';
  return 'app-badge app-badge-warning';
};

const priorityBadgeClass = (priority) => {
  const normalized = String(priority || '').toLowerCase();
  if (normalized === 'urgent' || normalized === 'high') return 'app-badge app-badge-danger';
  if (normalized === 'medium') return 'app-badge app-badge-warning';
  return 'app-badge app-badge-neutral';
};

onMounted(fetchComplaints);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <PageHeader
          kicker="Case Queue"
          title="Organization Complaints"
          description="Review complaints scoped to your organization, prioritize responses, route work to departments, and continue complaint handling from one consistent queue."
        >
          <template #actions>
            <button class="app-btn-secondary" @click="fetchComplaints">
              Refresh Queue
            </button>
            <RouterLink to="/org-admin/escalations" class="app-btn-primary">
              Review Escalations
            </RouterLink>
          </template>
        </PageHeader>

        <p v-if="error" class="rounded-[var(--app-radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </p>

        <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="item in summaryCards" :key="item.label" class="app-section-card">
            <p class="app-metric-label">{{ item.label }}</p>
            <p class="app-metric-value">{{ loading ? '...' : item.value }}</p>
            <p class="app-metric-detail">{{ item.detail }}</p>
          </article>
        </section>

        <section class="app-section-card">
          <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div class="app-section-heading">
              <p class="app-kicker">Filters</p>
              <h2 class="app-section-title">Complaint Workflow Table</h2>
              <p class="app-section-description">Filter the queue by keyword, status, and priority, then continue review from the detailed complaint view.</p>
            </div>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[34rem]">
              <input v-model="search" placeholder="Search complaint or tracking..." class="app-input">
              <select v-model="statusFilter" class="app-select">
                <option value="all">All status</option>
                <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
              </select>
              <select v-model="priorityFilter" class="app-select">
                <option value="all">All priority</option>
                <option v-for="priority in priorityOptions" :key="priority" :value="priority">{{ priority }}</option>
              </select>
            </div>
          </div>

          <p v-if="loading" class="text-sm text-[var(--app-muted-color)]">Loading complaints...</p>
          <p v-else-if="filteredComplaints.length === 0" class="app-empty-state">No complaints match the current queue filters.</p>

          <MobileDataCardList
            v-else
            :items="paginatedComplaints"
            :fields="mobileCardFields"
            key-field="id"
          >
            <template #field-complaint="{ item }">
              <div class="min-w-0">
                <p class="break-words font-semibold text-[var(--app-title-color)]">{{ item.title || 'Untitled Complaint' }}</p>
                <p class="mt-1 text-xs text-[var(--app-muted-color)]">Tracking: {{ item.tracking_code || 'N/A' }}</p>
              </div>
            </template>
            <template #field-reporter="{ item }">
              <div class="min-w-0">
                <p class="break-words font-medium text-[var(--app-title-color)]">{{ item.is_anonymous ? (item.anonymous_label || 'Anonymous') : (item.user_full_name || 'N/A') }}</p>
                <p v-if="!item.is_anonymous && item.user_email" class="mt-1 break-all text-xs text-[var(--app-muted-color)]">{{ item.user_email }}</p>
              </div>
            </template>
            <template #field-department="{ item }">
              <p class="break-words font-medium text-[var(--app-title-color)]">{{ item.department_name || 'Unassigned' }}</p>
            </template>
            <template #field-priority="{ item }">
              <span :class="priorityBadgeClass(item.priority)">
                {{ item.priority || 'medium' }}
              </span>
            </template>
            <template #field-status="{ item }">
              <span :class="statusBadgeClass(item.status)">
                {{ item.status || 'submitted' }}
              </span>
            </template>
            <template #field-workflow="{ item }">
              <div class="app-action-row flex flex-wrap gap-2">
                <span v-if="needsResponse(item)" class="app-badge app-badge-warning">Needs Response</span>
                <span class="app-badge app-badge-neutral">{{ getComplaintWorkflowLabel(item) }}</span>
              </div>
            </template>
            <template #actions="{ item }">
              <div class="app-action-row flex flex-wrap gap-2">
                <button class="app-btn-primary min-h-[36px] px-3 py-1.5 text-xs" @click="router.push(`${complaintsRoutePrefix}/${item.id}`)">
                  Review
                </button>
                <button class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs" @click="openChat(item)">
                  Chat
                </button>
                <button class="app-btn-danger min-h-[36px] px-3 py-1.5 text-xs" @click="deleteComplaint(item)">
                  Delete
                </button>
              </div>
            </template>
          </MobileDataCardList>

          <div v-if="filteredComplaints.length > 0" class="hidden md:block app-table-shell overflow-x-auto">
            <table class="app-table app-table-responsive min-w-full">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Reporter</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Workflow</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in paginatedComplaints" :key="item.id">
                  <td data-label="Complaint">
                    <div class="min-w-[220px]">
                      <p class="font-semibold text-[var(--app-title-color)]">{{ item.title || 'Untitled Complaint' }}</p>
                      <p class="text-xs text-[var(--app-muted-color)]">Tracking: {{ item.tracking_code || 'N/A' }}</p>
                    </div>
                  </td>
                  <td data-label="Reporter">
                    <div class="min-w-[180px]">
                      <p>{{ item.is_anonymous ? (item.anonymous_label || 'Anonymous') : (item.user_full_name || 'N/A') }}</p>
                      <p v-if="!item.is_anonymous && item.user_email" class="text-xs text-[var(--app-muted-color)]">{{ item.user_email }}</p>
                    </div>
                  </td>
                  <td data-label="Department">{{ item.department_name || 'Unassigned' }}</td>
                  <td data-label="Priority">
                    <span :class="priorityBadgeClass(item.priority)">
                      {{ item.priority || 'medium' }}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span :class="statusBadgeClass(item.status)">
                      {{ item.status || 'submitted' }}
                    </span>
                  </td>
                  <td data-label="Workflow">
                    <div class="app-action-row flex flex-wrap gap-2">
                      <span v-if="needsResponse(item)" class="app-badge app-badge-warning">Needs Response</span>
                      <span class="app-badge app-badge-neutral">{{ getComplaintWorkflowLabel(item) }}</span>
                    </div>
                  </td>
                  <td data-label="Actions" data-actions="true">
                    <div class="app-action-row flex flex-wrap gap-2">
                      <button class="app-btn-primary min-h-[36px] px-3 py-1.5 text-xs" @click="router.push(`${complaintsRoutePrefix}/${item.id}`)">
                        Review
                      </button>
                      <button class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs" @click="openChat(item)">
                        Chat
                      </button>
                      <button class="app-btn-danger min-h-[36px] px-3 py-1.5 text-xs" @click="deleteComplaint(item)">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-3 flex flex-col gap-2 text-xs text-[var(--app-muted-color)] sm:flex-row sm:items-center sm:justify-between">
            <p>Showing {{ paginatedComplaints.length }} of {{ filteredComplaints.length }} complaints</p>
            <div class="flex items-center gap-2">
              <button class="app-btn-secondary min-h-[34px] px-3 py-1 text-xs disabled:opacity-50" :disabled="page <= 1" @click="goToPage(page - 1)">Prev</button>
              <span>Page {{ page }} / {{ totalPages }}</span>
              <button class="app-btn-secondary min-h-[34px] px-3 py-1 text-xs disabled:opacity-50" :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</button>
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
      </div>
    </div>
  </section>
</template>
