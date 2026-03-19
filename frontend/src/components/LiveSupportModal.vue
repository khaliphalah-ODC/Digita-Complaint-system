<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
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
const syncing = ref(false);
const deletingId = ref(null);
const editingId = ref(null);
const actionMenuId = ref(null);
const error = ref('');
const input = ref('');
const editDraft = ref('');
const messageViewport = ref(null);
let refreshTimer = null;

const ensureSuccess = (payload, fallbackMessage) => {
  if (!payload?.success) throw new Error(payload?.message || fallbackMessage);
  return payload.data;
};

const canChat = computed(() => Boolean(props.visible && props.complaintId));
const normalizedCurrentRole = computed(() => (
  props.currentRole === 'org_admin' || props.currentRole === 'super_admin' ? 'admin' : 'user'
));
const otherPartyLabel = computed(() => (
  normalizedCurrentRole.value === 'admin' ? 'User' : 'Support Team'
));
const activeStatus = computed(() => (
  loading.value ? 'Loading conversation' : 'Active now'
));
const typingIndicatorVisible = computed(() => sending.value || syncing.value);

const formatTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const buildInitials = (name, fallback = 'U') => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return fallback;
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

const scrollToLatest = async (behavior = 'smooth') => {
  await nextTick();
  const node = messageViewport.value;
  if (!node) return;
  node.scrollTo({ top: node.scrollHeight, behavior });
};

const isOwnMessage = (message) => message?.sender_role === normalizedCurrentRole.value;
const avatarLabel = (message) => {
  if (isOwnMessage(message)) {
    return normalizedCurrentRole.value === 'admin' ? 'AD' : buildInitials(message?.sender_name, 'YU');
  }
  return normalizedCurrentRole.value === 'admin' ? buildInitials(message?.sender_name, 'CT') : 'SP';
};
const senderTitle = (message) => {
  if (isOwnMessage(message)) {
    return normalizedCurrentRole.value === 'admin'
      ? (message?.sender_name || 'Organization Admin')
      : 'You';
  }
  return normalizedCurrentRole.value === 'admin'
    ? (message?.sender_name || 'Citizen')
    : (message?.sender_name || 'Support Team');
};

const loadMessages = async () => {
  if (!props.complaintId) return;
  const firstLoad = messages.value.length === 0;
  loading.value = firstLoad;
  syncing.value = !firstLoad;
  error.value = '';
  try {
    const response = await api.get(`/complaint-messages/${props.complaintId}`);
    messages.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch chat messages') || [];
    await scrollToLatest(firstLoad ? 'auto' : 'smooth');
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to fetch chat messages');
  } finally {
    loading.value = false;
    syncing.value = false;
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
    await scrollToLatest();
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to send message');
  } finally {
    sending.value = false;
  }
};

const startEdit = (message) => {
  if (!isOwnMessage(message)) return;
  actionMenuId.value = null;
  editingId.value = message.id;
  editDraft.value = message.message || '';
};

const cancelEdit = () => {
  editingId.value = null;
  editDraft.value = '';
};

const toggleActionMenu = (messageId) => {
  actionMenuId.value = actionMenuId.value === messageId ? null : messageId;
};

const saveEdit = async (message) => {
  const text = editDraft.value.trim();
  if (!props.complaintId || !message?.id || !text) return;
  error.value = '';
  try {
    const response = await api.put(`/complaint-messages/${props.complaintId}/${message.id}`, { message: text });
    const updated = ensureSuccess(unwrapResponse(response), 'Failed to update message');
    messages.value = messages.value.map((item) => (item.id === updated.id ? updated : item));
    cancelEdit();
    await scrollToLatest('auto');
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to update message');
  }
};

const deleteMessage = async (message) => {
  if (!props.complaintId || !message?.id || deletingId.value) return;
  const confirmed = window.confirm('Delete this message?');
  if (!confirmed) return;

  deletingId.value = message.id;
  actionMenuId.value = null;
  error.value = '';
  try {
    await api.delete(`/complaint-messages/${props.complaintId}/${message.id}`);
    messages.value = messages.value.filter((item) => item.id !== message.id);
    if (editingId.value === message.id) {
      cancelEdit();
    }
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to delete message');
  } finally {
    deletingId.value = null;
  }
};

