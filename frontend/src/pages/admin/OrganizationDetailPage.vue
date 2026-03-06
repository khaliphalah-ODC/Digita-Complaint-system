<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api, { extractApiError, unwrapResponse } from '../../services/api.js';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const organization = ref(null);
const users = ref([]);
const complaints = ref([]);
const departments = ref([]);

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const orgUsers = computed(() => {
  if (!organization.value) return [];
  return users.value.filter((u) => Number(u.organization_id) === Number(organization.value.organization_id));
});

const orgComplaints = computed(() => {
  const userIds = new Set(orgUsers.value.map((u) => Number(u.id)));
  return complaints.value.filter((c) => userIds.has(Number(c.user_id)));
});

const activeComplaintsCount = computed(() => {
  return orgComplaints.value.filter((c) => c.status === 'submitted' || c.status === 'in_review').length;
});

const kpis = computed(() => {
  const rows = orgComplaints.value;
  return {
    submitted: rows.filter((c) => c.status === 'submitted').length,
    inReview: rows.filter((c) => c.status === 'in_review').length,
    resolved: rows.filter((c) => c.status === 'resolved').length
  };
});

const recent30DaysTrend = computed(() => {
  const counts = new Array(30).fill(0);
  const today = new Date();
  orgComplaints.value.forEach((row) => {
    const d = new Date(row.created_at);
    if (Number.isNaN(d.getTime())) return;
    const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 30) {
      counts[29 - diffDays] += 1;
    }
  });
  return counts;
});

const sparklinePath = computed(() => {
  const points = recent30DaysTrend.value;
  const width = 240;
  const height = 64;
  const maxVal = Math.max(...points, 1);

  return points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - (value / maxVal) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');
});

const departmentCards = computed(() => {
  if (!organization.value) return [];
  const filtered = departments.value.filter((d) => Number(d.organization_id) === Number(organization.value.organization_id));
  const userByDept = new Map();
  orgUsers.value.forEach((u) => {
    const key = Number(u.department_id);
    if (!Number.isFinite(key)) return;
    userByDept.set(key, (userByDept.get(key) || 0) + 1);
  });

  const userDeptByUserId = new Map();
  orgUsers.value.forEach((u) => userDeptByUserId.set(Number(u.id), Number(u.department_id)));
  const activeComplaintsByDept = new Map();
  orgComplaints.value
    .filter((c) => c.status === 'submitted' || c.status === 'in_review')
    .forEach((c) => {
      const deptId = userDeptByUserId.get(Number(c.user_id));
      if (!Number.isFinite(deptId)) return;
      activeComplaintsByDept.set(deptId, (activeComplaintsByDept.get(deptId) || 0) + 1);
    });

  if (filtered.length === 0) {
    return [{
      id: 'default-team',
      name: 'General Team',
      usersCount: orgUsers.value.length,
      activeComplaintsCount: activeComplaintsCount.value
    }];
  }

  return filtered.map((dept) => ({
    id: dept.id,
    name: dept.name || `Department #${dept.id}`,
    usersCount: userByDept.get(Number(dept.id)) || 0,
    activeComplaintsCount: activeComplaintsByDept.get(Number(dept.id)) || 0
  }));
});

const mapUrl = computed(() => {
  const addr = organization.value?.address;
  if (!addr) return '#';
  return `https://maps.google.com/?q=${encodeURIComponent(addr)}`;
});

