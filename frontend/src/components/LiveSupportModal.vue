<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { complaintMessagesApi, extractApiError } from '../services/api.js';

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
  },
  requiresAuth: {
    type: Boolean,
    default: false
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
const authRequiredMessage = 'Sign in is required to access complaint chat.';

const isAuthenticated = computed(() => Boolean(localStorage.getItem('token')));
const requiresSignIn = computed(() => props.requiresAuth && !isAuthenticated.value);
const canChat = computed(() => Boolean(props.visible && props.complaintId && !requiresSignIn.value));
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

const normalizeChatError = (requestError, fallbackMessage) => {
  const message = extractApiError(requestError, fallbackMessage);
  if (/Unauthorized|No token provided|sign in required/i.test(message)) {
    return authRequiredMessage;
  }
  if (/Access denied|cannot access complaint chat directly/i.test(message)) {
    return 'You do not have permission to access this complaint conversation.';
  }
  return message;
};

const loadMessages = async () => {
  if (!props.complaintId || requiresSignIn.value) {
    error.value = requiresSignIn.value ? authRequiredMessage : '';
    return;
  }
  const firstLoad = messages.value.length === 0;
  loading.value = firstLoad;
  syncing.value = !firstLoad;
  error.value = '';
  try {
    messages.value = await complaintMessagesApi.list(props.complaintId) || [];
    await scrollToLatest(firstLoad ? 'auto' : 'smooth');
  } catch (requestError) {
    error.value = normalizeChatError(requestError, 'Failed to fetch chat messages');
  } finally {
    loading.value = false;
    syncing.value = false;
  }
};

const sendMessage = async () => {
  const text = input.value.trim();
  if (!text || !props.complaintId || requiresSignIn.value) return;
  sending.value = true;
  error.value = '';
  try {
    const created = await complaintMessagesApi.create(props.complaintId, { message: text });
    messages.value.push(created);
    input.value = '';
    await scrollToLatest();
  } catch (requestError) {
    error.value = normalizeChatError(requestError, 'Failed to send message');
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
  if (!props.complaintId || !message?.id || !text || requiresSignIn.value) return;
  error.value = '';
  try {
    const updated = await complaintMessagesApi.update(props.complaintId, message.id, { message: text });
    messages.value = messages.value.map((item) => (item.id === updated.id ? updated : item));
    cancelEdit();
    await scrollToLatest('auto');
  } catch (requestError) {
    error.value = normalizeChatError(requestError, 'Failed to update message');
  }
};

const deleteMessage = async (message) => {
  if (!props.complaintId || !message?.id || deletingId.value || requiresSignIn.value) return;
  const confirmed = window.confirm('Delete this message?');
  if (!confirmed) return;

  deletingId.value = message.id;
  actionMenuId.value = null;
  error.value = '';
  try {
    await complaintMessagesApi.remove(props.complaintId, message.id);
    messages.value = messages.value.filter((item) => item.id !== message.id);
    if (editingId.value === message.id) {
      cancelEdit();
    }
  } catch (requestError) {
    error.value = normalizeChatError(requestError, 'Failed to delete message');
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
      error.value = '';
      cancelEdit();
      actionMenuId.value = null;
      return;
    }
    if (requiresSignIn.value) {
      stopPolling();
      messages.value = [];
      input.value = '';
      error.value = authRequiredMessage;
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
    class="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,28,48,0.34)] p-3 backdrop-blur-md md:items-center md:p-5"
    @click.self="emit('close')"
  >
    <section class="app-modal-panel flex h-[78vh] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-[calc(var(--app-radius-xl)+6px)] md:h-[76vh]">
      <header class="flex items-center justify-between border-b border-[var(--app-line)] bg-[linear-gradient(135deg,rgba(24,58,99,0.96)_0%,rgba(36,74,121,0.96)_48%,rgba(43,90,142,0.96)_100%)] px-4 py-4 text-white sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-[var(--app-radius-lg)] border border-white/20 bg-white/12 text-sm font-bold shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
            {{ normalizedCurrentRole === 'admin' ? 'CT' : 'SP' }}
          </div>
          <div class="min-w-0">
            <h3 class="truncate text-lg font-semibold">{{ title }}</h3>
            <div class="flex flex-wrap items-center gap-2 text-xs text-white/75">
              <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <span>{{ otherPartyLabel }} • {{ activeStatus }}</span>
              <span>Complaint #{{ complaintId || 'N/A' }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="app-btn-secondary min-h-[38px] border-white/20 bg-white/12 px-3 py-1.5 text-xs text-white hover:bg-white/18 hover:text-white" @click="exitChat">
            Close
          </button>
        </div>
      </header>

      <div class="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,var(--app-bg-soft)_0%,var(--app-bg)_100%)] p-3 sm:p-4">
        <div v-if="requiresSignIn" class="flex flex-1 items-center justify-center">
          <div class="app-modal-panel max-w-md px-5 py-6 text-center shadow-sm">
            <p class="text-base font-semibold text-slate-900">Sign in required</p>
            <p class="mt-2 text-sm text-slate-600">
              Sign in with the complaint owner account to view or send support messages.
            </p>
          </div>
        </div>
        <p v-else-if="loading" class="app-empty-state text-sm">Loading messages...</p>
        <p v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

        <div
          v-else
          ref="messageViewport"
          class="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-[var(--app-radius-xl)] border border-[var(--app-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,250,248,0.98))] p-3 shadow-[var(--app-shadow-sm)] sm:p-4"
        >
          <p v-if="messages.length === 0" class="app-empty-state text-sm">No messages yet. Start the conversation.</p>
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
                  class="absolute right-3 top-12 z-10 flex min-w-[9rem] flex-col rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,248,244,0.98))] p-2 shadow-[var(--app-shadow)]"
                >
                  <button
                    class="flex items-center gap-2 rounded-[var(--app-radius-md)] px-3 py-2 text-left text-xs font-semibold text-[var(--app-primary-ink)] hover:bg-[var(--app-primary-mist)]"
                    @click="startEdit(msg)"
                  >
                    <font-awesome-icon :icon="['fas', 'pen']" />
                    Edit Message
                  </button>
                  <button
                    class="flex items-center gap-2 rounded-[var(--app-radius-md)] px-3 py-2 text-left text-xs font-semibold text-red-700 hover:bg-[#fff1f1]"
                    :disabled="deletingId === msg.id"
                    @click="deleteMessage(msg)"
                  >
                    <font-awesome-icon :icon="['fas', 'trash']" />
                    {{ deletingId === msg.id ? 'Deleting...' : 'Delete Message' }}
                  </button>
                </div>
                <div
                  class="rounded-[22px] px-4 py-3 text-sm shadow-[0_10px_24px_rgba(17,28,48,0.06)]"
                  :class="isOwnMessage(msg)
                    ? 'rounded-br-md border border-transparent bg-[linear-gradient(135deg,#183a63_0%,#2a568a_100%)] pr-8 text-white'
                    : 'rounded-bl-md border border-[var(--app-line)] bg-[var(--app-surface-soft)] text-[var(--app-text-color)]'"
                >
                <template v-if="editingId === msg.id">
                  <textarea
                    v-model="editDraft"
                    rows="3"
                    class="app-input min-h-[96px] rounded-[var(--app-radius-lg)] px-3 py-2 text-sm"
                  />
                  <div class="app-action-row mt-3 flex flex-wrap gap-2">
                    <button
                      class="app-btn-secondary min-h-[34px] px-3 py-1.5 text-xs"
                      @click="saveEdit(msg)"
                    >
                      Save
                    </button>
                    <button
                      class="app-btn-ghost min-h-[34px] border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/16 hover:text-white"
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
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--app-radius-lg)] bg-[linear-gradient(135deg,#183a63_0%,#2a568a_100%)] text-xs font-bold text-white"
            >
              {{ avatarLabel(msg) }}
            </div>
          </div>

          <div v-if="typingIndicatorVisible" class="flex items-end gap-2">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--app-radius-lg)] bg-[var(--app-primary-mist)] text-xs font-bold text-[var(--app-primary-ink)]">
              {{ normalizedCurrentRole === 'admin' ? 'CT' : 'SP' }}
            </div>
            <div class="rounded-[20px] rounded-bl-md border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-3">
              <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]"></span>
                <span class="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]"></span>
                <span class="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 flex flex-col gap-3 rounded-[var(--app-radius-xl)] border border-[var(--app-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,248,244,0.98))] p-3 shadow-[var(--app-shadow-sm)] sm:flex-row sm:items-end">
          <textarea
            v-model="input"
            placeholder="Write a message..."
            rows="2"
            class="app-input min-h-[54px] w-full rounded-[var(--app-radius-lg)] px-4 py-3 text-sm"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <button
            :disabled="sending || deletingId !== null || editingId !== null"
            class="app-btn-primary min-h-[46px] rounded-[var(--app-radius-lg)] px-5 py-3 text-sm disabled:opacity-60"
            @click="sendMessage"
          >
            {{ sending ? 'Sending...' : 'Send Message' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
