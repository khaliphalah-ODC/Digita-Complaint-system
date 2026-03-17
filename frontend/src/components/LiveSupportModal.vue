<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import api, { extractApiError, unwrapResponse } from '../services/api.js';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  complaintId: {
    type: Number,
    default: null
  },
  title: {
    type: String,
    default: 'Live Support Chat'
  },
  currentRole: {
    type: String,
    default: 'user'
  }
});

const emit = defineEmits(['close']);

const messages = ref([]);
const loading = ref(false);
const sending = ref(false);
const error = ref('');
const input = ref('');
let refreshTimer = null;

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const canChat = computed(() => Boolean(props.visible && props.complaintId));

const loadMessages = async () => {
  if (!props.complaintId) return;
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get(`/complaint-messages/${props.complaintId}`);
    messages.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch chat messages') || [];
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch chat messages');
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  const text = input.value.trim();
  if (!text || !props.complaintId) return;
  sending.value = true;
  error.value = '';
  try {
    const response = await api.post(`/complaint-messages/${props.complaintId}`, { message: text });
    const created = ensureSuccess(unwrapResponse(response), 'Failed to send message');
    messages.value.push(created);
    input.value = '';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to send message');
  } finally {
    sending.value = false;
  }
};

const stopPolling = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

const startPolling = () => {
  stopPolling();
  refreshTimer = setInterval(() => {
    if (canChat.value) loadMessages();
  }, 5000);
};

watch(
  () => [props.visible, props.complaintId],
  async ([visible, complaintId]) => {
    if (!visible || !complaintId) {
      stopPolling();
      return;
    }
    await loadMessages();
    startPolling();
  },
  { immediate: true }
);

onUnmounted(stopPolling);
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 md:items-center"
    @click.self="emit('close')"
  >
    <section class="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h3 class="text-lg font-bold text-slate-900">{{ title }}</h3>
          <p class="text-xs text-slate-500">Complaint #{{ complaintId || 'N/A' }}</p>
        </div>
        <button class="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700" @click="emit('close')">
          Close
        </button>
      </header>

      <div class="px-4 py-3">
        <p v-if="loading" class="text-sm text-slate-500">Loading messages...</p>
        <p v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

        <div v-else class="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p v-if="messages.length === 0" class="text-sm text-slate-500">No messages yet. Start the conversation.</p>
          <article
            v-for="msg in messages"
            :key="msg.id"
            class="max-w-[90%] rounded-lg px-3 py-2 text-sm"
            :class="msg.sender_role === currentRole ? 'ml-auto bg-blue-100 text-blue-900' : 'bg-[var(--app-primary-mist)] text-[var(--app-primary-ink)]'"
          >
            <p class="font-semibold">{{ msg.sender_name || (msg.sender_role === 'admin' ? 'Admin' : 'User') }}</p>
            <p>{{ msg.message }}</p>
            <p class="mt-1 text-[11px] opacity-70">{{ msg.created_at }}</p>
          </article>
        </div>

        <div class="mt-3 flex flex-col gap-2 md:flex-row">
          <input
            v-model="input"
            placeholder="Type your message..."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--app-primary)]"
            @keyup.enter="sendMessage"
          >
          <button
            :disabled="sending"
            class="rounded-lg bg-[var(--app-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)] disabled:opacity-60"
            @click="sendMessage"
          >
            {{ sending ? 'Sending...' : 'Send' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
