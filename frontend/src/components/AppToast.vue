<script setup>
import { computed } from 'vue';
import { useUiToastStore } from '../stores/uiToast';

const uiToast = useUiToastStore();

const toastClass = computed(() => {
  return uiToast.type === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="uiToast.visible"
      class="fixed right-4 top-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg"
      :class="toastClass"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-start gap-3">
        <p class="flex-1">{{ uiToast.message }}</p>
        <button class="text-xs font-semibold opacity-70 hover:opacity-100" @click="uiToast.clear">Close</button>
      </div>
    </div>
  </Transition>
</template>
