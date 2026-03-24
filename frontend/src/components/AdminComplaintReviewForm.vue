<script setup>
import { computed, reactive, watch } from 'vue';

const props = defineProps({
  complaint: {
    type: Object,
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['save', 'open-chat']);

const form = reactive({
  status: 'submitted',
  priority: 'medium',
  admin_response: ''
});

const deriveWorkflowStatus = (row) => {
  const rawStatus = String(row?.status || 'submitted').toLowerCase();
  if (rawStatus === 'in_review') {
    return row?.department_name || row?.reviewer_name || row?.reviewed_at ? 'assigned' : 'reviewed';
  }
  return rawStatus;
};

const toBackendStatus = (workflowStatus) => {
  if (workflowStatus === 'reviewed' || workflowStatus === 'assigned') {
    return 'in_review';
  }
  return workflowStatus;
};

const statusOptions = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];
const priorityOptions = ['low', 'medium', 'high', 'urgent'];

watch(
  () => props.complaint,
  (row) => {
    if (!row) return;
    form.status = deriveWorkflowStatus(row);
    form.priority = row.priority || 'medium';
    form.admin_response = row.admin_response || '';
  },
  { immediate: true }
);

const canSave = computed(() => Boolean(props.complaint));

const submit = () => {
  emit('save', {
    status: toBackendStatus(form.status),
    priority: form.priority,
    admin_response: form.admin_response.trim() || null
  });
};
</script>

<template>
  <section class="app-shell-panel rounded-[30px] p-5">
    <p class="app-kicker">Response Desk</p>
    <h2 class="mt-2 text-2xl font-semibold text-slate-900">Review & Respond</h2>
    <p class="mb-4 text-sm text-slate-600">Update complaint status, priority, and admin response.</p>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label class="space-y-1">
        <span class="text-xs font-semibold text-slate-600">Status</span>
        <select v-model="form.status" class="app-select">
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">{{ status.label }}</option>
        </select>
      </label>

      <label class="space-y-1">
        <span class="text-xs font-semibold text-slate-600">Priority</span>
        <select v-model="form.priority" class="app-select">
          <option v-for="priority in priorityOptions" :key="priority" :value="priority">{{ priority }}</option>
        </select>
      </label>
    </div>

    <label class="mt-4 block space-y-1">
      <span class="text-xs font-semibold text-slate-600">Admin Response</span>
      <textarea
        v-model="form.admin_response"
        rows="4"
        placeholder="Type response to reporter..."
        class="app-textarea"
      />
    </label>

    <div class="mt-4 flex flex-col gap-2 md:flex-row">
      <button
        :disabled="saving || !canSave"
        class="app-btn-primary disabled:opacity-60"
        @click="submit"
      >
        {{ saving ? 'Saving...' : 'Save Review' }}
      </button>
      <button class="app-btn-secondary" @click="$emit('open-chat')">
        Open Support Chat
      </button>
    </div>
  </section>
</template>
