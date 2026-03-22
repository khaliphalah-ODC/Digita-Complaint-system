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
      <div class="min-w-0 space-y-2">
        <p v-if="kicker" class="app-kicker">{{ kicker }}</p>
        <h1 class="text-2xl font-semibold text-[var(--app-title-color)] sm:text-3xl">{{ title }}</h1>
        <p v-if="description" class="max-w-3xl text-sm leading-6 text-[var(--app-muted-color)]">{{ description }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3 lg:justify-end">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
