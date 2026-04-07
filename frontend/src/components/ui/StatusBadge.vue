<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: [String, Number, Boolean],
    default: ''
  },
  tone: {
    type: String,
    default: ''
  }
});

const normalizedValue = computed(() => String(props.value || '').trim().toLowerCase());

const toneClass = computed(() => {
  if (props.tone) return `app-badge app-badge-${props.tone}`;

  if (['resolved', 'completed', 'active', 'read', 'success'].includes(normalizedValue.value)) {
    return 'app-badge app-badge-success';
  }
  if (['closed', 'inactive', 'neutral'].includes(normalizedValue.value)) {
    return 'app-badge app-badge-neutral';
  }
  if (['urgent', 'high', 'rejected', 'danger'].includes(normalizedValue.value)) {
    return 'app-badge app-badge-danger';
  }
  if (['in_review', 'pending', 'in_progress', 'submitted', 'medium', 'warning'].includes(normalizedValue.value)) {
    return 'app-badge app-badge-warning';
  }

  return 'app-badge app-badge-neutral';
});

const label = computed(() => String(props.value || 'N/A').replace(/_/g, ' '));
</script>

<template>
  <span :class="toneClass">{{ label }}</span>
</template>
