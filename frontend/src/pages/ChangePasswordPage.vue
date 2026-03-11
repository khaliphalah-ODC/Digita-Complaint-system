<script setup>
import { computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const session = useSessionStore();

const form = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const currentUserLabel = computed(() => session.currentUser?.full_name || session.currentUser?.email || 'User');

onMounted(() => {
  session.errorMessage = '';
});

const submit = async () => {
  session.errorMessage = '';

  if (!form.current_password || !form.new_password) {
    session.errorMessage = 'Current password and new password are required.';
    return;
  }

  if (form.new_password.length < 8) {
    session.errorMessage = 'New password must be at least 8 characters.';
    return;
  }

  if (form.new_password !== form.confirm_password) {
    session.errorMessage = 'New password and confirmation do not match.';
    return;
  }

  try {
    await session.changePassword({
      current_password: form.current_password,
      new_password: form.new_password
    });

    form.current_password = '';
    form.new_password = '';
    form.confirm_password = '';

    if (session.currentUser?.role === 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }
    if (session.currentUser?.role === 'org_admin') {
      router.push('/org-admin/dashboard');
      return;
    }
    router.push('/submit-complaint');
  } catch (_error) {
    // Session store exposes error state for the form.
  }
};
</script>

<template>
  <section class="mx-auto flex min-h-full max-w-3xl items-center justify-center">
    <div class="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Password Reset Required</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900">Change your temporary password</h1>
      <p class="mt-3 max-w-2xl text-sm text-slate-600">
        Your account for {{ currentUserLabel }} is signed in with a default password. You need to set a new password before the dashboard and other protected pages will open.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1 block text-sm font-semibold text-slate-700">Current Password</label>
          <input
            v-model="form.current_password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
        </div>

        <div>
          <label class="mb-1 block text-sm font-semibold text-slate-700">New Password</label>
          <input
            v-model="form.new_password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
        </div>

        <div>
          <label class="mb-1 block text-sm font-semibold text-slate-700">Confirm New Password</label>
          <input
            v-model="form.confirm_password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
        </div>

        <p v-if="session.errorMessage" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ session.errorMessage }}
        </p>

        <div class="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            :disabled="session.loadingPasswordChange"
            class="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {{ session.loadingPasswordChange ? 'Updating Password...' : 'Change Password' }}
          </button>

          <button
            type="button"
            class="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="session.logout"
          >
            Logout
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
