<script setup>
import { computed } from 'vue';

const props = defineProps({
  as: {
    type: String,
    default: 'input'
  },
  label: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: ''
  },
  rows: {
    type: [String, Number],
    default: 3
  },
  type: {
    type: String,
    default: 'text'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  help: {
    type: String,
    default: ''
  },
  wrapperClass: {
    type: String,
    default: ''
  },
  inputClass: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const normalizedOptions = computed(() => props.options.map((option) => {
  if (typeof option === 'object' && option !== null) {
    return {
      label: option.label ?? option.name ?? option.value ?? '',
      value: option.value ?? option.id ?? option.label ?? ''
    };
  }

  return { label: String(option), value: option };
}));

const baseClass = computed(() => props.inputClass || (
  props.as === 'textarea'
    ? 'app-textarea'
    : props.as === 'select'
      ? 'app-select'
      : 'app-input'
));
</script>

<template>
  <label :class="['flex flex-col gap-2', props.wrapperClass]">
    <span v-if="props.label" class="text-sm font-medium text-[var(--app-title-color)]">{{ props.label }}</span>

    <select
      v-if="props.as === 'select'"
      :value="props.modelValue"
      :disabled="props.disabled"
      :class="baseClass"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <slot name="options">
        <option v-for="option in normalizedOptions" :key="String(option.value)" :value="option.value">
          {{ option.label }}
        </option>
      </slot>
    </select>

    <textarea
      v-else-if="props.as === 'textarea'"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :rows="props.rows"
      :disabled="props.disabled"
      :class="baseClass"
      @input="emit('update:modelValue', $event.target.value)"
    />

    <input
      v-else
      :value="props.modelValue"
      :type="props.type"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :class="baseClass"
      @input="emit('update:modelValue', $event.target.value)"
    >

    <span v-if="props.help" class="text-xs text-[var(--app-muted-color)]">{{ props.help }}</span>
  </label>
</template>
