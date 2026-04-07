<script setup>
const props = defineProps({
  title: {
    type: String,
    default: 'Nothing to show yet'
  },
  description: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  },
  containerClass: {
    type: String,
    default: ''
  },
  titleClass: {
    type: String,
    default: 'font-semibold text-[var(--app-title-color)]'
  },
  descriptionClass: {
    type: String,
    default: 'mt-1 text-sm text-[var(--app-muted-color)]'
  }
});
</script>

<template>
  <div :class="[props.compact ? 'app-empty-state py-6' : 'app-empty-state', props.containerClass]">
    <p :class="props.titleClass">{{ props.title }}</p>
    <p v-if="props.description" :class="props.descriptionClass">{{ props.description }}</p>
    <slot />
  </div>
</template>
