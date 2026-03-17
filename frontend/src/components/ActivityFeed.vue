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
  theme: {
    type: String,
    default: 'light'
  }
});
</script>

<template>
  <section :class="theme === 'dark' ? 'app-dark-panel mt-5 rounded-[30px] p-5' : 'app-shell-panel mt-5 rounded-[30px] p-5'">
    <p :class="theme === 'dark' ? 'app-dark-kicker' : 'app-kicker'">Platform Pulse</p>
    <h2 :class="theme === 'dark' ? 'mb-3 mt-2 text-2xl font-bold text-white' : 'mb-3 mt-2 text-2xl font-bold text-slate-900'">Activity Feed</h2>
    <p v-if="loading" :class="theme === 'dark' ? 'mb-3 text-sm text-white/60' : 'mb-3 text-sm text-slate-500'">Loading activity...</p>
    <p v-else-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="items.length === 0" :class="theme === 'dark' ? 'mb-3 text-sm text-white/60' : 'mb-3 text-sm text-slate-500'">No recent activity.</p>
    <ul class="space-y-3">
      <li v-for="item in items" :key="`${item.text}-${item.date}`" :class="theme === 'dark' ? 'flex flex-col items-start justify-between gap-2 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center' : 'flex flex-col items-start justify-between gap-2 rounded-[22px] border border-slate-200/70 bg-white/70 px-4 py-3 sm:flex-row sm:items-center'">
        <span class="rounded-lg px-2 py-1 text-sm" :class="item.tone">{{ item.text }}</span>
        <span :class="theme === 'dark' ? 'text-sm text-white/50' : 'text-sm text-slate-500'">{{ item.date }}</span>
      </li>
    </ul>
  </section>
</template>