const exportSnapshotPdf = () => {
  if (!organization.value) return;
  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Organization Snapshot</title></head>
  <body style="font-family: Arial, sans-serif; padding: 24px;">
    <h2>Organization Snapshot</h2>
    <p><strong>Name:</strong> ${organization.value.name || 'N/A'}</p>
    <p><strong>ID:</strong> ${organization.value.organization_id || 'N/A'}</p>
    <p><strong>Type:</strong> ${organization.value.organization_type || 'N/A'}</p>
    <p><strong>Status:</strong> ${organization.value.status || 'N/A'}</p>
    <p><strong>Email:</strong> ${organization.value.email || 'N/A'}</p>
    <p><strong>Phone:</strong> ${organization.value.phone || 'N/A'}</p>
    <p><strong>Address:</strong> ${organization.value.address || 'N/A'}</p>
    <hr />
    <h3>Complaint KPIs</h3>
    <p><strong>Submitted:</strong> ${kpis.value.submitted}</p>
    <p><strong>In Review:</strong> ${kpis.value.inReview}</p>
    <p><strong>Resolved:</strong> ${kpis.value.resolved}</p>
    <p><strong>Total Complaint Volume:</strong> ${organization.value.complaints_count || 0}</p>
    <hr />
    <h3>Department Team Summary</h3>
    ${departmentCards.value
      .map((d) => `<p><strong>${d.name}</strong> - Users: ${d.usersCount}, Active Complaints: ${d.activeComplaintsCount}</p>`)
      .join('')}
    <script>window.print()<\\/script>
  </body></html>`;

  const popup = window.open('', '_blank', 'width=900,height=700');
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
};

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const orgId = route.params.id;
    const [orgRes, usersRes, complaintRes, deptRes] = await Promise.all([
      api.get(`/organization/${orgId}`),
      api.get('/users'),
      api.get('/complaint'),
      api.get('/department')
    ]);

    organization.value = ensureSuccess(unwrapResponse(orgRes), 'Failed to fetch organization');
    users.value = ensureSuccess(unwrapResponse(usersRes), 'Failed to fetch users') || [];
    complaints.value = ensureSuccess(unwrapResponse(complaintRes), 'Failed to fetch complaints') || [];
    departments.value = ensureSuccess(unwrapResponse(deptRes), 'Failed to fetch departments') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load organization detail');
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Organization Detail</h1>
        <p class="text-sm text-slate-600">360-degree view of organization, team, and complaint performance.</p>
      </div>
      <div class="flex gap-2">
        <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="load">Refresh</button>
        <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="exportSnapshotPdf">Export Snapshot (PDF)</button>
        <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="router.push('/admin/organizations')">Back</button>
      </div>
    </header>

    <p v-if="loading" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Loading organization detail...</p>
    <p v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</p>

    <template v-else-if="organization">
      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4">
            <div class="relative">
              <img
                v-if="organization.logo"
                :src="organization.logo"
                alt="Organization Logo"
                class="h-16 w-16 rounded-full border border-slate-200 object-cover"
              >
              <div v-else class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">ORG</div>
              <span
                class="absolute -bottom-0 -right-0 h-3 w-3 rounded-full border border-white"
                :class="organization.status === 'active' ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'"
              ></span>
            </div>
            <div>
              <h2 class="text-2xl font-black text-slate-900">{{ organization.name }}</h2>
              <div class="mt-1 flex flex-wrap gap-2">
                <span class="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">ID: {{ organization.organization_id }}</span>
                <span class="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{{ organization.organization_type }}</span>
              </div>
            </div>
          </div>

          <article class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p class="text-xs uppercase tracking-wide text-slate-500">Total Complaint Volume</p>
            <p class="mt-1 text-4xl font-black text-slate-900">{{ organization.complaints_count || 0 }}</p>
          </article>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 class="text-lg font-bold text-slate-900">Contact & Location</h3>
          <div class="mt-3 grid grid-cols-1 gap-2 text-sm">
            <p><span class="font-semibold text-slate-700">Email:</span> {{ organization.email || 'N/A' }}</p>
            <p><span class="font-semibold text-slate-700">Phone:</span> {{ organization.phone || 'N/A' }}</p>
            <p class="truncate"><span class="font-semibold text-slate-700">Address:</span> {{ organization.address || 'N/A' }}</p>
            <a :href="mapUrl" target="_blank" rel="noopener noreferrer" class="inline-block w-max rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">
              View on Map
            </a>
          </div>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 class="text-lg font-bold text-slate-900">Recent Activity (30 Days)</h3>
          <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <svg viewBox="0 0 240 64" class="h-20 w-full">
              <polyline
                fill="none"
                stroke="#3b82f6"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                :points="sparklinePath"
              />
            </svg>
            <p class="text-xs text-slate-500">Trend based on complaint created dates in the last 30 days.</p>
          </div>
        </article>
      </section>

      <section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article class="rounded-2xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Submitted</p>
          <p class="mt-2 text-3xl font-black text-blue-700">{{ kpis.submitted }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">In Review</p>
          <p class="mt-2 text-3xl font-black text-amber-600">{{ kpis.inReview }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Resolved</p>
          <p class="mt-2 text-3xl font-black text-emerald-600">{{ kpis.resolved }}</p>
        </article>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 class="text-lg font-bold text-slate-900">Department & Team</h3>
        <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="dept in departmentCards" :key="dept.id" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-base font-semibold text-slate-900">{{ dept.name }}</p>
            <p class="mt-2 text-sm text-slate-700">Users: <span class="font-semibold">{{ dept.usersCount }}</span></p>
            <p class="text-sm text-slate-700">Active Complaints: <span class="font-semibold">{{ dept.activeComplaintsCount }}</span></p>
          </article>
        </div>
      </section>
    </template>
  </section>
</template>
