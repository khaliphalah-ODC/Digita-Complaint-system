<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const session = useSessionStore();

const signUpForm = reactive({
  full_name: '',
  email: '',
  password: ''
});

const submit = async () => {
  try {
    await session.register(signUpForm);
    router.push(session.currentUser?.role === 'admin' ? '/admin/dashboard' : '/team-dashboard');
  } catch (_error) {
    // Store already tracks and displays error message.
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#e9edf3] px-4">
    <form class="w-full max-w-[560px] rounded-3xl border border-slate-200 bg-[#f8fafc] p-8 shadow-sm" @submit.prevent="submit">
      <div class="mb-8 rounded-2xl bg-[#dde3ea] p-2">
        <div class="flex items-center gap-3">
          <RouterLink
            to="/signin"
            class="rounded-xl px-8 py-3 text-lg font-semibold text-slate-600 transition hover:bg-[#f8fafc] hover:text-slate-900"
          >
            Login
          </RouterLink>
          <RouterLink
            to="/signup"
            class="rounded-xl bg-orange-500 px-8 py-3 text-lg font-semibold text-white shadow-sm"
          >
            Sign Up
          </RouterLink>
        </div>
      </div>

      <h1 class="text-4xl font-bold text-slate-900">Sign Up</h1>
      <p class="mt-1 text-lg text-slate-600">Create an account to access the system.</p>

      <div class="mt-5 space-y-4">
        <input
          v-model="signUpForm.full_name"
          type="text"
          required
          placeholder="Full name"
          class="w-full rounded-xl border border-slate-300 bg-[#f8fafc] px-4 py-3 text-lg outline-none focus:border-orange-300"
        >
        <input
          v-model="signUpForm.email"
          type="email"
          required
          placeholder="Email"
          class="w-full rounded-xl border border-slate-300 bg-[#f8fafc] px-4 py-3 text-lg outline-none focus:border-orange-300"
        >
        <input
          v-model="signUpForm.password"
          type="password"
          required
          placeholder="Password"
          class="w-full rounded-xl border border-slate-300 bg-[#f8fafc] px-4 py-3 text-lg outline-none focus:border-orange-300"
        >
      </div>

      <p v-if="session.errorMessage" class="mt-3 text-sm text-red-600">{{ session.errorMessage }}</p>

      <button
        type="submit"
        :disabled="session.loadingRegister"
        class="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 text-lg font-semibold text-white hover:bg-orange-600 disabled:opacity-70"
      >
        {{ session.loadingRegister ? 'Creating account...' : 'Sign Up' }}
      </button>
    </form>
  </div>
</template>
