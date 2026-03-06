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
  <section class="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
    <h2 class="mb-3 text-xl font-bold text-slate-900">Activity Feed</h2>
    <p v-if="loading" class="mb-3 text-sm text-slate-500">Loading activity...</p>
    <p v-else-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="items.length === 0" class="mb-3 text-sm text-slate-500">No recent activity.</p>
    <ul class="space-y-3">
      <li v-for="item in items" :key="`${item.text}-${item.date}`" class="flex items-center justify-between gap-3">
        <span class="rounded-lg px-2 py-1 text-sm" :class="item.tone">{{ item.text }}</span>
        <span class="text-sm text-slate-500">{{ item.date }}</span>
      </li>
    </ul>
  </section>
</template>
