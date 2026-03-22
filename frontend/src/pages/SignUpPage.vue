<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppFooter from '../components/AppFooter.vue';
import AuthTopNav from '../components/AuthTopNav.vue';
import GoogleAuthButton from '../components/GoogleAuthButton.vue';
import { socialLinks } from '../config/socialLinks';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const session = useSessionStore();

const signUpForm = reactive({
  full_name: '',
  email: '',
  password: ''
});
const showPassword = ref(false);

const submit = async () => {
  try {
    const data = await session.register(signUpForm);
    await router.push({
      path: '/verify-email',
      query: {
        email: String(data?.user?.email || signUpForm.email || '').trim().toLowerCase()
      }
    });
  } catch (_error) {
    // Store already tracks and displays error message.
  }
};

const submitGoogle = async (credential) => {
  try {
    await session.googleLogin(credential);
    redirectAfterAuth();
  } catch (_error) {
    // Store tracks and displays the message.
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
            <h1 class="text-5xl font-black tracking-tight">Join Us!</h1>
            <p class="mt-8 text-lg leading-8 text-white/80">
              Create your account.
              <br>
              You are one step away from your dashboard.
            </p>
          </div>

          <div class="text-center">
            <p class="text-base text-white/52">Already have an account?</p>
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
            <p class="app-auth-title text-[28px] font-black uppercase tracking-[0.04em]">Sign Up</p>

            <div class="mt-10 space-y-5">
              <label class="block">
                <span class="app-auth-label mb-2 block text-sm font-medium">Full Name</span>
                <input
                  v-model="signUpForm.full_name"
                  type="text"
                  required
                  placeholder="Your full name"
                  class="app-auth-input"
                >
              </label>

              <label class="block">
                <span class="app-auth-label mb-2 block text-sm font-medium">Email</span>
                <input
                  v-model="signUpForm.email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  class="app-auth-input app-auth-input-muted"
                >
              </label>

              <label class="block">
                <span class="app-auth-label mb-2 block text-sm font-medium">Password</span>
                <div class="relative">
                  <input
                    v-model="signUpForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    placeholder="Create a password"
                    class="app-auth-input app-auth-input-muted pr-14"
                  >
                  <button
                    type="button"
                    class="app-auth-icon absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-sm transition hover:bg-[var(--app-primary-mist)]"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    @click="showPassword = !showPassword"
                  >
                    <font-awesome-icon :icon="['fas', showPassword ? 'eye-slash' : 'eye']" />
                  </button>
                </div>
              </label>
            </div>

            <p v-if="session.errorMessage" class="mt-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {{ session.errorMessage }}
            </p>

            <button
              type="submit"
              :disabled="session.loadingRegister || session.loadingGoogleLogin"
              class="app-auth-submit mt-7 w-full rounded-full px-6 py-4 text-lg font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
            >
              {{ session.loadingRegister ? 'Creating account...' : 'Sign Up' }}
            </button>

            <div class="mt-5">
              <p class="app-auth-meta mb-3 text-center text-sm">Or continue with Google</p>
              <GoogleAuthButton text="signup_with" @credential="submitGoogle" />
            </div>

            <div class="mt-10 text-center">
              <p class="app-auth-meta text-sm">Community and support channels</p>
              <div class="mt-5 flex justify-center gap-5 text-white">
                <a :href="socialLinks.facebook" target="_blank" rel="noreferrer" class="app-social-chip flex h-11 w-11 items-center justify-center rounded-full transition hover:-translate-y-0.5">
                  <font-awesome-icon :icon="['fab', 'facebook-f']" />
                </a>
                <a :href="socialLinks.google" target="_blank" rel="noreferrer" class="app-social-chip flex h-11 w-11 items-center justify-center rounded-full transition hover:-translate-y-0.5">
                  <font-awesome-icon :icon="['fab', 'google']" />
                </a>
                <a :href="socialLinks.x" target="_blank" rel="noreferrer" class="app-social-chip flex h-11 w-11 items-center justify-center rounded-full transition hover:-translate-y-0.5">
                  <font-awesome-icon :icon="['fab', 'x-twitter']" />
                </a>
                <a :href="socialLinks.linkedin" target="_blank" rel="noreferrer" class="app-social-chip flex h-11 w-11 items-center justify-center rounded-full transition hover:-translate-y-0.5">
                  <font-awesome-icon :icon="['fab', 'linkedin-in']" />
                </a>
              </div>
            </div>
          </div>
        </form>
        </section>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>