const exitChat = () => {
  emit('close');
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
      messages.value = [];
      input.value = '';
      cancelEdit();
      actionMenuId.value = null;
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
    class="fixed inset-0 z-50 flex items-end justify-center bg-[#0f1f39]/45 p-4 md:items-center"
    @click.self="emit('close')"
  >
    <section class="flex h-[82vh] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-[#eef4ff] md:h-[78vh]">
      <header class="flex items-center justify-between border-b border-slate-200 bg-[linear-gradient(135deg,#0f1f39_0%,#163462_48%,#1f4db7_100%)] px-4 py-4 text-white">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold">
            {{ normalizedCurrentRole === 'admin' ? 'CT' : 'SP' }}
          </div>
          <div class="min-w-0">
            <h3 class="truncate text-lg font-bold">{{ title }}</h3>
            <div class="flex flex-wrap items-center gap-2 text-xs text-white/75">
              <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <span>{{ otherPartyLabel }} • {{ activeStatus }}</span>
              <span>Complaint #{{ complaintId || 'N/A' }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white" @click="exitChat">
            Close
          </button>
        </div>
      </header>

      <div class="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,#eef4ff_0%,#e2ecff_100%)] px-4 py-3">
        <p v-if="loading" class="text-sm text-slate-500">Loading messages...</p>
        <p v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

        <div
          v-else
          ref="messageViewport"
          class="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-[24px] border border-white/30 bg-[linear-gradient(180deg,#f8fbff_0%,#edf4ff_100%)] p-3 sm:p-4"
        >
          <p v-if="messages.length === 0" class="text-sm text-slate-500">No messages yet. Start the conversation.</p>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="flex items-end gap-2"
            :class="isOwnMessage(msg) ? 'justify-end' : 'justify-start'"
          >
            <div
              v-if="!isOwnMessage(msg)"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-primary-mist)] text-xs font-bold text-[var(--app-primary-ink)]"
            >
              {{ avatarLabel(msg) }}
            </div>
            <article class="max-w-[85%]">
              <p
                class="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                :class="isOwnMessage(msg) ? 'text-right text-[var(--app-primary)]/80' : 'text-slate-500'"
              >
                {{ senderTitle(msg) }}
              </p>
              <div class="relative">
                <button
                  v-if="isOwnMessage(msg) && editingId !== msg.id"
                  type="button"
                  class="absolute right-2 top-2 inline-flex min-w-0 appearance-none items-center justify-center !rounded-none !border-0 !bg-transparent !p-0 text-[10px] font-semibold leading-none text-white/70 !shadow-none outline-none hover:!bg-transparent hover:text-white focus:outline-none"
                  @click="toggleActionMenu(msg.id)"
                  aria-label="Message actions"
                >
                  ...
                </button>
                <div
                  v-if="actionMenuId === msg.id && editingId !== msg.id"
                  class="absolute right-3 top-12 z-10 flex min-w-[9rem] flex-col rounded-2xl border border-[#c6d6f6] bg-[#f7faff] p-2"
                >
                  <button
                    class="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--app-primary-ink)] hover:bg-[#e6efff]"
                    @click="startEdit(msg)"
                  >
                    <font-awesome-icon :icon="['fas', 'pen']" />
                    Edit Message
                  </button>
                  <button
                    class="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-700 hover:bg-[#fff1f1]"
                    :disabled="deletingId === msg.id"
                    @click="deleteMessage(msg)"
                  >
                    <font-awesome-icon :icon="['fas', 'trash']" />
                    {{ deletingId === msg.id ? 'Deleting...' : 'Delete Message' }}
                  </button>
                </div>
                <div
                  class="rounded-[22px] px-4 py-3 text-sm"
                  :class="isOwnMessage(msg)
                    ? 'rounded-br-md bg-[linear-gradient(135deg,#163462_0%,#1f4db7_100%)] pr-8 text-white'
                    : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'"
                >
                <template v-if="editingId === msg.id">
                  <textarea
                    v-model="editDraft"
                    rows="3"
                    class="w-full rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm outline-none"
                  />
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      class="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-primary-ink)]"
                      @click="saveEdit(msg)"
                    >
                      Save
                    </button>
                    <button
                      class="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                      @click="cancelEdit"
                    >
                      Cancel
                    </button>
                  </div>
                </template>
                <p v-else class="whitespace-pre-wrap break-words">{{ msg.message }}</p>
                </div>
              </div>
              <p
                class="mt-1 text-[11px]"
                    :class="isOwnMessage(msg) ? 'text-right text-[var(--app-primary)]/70' : 'text-slate-500'"
              >
                {{ formatTimestamp(msg.updated_at || msg.created_at) }}<span v-if="msg.updated_at && msg.updated_at !== msg.created_at"> • edited</span>
              </p>
            </article>
            <div
              v-if="isOwnMessage(msg)"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#163462_0%,#1f4db7_100%)] text-xs font-bold text-white"
            >
              {{ avatarLabel(msg) }}
            </div>
          </div>

          <div v-if="typingIndicatorVisible" class="flex items-end gap-2">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-primary-mist)] text-xs font-bold text-[var(--app-primary-ink)]">
              {{ normalizedCurrentRole === 'admin' ? 'CT' : 'SP' }}
            </div>
            <div class="rounded-[22px] rounded-bl-md border border-[#d8e4fb] bg-[#f7faff] px-4 py-3">
              <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]"></span>
                <span class="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]"></span>
                <span class="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 flex flex-col gap-2 rounded-[24px] border border-white/30 bg-[linear-gradient(180deg,#f7faff_0%,#edf4ff_100%)] p-3 sm:flex-row sm:items-end">
          <input
            v-model="input"
            placeholder="Write a message..."
            class="w-full rounded-2xl border border-[#c6d6f6] bg-white px-4 py-3 text-sm text-[var(--app-primary-ink)] outline-none transition-colors focus:border-[var(--app-primary)]"
            @keyup.enter="sendMessage"
          >
          <button
            :disabled="sending || deletingId !== null || editingId !== null"
            class="rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--app-primary-ink)] disabled:opacity-60"
            @click="sendMessage"
          >
            {{ sending ? 'Sending...' : 'Send Message' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
