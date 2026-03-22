<script setup>
defineProps({
  organizations: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'Recent Organizations'
  },
  description: {
    type: String,
    default: 'Recently updated organizations and their current status.'
  }
});
</script>

<template>
  <section class="app-section-card">
    <header class="mb-4">
      <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
      <p class="mt-1 text-sm text-slate-600">{{ description }}</p>
    </header>

    <p v-if="loading" class="mb-3 text-sm text-slate-500">Loading organizations...</p>
    <p v-else-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="organizations.length === 0" class="mb-3 text-sm text-slate-500">No organizations found.</p>

    <div v-else class="app-table-shell overflow-x-auto">
      <table class="app-table min-w-full text-left text-sm">
        <thead>
          <tr>
            <th class="px-4 py-3 font-medium">Organization</th>
            <th class="px-4 py-3 font-medium">Type</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Org Admin</th>
            <th class="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="organization in organizations"
            :key="organization.id || organization.name + organization.lastActive"
            class="text-slate-700 first:border-t-0"
          >
            <td class="px-4 py-3 font-medium text-slate-900">{{ organization.name }}</td>
            <td class="px-4 py-3">{{ organization.type || 'Organization' }}</td>
            <td class="px-4 py-3">
              <span
                class="app-badge"
                :class="organization.status === 'Active'
                  ? 'app-badge-success'
                  : 'app-badge-neutral'"
              >
                {{ organization.status }}
              </span>
            </td>
            <td class="px-4 py-3">{{ organization.organization_admin?.full_name || 'Not assigned' }}</td>
            <td class="px-4 py-3 text-slate-500">{{ organization.lastActive }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
