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
  code: '',
  new_password: '',
  confirm_password: ''
});
const codeRequestMessage = ref('');
const codePreview = ref('');
const codeExpiresAt = ref('');
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const sendResetCode = async () => {
  session.errorMessage = '';
  codeRequestMessage.value = '';
  codePreview.value = '';
  codeExpiresAt.value = '';

  if (!form.email.trim()) {
    session.errorMessage = 'Enter the email associated with your account';
    return;
  }

  try {
    const data = await session.requestPasswordResetCode({ email: form.email.trim().toLowerCase() });
    codeRequestMessage.value = 'Reset code sent if the account exists';
    codePreview.value = data?.reset_code_preview || '';
    codeExpiresAt.value = data?.expires_at || '';
  } catch (_error) {
    // Store already tracks the message.
  }
};

const submit = async () => {
  session.errorMessage = '';

  if (form.new_password !== form.confirm_password) {
    session.errorMessage = 'Passwords do not match';
    return;
  }
  if (!form.code.trim()) {
    session.errorMessage = 'Enter the reset code you received';
    return;
  }
  if (!form.email.trim()) {
    session.errorMessage = 'Email is required to reset the password';
    return;
  }

  try {
    await session.completePasswordReset({
      email: form.email.trim().toLowerCase(),
      code: form.code.trim(),
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
  <div class="app-auth-page flex min-h-screen flex-col">
    <div class="flex flex-1 flex-col px-0 py-0">
      <AuthTopNav fixed />
      <div class="flex flex-1 items-center justify-center px-4 pb-6 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:px-10 lg:pt-32">
        <div class="w-full max-w-5xl">
        <section class="app-auth-shell flex w-full flex-col overflow-hidden rounded-[18px] sm:min-h-[560px] sm:flex-row">
        <aside class="app-auth-aside relative flex min-h-[360px] flex-col justify-between px-8 py-8 text-white sm:min-h-[560px] sm:w-[44%] sm:px-10 sm:py-10">
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

        <form class="app-auth-form px-7 py-8 sm:w-[56%] sm:px-10 sm:py-10 lg:px-12 lg:py-12" @submit.prevent="submit">
          <div class="mx-auto max-w-[360px]">
            <p class="app-auth-title text-[28px] font-black uppercase tracking-[0.04em]">Forgot Password</p>

            <div class="mt-10 space-y-5">
              <label class="block">
                <span class="app-auth-label mb-2 block text-sm font-medium">Email</span>
                <div class="flex flex-col gap-2 sm:flex-row">
                  <input
                    v-model="form.email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    class="app-auth-input flex-1"
                  >
                  <button
                    type="button"
                    class="w-full rounded-full border border-[var(--app-primary)] bg-white px-3 py-2 text-sm font-semibold text-[var(--app-primary)] transition hover:bg-[var(--app-primary)]/10 sm:w-auto"
                    :disabled="session.loadingRequestResetCode"
                    @click="sendResetCode"
                  >
                    {{ session.loadingRequestResetCode ? 'Sending…' : 'Send reset code' }}
                  </button>
                </div>
              </label>
              <div class="text-xs text-slate-500">
                Request a reset code so we can verify your identity before accepting a new password.
                <span v-if="codeRequestMessage" class="block text-slate-700">
                  {{ codeRequestMessage }}
                  <span v-if="codeExpiresAt"> · expires {{ codeExpiresAt }}</span>
                </span>
                <span v-if="codePreview" class="block font-mono text-[0.8rem] text-slate-700">
                  Preview code (dev): {{ codePreview }}
                </span>
              </div>

              <label class="block">
                <span class="app-auth-label mb-2 block text-sm font-medium">Reset code</span>
                <input
                  v-model="form.code"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  placeholder="Enter the code from email"
                  class="app-auth-input"
                >
              </label>

              <label class="block">
                <span class="app-auth-label mb-2 block text-sm font-medium">New Password</span>
                <div class="relative">
                  <input
                    v-model="form.new_password"
                    :type="showNewPassword ? 'text' : 'password'"
                    required
                    placeholder="Create a new password"
                    class="app-auth-input app-auth-input-muted pr-14"
                  >
                  <button
                    type="button"
                    class="app-auth-icon absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-sm transition hover:bg-[var(--app-primary-mist)]"
                    :aria-label="showNewPassword ? 'Hide new password' : 'Show new password'"
                    @click="showNewPassword = !showNewPassword"
                  >
                    <font-awesome-icon :icon="['fas', showNewPassword ? 'eye-slash' : 'eye']" />
                  </button>
                </div>
              </label>

              <label class="block">
                <span class="app-auth-label mb-2 block text-sm font-medium">Confirm Password</span>
                <div class="relative">
                  <input
                    v-model="form.confirm_password"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    required
                    placeholder="Confirm your new password"
                    class="app-auth-input app-auth-input-muted pr-14"
                  >
                  <button
                    type="button"
                    class="app-auth-icon absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-sm transition hover:bg-[var(--app-primary-mist)]"
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
              class="app-auth-submit mt-7 w-full rounded-full px-6 py-4 text-lg font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
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
