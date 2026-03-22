<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../services/api';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import { useUiToastStore } from '../../stores/uiToast';
import { useSessionStore } from '../../stores/session';

const session = useSessionStore();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const departments = ref([]);
const organizations = ref([]);
const assessments = ref([]);
const editingId = ref(null);
const search = ref('');
const page = ref(1);
const pageSize = 8;
const uiToast = useUiToastStore();
const isOrgAdmin = computed(() => session.currentUser?.role === 'org_admin');

const form = reactive({
  organization_id: '',
  name: '',
  description: '',
  accessment_id: ''
});

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const resetForm = () => {
  editingId.value = null;
  form.organization_id = isOrgAdmin.value ? String(session.currentUser?.organization_id || '') : '';
  form.name = '';
  form.description = '';
  form.accessment_id = '';
};

const fetchDependencies = async () => {
  const [orgRes, assessmentRes] = await Promise.all([api.get('/organization'), api.get('/assessments')]);
  organizations.value = ensureSuccess(unwrapResponse(orgRes), 'Failed to fetch organizations') || [];
  assessments.value = ensureSuccess(unwrapResponse(assessmentRes), 'Failed to fetch assessments') || [];
};

const fetchDepartments = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/department');
    departments.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch departments') || [];
    await fetchDependencies();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch departments');
  } finally {
    loading.value = false;
  }
};

const startEdit = (row) => {
  editingId.value = row.id;
  form.organization_id = String(row.organization_id ?? '');
  form.name = row.name || '';
  form.description = row.description || '';
  form.accessment_id = String(row.accessment_id ?? '');
};

const saveDepartment = async () => {
  if (!form.organization_id || !form.name.trim()) {
    error.value = 'organization_id and name are required.';
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    const payload = {
      organization_id: Number(form.organization_id),
      name: form.name.trim(),
      description: form.description.trim() || null,
      accessment_id: form.accessment_id ? Number(form.accessment_id) : null
    };

    if (editingId.value) {
      await api.put(`/department/${editingId.value}`, payload);
      uiToast.success('Department updated successfully.');
    } else {
      await api.post('/department', payload);
      uiToast.success('Department created successfully.');
    }

    resetForm();
    await fetchDepartments();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save department');
    uiToast.error(error.value);
  } finally {
    saving.value = false;
  }
};

const deleteDepartment = async (row) => {
  const ok = window.confirm(`Delete department "${row.name}"?`);
  if (!ok) return;
  error.value = '';
  try {
    await api.delete(`/department/${row.id}`);
    uiToast.success('Department deleted successfully.');
    await fetchDepartments();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete department');
    uiToast.error(error.value);
  }
};

const organizationNameById = computed(() => {
  const map = new Map();
  for (const row of organizations.value) map.set(Number(row.organization_id), row.name);
  return map;
});

const filteredDepartments = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return departments.value;
  return departments.value.filter((row) => {
    return (
      String(row.name || '').toLowerCase().includes(keyword) ||
      String(row.description || '').toLowerCase().includes(keyword) ||
      String(organizationNameById.value.get(Number(row.organization_id)) || '')
        .toLowerCase()
        .includes(keyword)
    );
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredDepartments.value.length / pageSize)));
const currentPage = computed(() => Math.min(page.value, totalPages.value));
const paginatedDepartments = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredDepartments.value.slice(start, start + pageSize);
});

const goToPage = (nextPage) => {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
};

const linkedAssessments = computed(() =>
  departments.value.filter((row) => row.accessment_id)
);

const summaryCards = computed(() => [
  {
    label: 'Total Departments',
    value: departments.value.length,
    detail: 'organization structure'
  },
  {
    label: 'Linked Assessments',
    value: linkedAssessments.value.length,
    detail: 'connected records'
  },
  {
    label: 'Unlinked Departments',
    value: Math.max(0, departments.value.length - linkedAssessments.value.length),
    detail: 'no assessment linked'
  }
]);

