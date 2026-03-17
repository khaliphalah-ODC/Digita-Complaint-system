<script setup>
defineProps({
  kicker: {
    type: String,
    default: 'Platform Oversight'
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
  <header :class="theme === 'dark' ? 'app-dark-panel rounded-[32px] px-6 py-6' : 'app-shell-panel rounded-[32px] px-6 py-6'">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="max-w-3xl">
        <p :class="theme === 'dark' ? 'app-dark-kicker' : 'app-kicker'">{{ kicker }}</p>
        <h1 :class="theme === 'dark' ? 'mt-2 text-3xl font-black text-white sm:text-4xl' : 'mt-2 text-3xl font-black text-slate-900 sm:text-4xl'">{{ title }}</h1>
        <p v-if="description" :class="theme === 'dark' ? 'mt-3 text-sm leading-7 text-white/62' : 'mt-3 text-sm leading-7 text-slate-600'">
          {{ description }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
