<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppFooter from '../components/AppFooter.vue';
import AuthTopNav from '../components/AuthTopNav.vue';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const session = useSessionStore();

const form = reactive({
  email: '',
  new_password: '',
  confirm_password: ''
});
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const submit = async () => {
  session.errorMessage = '';

  if (form.new_password !== form.confirm_password) {
    session.errorMessage = 'Passwords do not match';
    return;
  }

  try {
    await session.forgotPassword({
      email: form.email,
      new_password: form.new_password
    });

    if (session.currentUser?.role === 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }
    if (session.currentUser?.role === 'org_admin') {
      router.push('/org-admin/dashboard');
      return;
    }
    router.push('/user/dashboard');
  } catch (_error) {
    // Store already tracks the message.
  }
};
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[linear-gradient(90deg,#5d48f5_0%,#6a56ff_50%,#604cff_100%)]">
    <div class="flex flex-1 flex-col px-0 py-0">
      <AuthTopNav fixed />
      <div class="flex flex-1 items-center justify-center px-4 pb-6 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:px-10 lg:pt-32">
        <div class="w-full max-w-5xl">
        <section class="flex w-full flex-col overflow-hidden rounded-[18px] border border-white/20 bg-transparent shadow-[0_28px_90px_rgba(28,18,94,0.3)] sm:min-h-[560px] sm:flex-row">
        <aside class="relative flex min-h-[360px] flex-col justify-between bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08))] px-8 py-8 text-white backdrop-blur-sm sm:min-h-[560px] sm:w-[44%] sm:px-10 sm:py-10">
          <div class="absolute left-1/2 top-1/4 h-20 w-20 -translate-x-1/2 rounded-full bg-white/8 blur-lg"></div>
          <div>
            <p class="text-base font-semibold text-white/72">Complaint MS</p>
          </div>

          <div class="relative text-center">
            <h1 class="text-5xl font-black tracking-tight">Reset It.</h1>
            <p class="mt-8 text-lg leading-8 text-white/80">
              Set a fresh password.
              <br>
              Then go straight back into your workspace.
            </p>
          </div>

          <div class="text-center">
            <p class="text-base text-white/52">Remember your password?</p>
            <RouterLink
              to="/signin"
              class="mt-6 inline-flex rounded-full border border-white/55 px-10 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Sign In
            </RouterLink>
          </div>
        </aside>

        <form class="bg-[#fffefe] px-7 py-8 sm:w-[56%] sm:px-10 sm:py-10 lg:px-12 lg:py-12" @submit.prevent="submit">
          <div class="mx-auto max-w-[360px]">
            <p class="text-[28px] font-black uppercase tracking-[0.04em] text-[#7b73c7]">Forgot Password</p>

            <div class="mt-10 space-y-5">
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-[#8f88b5]">Email</span>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  class="w-full rounded-[14px] border-2 border-[#8d7cff] bg-white px-5 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-[#9a93bf] focus:ring-2 focus:ring-[#7a68ff]/15"
                >
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-[#8f88b5]">New Password</span>
                <div class="relative">
                  <input
                    v-model="form.new_password"
                    :type="showNewPassword ? 'text' : 'password'"
                    required
                    placeholder="Create a new password"
                    class="w-full rounded-[14px] border-2 border-[#e3def4] bg-white px-5 py-3.5 pr-14 text-base text-slate-900 outline-none transition placeholder:text-[#b2aec9] focus:border-[#8d7cff] focus:ring-2 focus:ring-[#7a68ff]/15"
                  >
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#ddd7f6] text-sm text-[#7b73c7] transition hover:bg-[#f5f2ff]"
                    :aria-label="showNewPassword ? 'Hide new password' : 'Show new password'"
                    @click="showNewPassword = !showNewPassword"
                  >
                    <font-awesome-icon :icon="['fas', showNewPassword ? 'eye-slash' : 'eye']" />
                  </button>
                </div>
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-[#8f88b5]">Confirm Password</span>
                <div class="relative">
                  <input
                    v-model="form.confirm_password"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    required
                    placeholder="Confirm your new password"
                    class="w-full rounded-[14px] border-2 border-[#e3def4] bg-white px-5 py-3.5 pr-14 text-base text-slate-900 outline-none transition placeholder:text-[#b2aec9] focus:border-[#8d7cff] focus:ring-2 focus:ring-[#7a68ff]/15"
                  >
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#ddd7f6] text-sm text-[#7b73c7] transition hover:bg-[#f5f2ff]"
                    :aria-label="showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <font-awesome-icon :icon="['fas', showConfirmPassword ? 'eye-slash' : 'eye']" />
                  </button>
                </div>
              </label>
            </div>

            <p v-if="session.errorMessage" class="mt-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {{ session.errorMessage }}
            </p>

            <button
              type="submit"
              :disabled="session.loadingForgotPassword"
              class="mt-7 w-full rounded-full bg-[linear-gradient(90deg,#7564ff_0%,#6d59ff_100%)] px-6 py-4 text-lg font-semibold text-white shadow-[0_18px_34px_rgba(117,100,255,0.25)] transition hover:opacity-95 disabled:opacity-70"
            >
              {{ session.loadingForgotPassword ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </form>
        </section>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>
