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
  }
});
</script>

<template>
  <section class="app-shell-panel mt-5 rounded-[30px] p-5">
    <p class="app-kicker">Platform Pulse</p>
    <h2 class="mb-3 mt-2 text-2xl font-bold text-slate-900">Activity Feed</h2>
    <p v-if="loading" class="mb-3 text-sm text-slate-500">Loading activity...</p>
    <p v-else-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="items.length === 0" class="mb-3 text-sm text-slate-500">No recent activity.</p>
    <ul class="space-y-3">
      <li v-for="item in items" :key="`${item.text}-${item.date}`" class="flex flex-col items-start justify-between gap-2 rounded-[22px] border border-slate-200/70 bg-white/70 px-4 py-3 sm:flex-row sm:items-center">
        <span class="rounded-lg px-2 py-1 text-sm" :class="item.tone">{{ item.text }}</span>
        <span class="text-sm text-slate-500">{{ item.date }}</span>
      </li>
    </ul>
  </section>
</template>
