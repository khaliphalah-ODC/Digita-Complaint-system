<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const session = useSessionStore();

const form = computed(() => session.loginForm);

const submit = async () => {
  await session.login();
  if (session.isLoggedIn) {
    router.push(session.currentUser?.role === 'admin' ? '/admin/dashboard' : '/team-dashboard');
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
            class="rounded-xl bg-[#f8fafc] px-8 py-3 text-lg font-semibold text-orange-400 shadow-sm">
            Login
          </RouterLink>
          <RouterLink
            to="/signup"
            class="rounded-xl px-8 py-3 text-lg font-semibold text-orange-500 transition hover:bg-orange-500 hover:text-white">
            Sign Up
          </RouterLink>
        </div>
      </div>

      <h1 class="text-4xl font-bold text-slate-900">Sign In</h1>
      <p class="mt-1 text-lg text-slate-600">Access the complaint management dashboard.</p>

      <div class="mt-5 space-y-4">
        <input
          v-model="form.email"
          type="email"
          required
          placeholder="Email"
          class="w-full rounded-xl border border-slate-300 bg-[#f8fafc] px-4 py-3 text-lg outline-none focus:border-blue-500"
        >
        <input
          v-model="form.password"
          type="password"
          required
          placeholder="Password"
          class="w-full rounded-xl border border-slate-300 bg-[#f8fafc] px-4 py-3 text-lg outline-none focus:border-orange-500"
        >
      </div>

      <p v-if="session.errorMessage" class="mt-3 text-sm text-red-600">{{ session.errorMessage }}</p>

      <button
        type="submit"
        :disabled="session.loadingLogin"
        class="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 text-lg font-semibold text-white hover:bg-orange-600 disabled:opacity-70"
      >
        {{ session.loadingLogin ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>
  </div>
</template>
