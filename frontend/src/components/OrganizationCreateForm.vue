<script setup>
import { reactive, ref, watch } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Create Organization'
  },
  resetKey: {
    type: Number,
    default: 0
  },
  errors: {
    type: Object,
    default: () => ({})
  },
  theme: {
    type: String,
    default: 'light'
  }
});

const emit = defineEmits(['submit']);

const form = reactive({
  name: '',
  organization_type: '',
  email: '',
  admin_full_name: '',
  admin_email: '',
  phone: '',
  address: '',
  logo: '',
  status: 'active'
});
const uploadError = ref('');
const MAX_LOGO_FILE_SIZE_BYTES = 1024 * 1024 * 2;

watch(
  () => props.resetKey,
  () => {
    form.name = '';
    form.organization_type = '';
    form.email = '';
    form.admin_full_name = '';
    form.admin_email = '';
    form.phone = '';
    form.address = '';
    form.logo = '';
    form.status = 'active';
    uploadError.value = '';
  }
);

const onLogoFileChange = (event) => {
  uploadError.value = '';
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Please select an image file.';
    return;
  }
  if (file.size > MAX_LOGO_FILE_SIZE_BYTES) {
    uploadError.value = 'Image is too large. Maximum allowed size is 2MB.';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    form.logo = String(reader.result || '');
  };
  reader.onerror = () => {
    uploadError.value = 'Failed to read image file.';
  };
  reader.readAsDataURL(file);
};

const onSubmit = () => {
  uploadError.value = '';
  if (form.logo && form.logo.startsWith('data:') && form.logo.length > MAX_LOGO_FILE_SIZE_BYTES * 1.4) {
    uploadError.value = 'Logo data is too large. Use a smaller image or a hosted URL.';
    return;
  }

  emit('submit', {
    name: form.name.trim(),
    organization_type: form.organization_type.trim(),
    email: form.email.trim().toLowerCase(),
    admin_full_name: form.admin_full_name.trim() || null,
    admin_email: form.admin_email.trim().toLowerCase(),
    phone: form.phone.trim() || null,
    address: form.address.trim(),
    logo: form.logo.trim() || null,
    status: form.status
  });
};
</script>

<template>
  <section class="app-section-card">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-slate-900">{{ title }}</h2>
      <p class="mt-1 text-[0.98rem] text-slate-600">Create an organization record and assign its first organization administrator.</p>
    </div>

    <form class="grid grid-cols-1 gap-6 lg:grid-cols-[220px,1fr]" @submit.prevent="onSubmit">
      <div class="space-y-4">
        <div class="flex h-24 w-24 items-center justify-center rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface-soft)] text-2xl font-semibold text-[var(--app-primary)]">
          <img v-if="form.logo" :src="form.logo" alt="Organization logo" class="h-24 w-24 rounded-2xl object-cover">
          <span v-else>ORG</span>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">Logo file</label>
          <input type="file" accept="image/*" class="w-full rounded-xl border border-[var(--app-line)] bg-white px-4 py-3 text-sm text-slate-900 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--app-surface-soft)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 focus:border-[var(--app-primary)]" @change="onLogoFileChange">
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">Logo URL</label>
          <input
            v-model="form.logo"
            type="url"
            placeholder="Optional hosted logo URL"
            class="app-input"
          >
        </div>

        <p v-if="uploadError" class="text-sm text-red-600">{{ uploadError }}</p>
      </div>

      <div class="space-y-5">
        <p v-if="props.errors.general" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ props.errors.general }}
        </p>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-slate-700">Organization name</label>
            <input v-model="form.name" required placeholder="Ministry of Public Works" class="app-input">
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700">Organization type</label>
            <input v-model="form.organization_type" required placeholder="Public sector" class="app-input">
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700">Organization email</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="contact@organization.org"
              class="w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[var(--app-primary)]"
              :class="props.errors.email ? 'border-red-300' : 'border-[var(--app-line)]'"
            >
            <p v-if="props.errors.email" class="mt-2 text-sm text-red-600">{{ props.errors.email }}</p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700">Organization admin name</label>
            <input v-model="form.admin_full_name" placeholder="Jane Doe" class="app-input">
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700">Organization admin email</label>
            <input
              v-model="form.admin_email"
              type="email"
              required
              placeholder="admin@organization.org"
              class="w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[var(--app-primary)]"
              :class="props.errors.admin_email ? 'border-red-300' : 'border-[var(--app-line)]'"
            >
            <p v-if="props.errors.admin_email" class="mt-2 text-sm text-red-600">{{ props.errors.admin_email }}</p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input v-model="form.phone" placeholder="0888123456" class="app-input">
          </div>

          <div v-if="showStatus">
            <label class="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select v-model="form.status" class="app-select">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-slate-700">Address</label>
            <input v-model="form.address" required placeholder="Capital Hill, Monrovia" class="app-input">
          </div>
        </div>

        <div class="flex flex-col gap-3 border-t border-[var(--app-line)] pt-4 sm:flex-row">
          <button
            :disabled="loading"
            type="submit"
            class="app-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ loading ? 'Saving...' : 'Create Organization' }}
          </button>
        </div>
      </div>
    </form>
  </section>
</template>
