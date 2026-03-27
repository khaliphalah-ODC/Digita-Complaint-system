<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AuthTopNav from '../components/AuthTopNav.vue';
import api, { extractApiError } from '../services/api';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const success = ref(false);
const message = ref('Verifying your email...');
const resendLoading = ref(false);
const resendMessage = ref('');
const email = computed(() => String(route.query.email || '').trim());
const token = computed(() => String(route.query.token || '').trim());
const hasVerificationParams = computed(() => Boolean(email.value && token.value));
const canResend = computed(() => Boolean(email.value) && !hasVerificationParams.value);

const verifyEmail = async () => {
  if (!email.value || !token.value) {
    loading.value = false;
    success.value = false;
    message.value = 'The verification link is incomplete. Please request a new verification email.';
    return;
  }

  try {
    const response = await api.post('/users/verify-email', {
      email: email.value,
      token: token.value,
    });

    loading.value = false;
    success.value = true;
    message.value = response?.data?.message || 'Your email has been verified successfully.';
  } catch (error) {
    loading.value = false;
    success.value = false;
    message.value = extractApiError(error, 'We could not verify your email.');
  }
};

const resendVerification = async () => {
  if (!email.value) {
    resendMessage.value = 'Email address is missing. Please go back to sign up.';
    return;
  }

  resendLoading.value = true;
  resendMessage.value = '';

  try {
    const response = await api.post('/users/resend-verification', {
      email: email.value
    });

    resendMessage.value = response?.data?.message || 'A new verification email has been sent.';
  } catch (error) {
    resendMessage.value = extractApiError(error, 'We could not resend the verification email.');
  } finally {
    resendLoading.value = false;
  }
};

onMounted(() => {
  if (hasVerificationParams.value) {
    verifyEmail();
    return;
  }

  loading.value = false;
  success.value = false;
  message.value = email.value
    ? 'Check your inbox for a verification link. If you did not receive it, you can resend it below.'
    : 'No email address was provided. Please go back to sign up.';
});
</script>

<template>
  <div class="app-auth-page flex min-h-screen flex-col">
    <div class="flex flex-1 flex-col px-0 py-0">
      <AuthTopNav fixed />
      <div class="flex flex-1 items-center justify-center px-4 pb-6 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:px-10 lg:pt-32">
        <div class="w-full max-w-3xl">
          <section class="app-auth-shell flex w-full flex-col overflow-hidden rounded-[18px] bg-white">
            <div class="px-7 py-10 sm:px-10 sm:py-12 lg:px-12">
              <div class="mx-auto max-w-[460px] text-center">
                <p class="app-auth-title text-[28px] font-black uppercase tracking-[0.04em]">Email Verification</p>

                <p class="mt-6 text-base text-slate-600" :class="{ 'text-slate-500': loading, 'text-emerald-700': success && !loading, 'text-red-600': !success && !loading }">
                  {{ message }}
                </p>

                <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <RouterLink
                    v-if="success && !loading"
                    to="/signin"
                    class="inline-flex items-center justify-center rounded-full bg-[var(--app-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                  >
                    Go to Sign In
                  </RouterLink>

                  <button
                    v-if="canResend"
                    type="button"
                    :disabled="resendLoading"
                    class="app-btn-primary"
                    @click="resendVerification"
                  >
                    {{ resendLoading ? 'Resending...' : 'Resend Verification Email' }}
                  </button>

                  <button
                    v-if="!success && !loading"
                    type="button"
                    class="app-btn-secondary"
                    @click="router.push('/signup')"
                  >
                    Back to Sign Up
                  </button>
                </div>

                <p v-if="resendMessage" class="mt-4 text-sm text-slate-600">
                  {{ resendMessage }}
                </p>

                <p v-if="email" class="mt-6 text-sm text-slate-500">
                  Email: {{ email }}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
