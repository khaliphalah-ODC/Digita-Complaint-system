<script setup>
defineProps({
  items: {
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
    default: 'Activity Feed'
  },
  description: {
    type: String,
    default: 'Recent platform events relevant to super-admin oversight.'
  }
});
</script>

<template>
  <section class="app-section-card">
    <header class="mb-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
        <p class="mt-1 text-[0.98rem] text-slate-600">{{ description }}</p>
      </div>
    </header>

    <p v-if="loading" class="mb-3 text-sm text-slate-500">Loading activity...</p>
    <p v-else-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="items.length === 0" class="mb-3 text-sm text-slate-500">No recent activity.</p>

    <ul v-else class="space-y-3">
      <li
        v-for="item in items"
        :key="`${item.text}-${item.date}`"
        class="flex flex-col gap-2 rounded-[18px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="flex items-start gap-3">
          <span class="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--app-primary)]" />
          <div>
            <p class="text-[0.98rem] font-medium text-slate-800">{{ item.text }}</p>
          </div>
        </div>
        <span class="text-[0.96rem] text-slate-500">{{ item.date }}</span>
      </li>
    </ul>
  </section>
</template>
