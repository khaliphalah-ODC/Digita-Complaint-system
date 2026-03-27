<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: 'continue_with'
  }
});

const emit = defineEmits(['credential', 'error']);

const rawGoogleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const googleClientId = rawGoogleClientId && rawGoogleClientId !== 'your-google-client-id.apps.googleusercontent.com'
  ? rawGoogleClientId
  : '';
const buttonHost = ref(null);
let pollHandle = null;

const renderGoogleButton = () => {
  if (!googleClientId || !buttonHost.value) {
    return;
  }

  const googleApi = window.google?.accounts?.id;
  if (!googleApi) {
    return;
  }

  buttonHost.value.innerHTML = '';
  googleApi.initialize({
    client_id: googleClientId,
    callback: (response) => {
      if (!response?.credential) {
        emit('error', new Error('Google did not return a credential'));
        return;
      }
      emit('credential', response.credential);
    }
  });

  googleApi.renderButton(buttonHost.value, {
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: props.text,
    width: 320
  });
};

onMounted(() => {
  if (!googleClientId) {
    return;
  }

  renderGoogleButton();
  if (!buttonHost.value?.childElementCount) {
    pollHandle = window.setInterval(() => {
      renderGoogleButton();
      if (buttonHost.value?.childElementCount) {
        window.clearInterval(pollHandle);
        pollHandle = null;
      }
    }, 250);
  }
});

onBeforeUnmount(() => {
  if (pollHandle) {
    window.clearInterval(pollHandle);
    pollHandle = null;
  }
});
</script>

<template>
  <div class="text-center">
    <div v-if="googleClientId" ref="buttonHost" class="flex justify-center"></div>
  </div>
</template>
