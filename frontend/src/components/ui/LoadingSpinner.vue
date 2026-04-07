<script setup>
const props = defineProps({
  label: {
    type: String,
    default: 'Loading...'
  },
  centered: {
    type: Boolean,
    default: true
  },
  wrapperClass: {
    type: String,
    default: ''
  },
  labelClass: {
    type: String,
    default: 'text-sm text-[var(--app-muted-color)]'
  }
});
</script>

<template>
  <div :class="[props.centered ? 'flex items-center justify-center py-8' : 'flex items-center gap-3 py-2', props.wrapperClass]">
    <span class="app-loading-spinner" aria-hidden="true" />
    <span :class="props.labelClass">{{ props.label }}</span>
  </div>
</template>
