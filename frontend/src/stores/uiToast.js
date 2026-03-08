import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiToastStore = defineStore('uiToast', () => {
  const visible = ref(false);
  const type = ref('success');
  const message = ref('');
  let timer = null;

  const clear = () => {
    visible.value = false;
    message.value = '';
    type.value = 'success';
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const show = (nextType, nextMessage, durationMs = 3000) => {
    if (!nextMessage) return;
    type.value = nextType === 'error' ? 'error' : 'success';
    message.value = String(nextMessage);
    visible.value = true;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      clear();
    }, durationMs);
  };

  const success = (nextMessage, durationMs) => show('success', nextMessage, durationMs);
  const error = (nextMessage, durationMs) => show('error', nextMessage, durationMs);

  return {
    visible,
    type,
    message,
    clear,
    show,
    success,
    error
  };
});
