<script setup>
import { onMounted, ref } from 'vue';
import { useSessionStore } from '../stores/session';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  requiresAuth: {
    type: Boolean,
    default: true
  }
});

const session = useSessionStore();
const loading = ref(false);
const error = ref('');
const payload = ref(null);

const load = async () => {
  loading.value = true;
  error.value = '';

  try {
    payload.value = await session.apiRequest(props.endpoint, { method: 'GET' }, props.requiresAuth);
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<template>
  <section>
    <header class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ title }}</h1>
      <button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" @click="load">
        Refresh
      </button>
    </header>

    <div class="rounded-2xl border border-slate-200 bg-white p-4">
      <p v-if="loading" class="text-sm text-slate-500">Loading data...</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <pre v-else class="overflow-x-auto text-sm text-slate-800">{{ JSON.stringify(payload, null, 2) }}</pre>
    </div>
  </section>
</template>
