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
  }
});
</script>

<template>
  <section class="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
    <h2 class="mb-3 text-xl font-bold text-slate-900">Recent Organizations</h2>
    <p v-if="loading" class="mb-3 text-sm text-slate-500">Loading organizations...</p>
    <p v-else-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="organizations.length === 0" class="mb-3 text-sm text-slate-500">No organizations found.</p>
    <div class="overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="text-slate-500">
          <tr>
            <th class="pb-2 pr-4">Name</th>
            <th class="pb-2 pr-4">Status</th>
            <th class="pb-2 pr-4">Complaints</th>
            <th class="pb-2">Last Active</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="organization in organizations"
            :key="organization.id || organization.name + organization.lastActive"
            class="border-t border-slate-100"
          >
            <td class="py-2 pr-4">{{ organization.name }}</td>
            <td class="py-2 pr-4">
              <span
                class="rounded-md px-2 py-1 text-xs font-semibold"
                :class="organization.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'"
              >
                {{ organization.status }}
              </span>
            </td>
            <td class="py-2 pr-4">{{ organization.complaints }}</td>
            <td class="py-2">{{ organization.lastActive }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