onMounted(fetchDepartments);
onMounted(async () => {
  if (!session.currentUser) await session.fetchCurrentUser();
  resetForm();
});
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <PageHeader
          kicker="Department Structure"
          title="Department Management"
          description="Create, update, and organize departments inside your organization so complaint assignment and operational ownership stay clear."
        >
          <template #actions>
            <button class="app-btn-secondary" @click="fetchDepartments">
              Refresh Departments
            </button>
            <RouterLink to="/org-admin/complaints" class="app-btn-primary">
              View Complaint Queue
            </RouterLink>
          </template>
        </PageHeader>

        <p v-if="error" class="rounded-[var(--app-radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </p>

        <section class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <article v-for="item in summaryCards" :key="item.label" class="app-section-card">
            <p class="app-metric-label">{{ item.label }}</p>
            <p class="app-metric-value">{{ loading ? '...' : item.value }}</p>
            <p class="app-metric-detail">{{ item.detail }}</p>
          </article>
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr),minmax(320px,0.95fr)]">
          <section class="app-section-card">
            <div class="app-section-heading mb-4">
              <p class="app-kicker">Department Form</p>
              <h2 class="app-section-title">{{ editingId ? 'Edit Department' : 'Create Department' }}</h2>
              <p class="app-section-description">Use departments to improve complaint routing and clarify ownership inside the organization.</p>
            </div>

            <form class="grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="saveDepartment">
              <select v-if="!isOrgAdmin" v-model="form.organization_id" class="app-select">
                <option value="">Select organization</option>
                <option v-for="row in organizations" :key="row.organization_id" :value="String(row.organization_id)">
                  {{ row.name }} (#{{ row.organization_id }})
                </option>
              </select>
              <div v-else class="flex items-center rounded-[var(--app-radius-md)] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-3 py-3 text-sm text-[var(--app-muted-color)]">
                Organization ID: {{ session.currentUser?.organization_id || 'N/A' }}
              </div>
              <input v-model="form.name" placeholder="Department name" class="app-input">
              <textarea v-model="form.description" placeholder="Description (optional)" class="app-textarea md:col-span-2" rows="2" />
              <select v-model="form.accessment_id" class="app-select">
                <option value="">Link assessment (optional)</option>
                <option v-for="row in assessments" :key="row.id" :value="String(row.id)">
                  #{{ row.id }} - {{ row.complaint_title || row.findings?.slice(0, 40) || 'Assessment' }}
                </option>
              </select>
              <div class="flex flex-col gap-2 sm:flex-row">
                <button :disabled="saving" type="submit" class="app-btn-primary">
                  {{ saving ? 'Saving...' : editingId ? 'Update Department' : 'Create Department' }}
                </button>
                <button type="button" class="app-btn-secondary" @click="resetForm">
                  Clear
                </button>
              </div>
            </form>
          </section>

          <section class="app-section-card">
            <div class="app-section-heading mb-4">
              <p class="app-kicker">Quick Notes</p>
              <h2 class="app-section-title">Routing Readiness</h2>
              <p class="app-section-description">Departments work best when they are clearly named, actively maintained, and connected to the complaints they support.</p>
            </div>

            <div class="space-y-3">
              <article class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4">
                <p class="text-sm font-semibold text-[var(--app-title-color)]">Use clear department ownership</p>
                <p class="mt-1 text-sm text-[var(--app-muted-color)]">This keeps complaint assignment and staff follow-up more predictable.</p>
              </article>
              <article class="rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] p-4">
                <p class="text-sm font-semibold text-[var(--app-title-color)]">Keep descriptions practical</p>
                <p class="mt-1 text-sm text-[var(--app-muted-color)]">Short descriptions make routing decisions easier for the team.</p>
              </article>
            </div>
          </section>
        </section>

        <section class="app-section-card">
          <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div class="app-section-heading">
              <p class="app-kicker">Directory</p>
              <h2 class="app-section-title">Department Table</h2>
              <p class="app-section-description">Search and manage departments with a cleaner, organization-focused directory.</p>
            </div>
            <input v-model="search" placeholder="Search departments..." class="app-input lg:max-w-sm">
          </div>

          <p v-if="loading" class="text-sm text-[var(--app-muted-color)]">Loading departments...</p>
          <p v-else-if="filteredDepartments.length === 0" class="app-empty-state">No departments match the current search.</p>

          <div v-else class="app-table-shell overflow-x-auto">
            <table class="app-table min-w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Organization</th>
                  <th>Assessment</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in paginatedDepartments" :key="row.id">
                  <td class="font-medium text-[var(--app-title-color)]">{{ row.name }}</td>
                  <td>{{ organizationNameById.get(Number(row.organization_id)) || row.organization_id }}</td>
                  <td>{{ row.accessment_id ?? 'N/A' }}</td>
                  <td>{{ row.created_at }}</td>
                  <td>
                    <div class="flex flex-wrap gap-2">
                      <button class="app-btn-secondary min-h-[36px] px-3 py-1.5 text-xs" @click="startEdit(row)">Edit</button>
                      <button class="inline-flex min-h-[36px] items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-danger)]/20 bg-[var(--app-danger-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-danger)]" @click="deleteDepartment(row)">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="filteredDepartments.length > 0" class="mt-3 flex flex-col gap-2 text-xs text-[var(--app-muted-color)] sm:flex-row sm:items-center sm:justify-between">
            <p>Showing {{ paginatedDepartments.length }} of {{ filteredDepartments.length }} departments</p>
            <div class="flex items-center gap-2">
              <button class="app-btn-secondary min-h-[34px] px-3 py-1 text-xs disabled:opacity-50" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
              <span>Page {{ currentPage }} / {{ totalPages }}</span>
              <button class="app-btn-secondary min-h-[34px] px-3 py-1 text-xs disabled:opacity-50" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
