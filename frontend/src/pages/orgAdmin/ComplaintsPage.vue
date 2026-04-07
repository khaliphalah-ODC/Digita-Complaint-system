<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { complaintsApi, extractApiError } from '../../services/api';
import LiveSupportModal from '../../components/LiveSupportModal.vue';
import MobileDataCardList from '../../components/MobileDataCardList.vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import DataTable from '../../components/ui/DataTable.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
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

const needsResponse = (item) => !String(item?.admin_response || '').trim();

const getComplaintWorkflowLabel = (item) => {
  const status = String(item?.status || 'submitted').toLowerCase();
  if (status === 'closed') return 'Closed';
  if (status === 'resolved') return 'Resolved';
  if (status === 'in_review') {
    return item?.assigned_name ? 'Assigned' : 'Reviewed';
  }
  return 'Submitted';
};

const fetchComplaints = async () => {
  loading.value = true;
  error.value = '';
  try {
    complaints.value = await complaintsApi.list() || [];
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
    await complaintsApi.remove(item.id);
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
const tableColumns = [
  { key: 'complaint', label: 'Complaint' },
  { key: 'reporter', label: 'Reporter' },
  { key: 'department', label: 'Department' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'workflow', label: 'Workflow' },
  { key: 'actions', label: 'Action' }
];

const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
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

          <LoadingSpinner v-if="loading" label="Loading complaints..." />
          <EmptyState
            v-else-if="filteredComplaints.length === 0"
            title="No complaints match the current queue filters."
            description="Try a broader status, priority, or keyword search."
          />

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
              <StatusBadge :value="item.priority || 'medium'" />
            </template>
            <template #field-status="{ item }">
              <StatusBadge :value="item.status || 'submitted'" />
            </template>
            <template #field-workflow="{ item }">
              <div class="app-action-row flex flex-wrap gap-2">
                <StatusBadge v-if="needsResponse(item)" value="Needs Response" tone="warning" />
                <StatusBadge :value="getComplaintWorkflowLabel(item)" tone="neutral" />
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

          <DataTable
            :columns="tableColumns"
            :rows="paginatedComplaints"
            :page="page"
            :total-pages="totalPages"
            :total-items="filteredComplaints.length"
            :visible-count="paginatedComplaints.length"
            pagination-label="complaints"
            @update:page="goToPage"
          >
            <template #cell-complaint="{ row }">
              <div class="min-w-[220px]">
                <p class="font-semibold text-[var(--app-title-color)]">{{ row.title || 'Untitled Complaint' }}</p>
                <p class="text-xs text-[var(--app-muted-color)]">Tracking: {{ row.tracking_code || 'N/A' }}</p>
              </div>
            </template>
            <template #cell-reporter="{ row }">
              <div class="min-w-[180px]">
                <p>{{ row.is_anonymous ? (row.anonymous_label || 'Anonymous') : (row.user_full_name || 'N/A') }}</p>
                <p v-if="!row.is_anonymous && row.user_email" class="text-xs text-[var(--app-muted-color)]">{{ row.user_email }}</p>
              </div>
            </template>
            <template #cell-department="{ row }">{{ row.department_name || 'Unassigned' }}</template>
            <template #cell-priority="{ row }">
              <StatusBadge :value="row.priority || 'medium'" />
            </template>
            <template #cell-status="{ row }">
              <StatusBadge :value="row.status || 'submitted'" />
            </template>
            <template #cell-workflow="{ row }">
              <div class="app-action-row flex flex-wrap gap-2">
                <StatusBadge v-if="needsResponse(row)" value="Needs Response" tone="warning" />
                <StatusBadge :value="getComplaintWorkflowLabel(row)" tone="neutral" />
              </div>
            </template>
            <template #cell-actions="{ row }">
              <div class="app-action-row flex flex-wrap gap-2">
                <button class="app-btn-primary min-h-[36px] px-3 py-1.5 text-xs" @click="router.push(`${complaintsRoutePrefix}/${row.id}`)">
                  Review
                </button>
                <button class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs" @click="openChat(row)">
                  Chat
                </button>
                <button class="app-btn-danger min-h-[36px] px-3 py-1.5 text-xs" @click="deleteComplaint(row)">
                  Delete
                </button>
              </div>
            </template>
          </DataTable>
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
