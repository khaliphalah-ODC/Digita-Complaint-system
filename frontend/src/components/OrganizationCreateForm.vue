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
  }
});

const emit = defineEmits(['submit']);

const form = reactive({
  name: '',
  organization_type: '',
  email: '',
  phone: '',
  address: '',
  logo: '',
  status: 'active'
});
const uploadError = ref('');
const MAX_LOGO_FILE_SIZE_BYTES = 1024 * 1024 * 2; // 2MB

watch(
  () => props.resetKey,
  () => {
    form.name = '';
    form.organization_type = '';
    form.email = '';
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
    phone: form.phone.trim() || null,
    address: form.address.trim(),
    logo: form.logo.trim() || null,
    status: form.status
  });
};
</script>

<template>
  <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
    <div class="mb-5 flex items-start justify-between">
      <div>
        <h2 class="text-4xl font-black text-slate-800">{{ title }}</h2>
        <p class="text-sm text-slate-500">Fill in the details to onboard a new entity</p>
      </div>
      <button type="button" class="rounded-lg px-2 py-1 text-xl text-slate-400">...</button>
    </div>

    <form class="grid grid-cols-1 gap-5 md:grid-cols-[180px,1fr]" @submit.prevent="onSubmit">
      <div class="flex flex-col items-center justify-start gap-3">
        <div class="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-3xl text-slate-500">
          <img v-if="form.logo" :src="form.logo" alt="Organization Logo" class="h-24 w-24 rounded-full object-cover">
          <span v-else>O</span>
        </div>
        <p class="text-sm text-slate-600">Drag & Drop Logo</p>
        <input
          type="file"
          accept="image/*"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          @change="onLogoFileChange"
        >
        <input
          v-model="form.logo"
          type="url"
          placeholder="Logo URL (or upload image above)"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
        <p v-if="uploadError" class="text-xs text-red-600">{{ uploadError }}</p>
      </div>

      <div class="space-y-3">
        <label class="block text-base font-semibold text-slate-700">Organization Name</label>
        <input
          v-model="form.name"
          required
          placeholder="Organization Name"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >

        <input
          v-model="form.email"
          type="email"
          required
          placeholder="Email"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >

        <input
          v-model="form.organization_type"
          required
          placeholder="Organization Type"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            v-model="form.organization_type"
            placeholder="Public Sector / Private Enterprise"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
          <input
            v-model="form.phone"
            placeholder="(555) 123-667"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
        </div>

        <input
          v-model="form.address"
          required
          placeholder="Address"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >

        <div v-if="showStatus" class="pt-1">
          <label class="mb-2 block text-base font-semibold text-slate-700">Status</label>
          <label class="inline-flex items-center gap-2 text-sm text-slate-700">
            <span class="relative inline-flex h-6 w-11 items-center rounded-full" :class="form.status === 'active' ? 'bg-blue-500' : 'bg-slate-300'">
              <input
                type="checkbox"
                class="sr-only"
                :checked="form.status === 'active'"
                @change="form.status = form.status === 'active' ? 'inactive' : 'active'"
              >
              <span class="inline-block h-5 w-5 transform rounded-full bg-white transition" :class="form.status === 'active' ? 'translate-x-5' : 'translate-x-1'"></span>
            </span>
            <span :class="form.status === 'active' ? 'font-semibold text-slate-800' : 'text-slate-500'">Active</span>
            <span :class="form.status === 'inactive' ? 'font-semibold text-slate-800' : 'text-slate-500'">Inactive</span>
          </label>
        </div>

        <div class="pt-2">
          <button
            :disabled="loading"
            type="submit"
            class="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-base font-bold text-white shadow disabled:opacity-60"
          >
            {{ loading ? 'Saving...' : 'Create Organization' }}
          </button>
        </div>
      </div>
    </form>
  </section>
</template>
