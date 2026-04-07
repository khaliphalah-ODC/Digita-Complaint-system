<script setup>
const props = defineProps({
  title: {
    type: String,
    default: 'Something went wrong'
  },
  description: {
    type: String,
    default: ''
  }
});
</script>

<template>
  <div class="rounded-[var(--app-radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    <p class="font-semibold">{{ props.title }}</p>
    <p v-if="props.description" class="mt-1">{{ props.description }}</p>
    <slot />
  </div>
</template>
