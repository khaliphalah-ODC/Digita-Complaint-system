<script setup>
defineProps({
  kicker: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  description: {
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
  <header class="app-page-header">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0 space-y-3">
        <p v-if="kicker" class="app-kicker">{{ kicker }}</p>
        <h1 class="text-[clamp(1.9rem,2.8vw,2.75rem)] font-semibold tracking-[-0.035em] text-[var(--app-title-color)]">{{ title }}</h1>
        <p v-if="description" class="max-w-4xl text-[0.97rem] leading-7 text-[var(--app-muted-color)]">{{ description }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2.5 lg:justify-end">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
