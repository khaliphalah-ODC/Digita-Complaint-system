<script setup>
import { ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import AuthTopNav from '../components/AuthTopNav.vue';
import AppFooter from '../components/AppFooter.vue';
import { socialLinks } from '../config/socialLinks';

const step = ref(1); // 1 = enter join code, 2 = fill registration form
const showPassword = ref(false);
const loadingValidate = ref(false);
const loadingDepartments = ref(false);
const loadingSubmit = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const organization = ref(null);
const departments = ref([]);

const codeForm = reactive({ join_code: '' });
const form = reactive({
  full_name: '',
  email: '',
  password: '',
  confirm_password: '',
  department_id: '',
});

<<<<<<< Updated upstream
=======
// ── Step 1: validate the join code and load org + departments
const validateCode = async () => {
  errorMessage.value = '';
  if (!codeForm.join_code.trim()) {
    errorMessage.value = 'Please enter your organization join code.';
    return;
  }

  loadingValidate.value = true;
  try {
    const validateRes = await fetch('http://localhost:5000/api/join/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ join_code: codeForm.join_code.trim().toUpperCase() }),
    });

    const orgData = await validateRes.json();

    if (!validateRes.ok) {
      errorMessage.value = orgData?.message || 'Invalid join code. Please check and try again.';
      return;
    }

    organization.value = orgData?.data?.organization || null;

    if (!organization.value) {
      errorMessage.value = 'Could not load organization details. Please try again.';
      return;
    }

    // Fetch departments for this organization
    loadingDepartments.value = true;
    const deptRes = await fetch(
      `http://localhost:5000/api/public/organizations/${organization.value.organization_id}/departments`
    );
    const deptData = await deptRes.json();
    departments.value = Array.isArray(deptData?.data) ? deptData.data : [];

    step.value = 2;
  } catch (e) {
    errorMessage.value = 'Something went wrong. Please check your connection and try again.';
  } finally {
    loadingValidate.value = false;
    loadingDepartments.value = false;
  }
};

// ── Step 2: submit the registration form ────────────────────
>>>>>>> Stashed changes
const submit = async () => {
  errorMessage.value = '';

  if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
    errorMessage.value = 'Full name, email, and password are required.';
    return;
  }
  if (!form.department_id) {
    errorMessage.value = 'Please select your department.';
    return;
  }

  if (form.password !== form.confirm_password) {
  errorMessage.value = 'Passwords do not match.';
  return;
}

  loadingSubmit.value = true;
  try {
<<<<<<< Updated upstream
    const data = await session.register(signUpForm);
    await router.push({
      path: '/verify-email',
      query: {
        email: String(data?.user?.email || signUpForm.email || '').trim().toLowerCase()
      }
    });
  } catch (_error) {
    // Store already tracks and displays error message.
=======
    const res = await fetch('http://localhost:5000/api/join/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        join_code: codeForm.join_code.trim().toUpperCase(),
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        department_id: Number(form.department_id),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorMessage.value = data?.message || 'Registration failed. Please try again.';
      return;
    }

    successMessage.value = data?.message ||
      'Registration successful! Your account is pending approval. You can log in once your organization admin approves you.';
  } catch (e) {
    errorMessage.value = 'Something went wrong. Please try again.';
  } finally {
    loadingSubmit.value = false;
>>>>>>> Stashed changes
  }
};

const goBack = () => {
  step.value = 1;
  errorMessage.value = '';
  organization.value = null;
  departments.value = [];
};
</script>

<template>
  <div class="app-auth-page flex min-h-screen flex-col">
    <div class="flex flex-1 flex-col px-0 py-0">
      <AuthTopNav fixed />

      <div class="flex flex-1 items-center justify-center px-4 pb-6 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:px-10 lg:pt-32">
        <div class="w-full max-w-5xl">
          <section class="app-auth-shell flex w-full flex-col overflow-hidden rounded-[18px] sm:min-h-[560px] sm:flex-row">

            <!-- ── Left Aside ─────────────────────────────── -->
            <aside class="app-auth-aside relative flex min-h-[280px] flex-col justify-between px-8 py-8 text-white sm:min-h-[560px] sm:w-[44%] sm:px-10 sm:py-10">
              <div class="absolute left-1/2 top-1/4 h-20 w-20 -translate-x-1/2 rounded-full bg-white/8 blur-lg"></div>
              <div>
                <p class="text-base font-semibold text-white/72">Complaint MS</p>
              </div>
              <div class="relative text-center">
                <h1 class="text-5xl font-black tracking-tight leading-tight">
                  <template v-if="step === 1">Join Your<br/>Organization</template>
                  <template v-else>{{ organization?.name || 'Welcome!' }}</template>
                </h1>
                <p class="mt-8 text-lg leading-8 text-white/80">
                  <template v-if="step === 1">
                    Enter the join code your organization admin shared with you to get started.
                  </template>
                  <template v-else>
                    Complete your registration to submit and track complaints within your organization.
                  </template>
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

            <!-- ── Right Form Panel ──────────────────────── -->
            <div class="app-auth-form px-7 py-8 sm:w-[56%] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
              <div class="mx-auto max-w-[360px]">

                <!-- SUCCESS STATE -->
                <div v-if="successMessage" class="text-center">
                  <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                    <svg class="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h2 class="app-auth-title text-2xl font-black">Registration Submitted!</h2>
                  <p class="mt-4 text-sm leading-7 text-slate-500">{{ successMessage }}</p>
                  <RouterLink
                    to="/signin"
                    class="app-auth-submit mt-8 block w-full rounded-full px-6 py-4 text-center text-base font-semibold text-white"
                  >
                    Go to Login
                  </RouterLink>
                </div>

                <!-- STEP 1: Enter Join Code -->
                <template v-else-if="step === 1">
                  <p class="app-auth-title text-[28px] font-black uppercase tracking-[0.04em]">Sign Up</p>
                  <p class="mt-2 text-sm text-slate-500">
                    You need a join code from your organization admin to create an account.
                  </p>

                  <div class="mt-8 space-y-5">
                    <label class="block">
                      <span class="app-auth-label mb-2 block text-sm font-medium">Organization Join Code</span>
                      <input
                        v-model="codeForm.join_code"
                        type="text"
                        placeholder="e.g. UNI-2026-XK9AB"
                        class="app-auth-input uppercase tracking-widest"
                        @keyup.enter="validateCode"
                      />
                    </label>
                  </div>

                  <p v-if="errorMessage" class="mt-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {{ errorMessage }}
                  </p>

                  <button
                    type="button"
                    :disabled="loadingValidate"
                    class="app-auth-submit mt-7 w-full rounded-full px-6 py-4 text-lg font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
                    @click="validateCode"
                  >
                    {{ loadingValidate ? 'Validating...' : 'Continue' }}
                  </button>

                  <div class="mt-8 text-center">
                    <p class="app-auth-meta text-sm">Community and support channels</p>
                    <div class="mt-4 flex justify-center gap-5 text-white">
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
                </template>

                <!-- STEP 2: Registration Form -->
                <template v-else>
                  <div class="mb-6 flex items-center gap-3">
                    <button type="button" class="text-slate-400 transition hover:text-slate-600" @click="goBack">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <div>
                      <p class="app-auth-title text-[22px] font-black uppercase tracking-[0.04em]">Create Account</p>
                      <p class="text-xs text-slate-400">
                        Joining
                        <span class="font-semibold text-[var(--app-primary)]">{{ organization?.name }}</span>
                      </p>
                    </div>
                  </div>

                  <form class="space-y-4" @submit.prevent="submit">

                    <label class="block">
                      <span class="app-auth-label mb-2 block text-sm font-medium">Full Name</span>
                      <input
                        v-model="form.full_name"
                        type="text"
                        required
                        placeholder="Your full name"
                        class="app-auth-input"
                      />
                    </label>

                    <label class="block">
                      <span class="app-auth-label mb-2 block text-sm font-medium">Email</span>
                      <input
                        v-model="form.email"
                        type="email"
                        required
                        placeholder="name@example.com"
                        class="app-auth-input app-auth-input-muted"
                      />
                    </label>

                    <label class="block">
                      <span class="app-auth-label mb-2 block text-sm font-medium">Password</span>
                      <div class="relative">
                        <input
                          v-model="form.password"
                          :type="showPassword ? 'text' : 'password'"
                          required
                          placeholder="Create a password"
                          class="app-auth-input app-auth-input-muted pr-14"
                        />
                        <button
                          type="button"
                          class="app-auth-icon absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-sm transition hover:bg-[var(--app-primary-mist)]"
                          @click="showPassword = !showPassword"
                        >
                          <font-awesome-icon :icon="['fas', showPassword ? 'eye-slash' : 'eye']" />
                        </button>
                      </div>
                    </label>

                    <label class="block">
            <span class="app-auth-label mb-2 block text-sm font-medium">Confirm Password</span>
               <input
             v-model="form.confirm_password"
              type="password"
               required
              placeholder="Retype password"
             class="app-auth-input app-auth-input-muted"
              />
          </label>

                    <label class="block">
                      <span class="app-auth-label mb-2 block text-sm font-medium">
                        Department <span class="text-red-400">*</span>
                      </span>
                      <select
                        v-model="form.department_id"
                        required
                        class="app-auth-input app-auth-input-muted"
                      >
                        <option value="" disabled>
                          {{ loadingDepartments ? 'Loading departments...' : '— Select your department —' }}
                        </option>
                        <option
                          v-for="dept in departments"
                          :key="dept.id"
                          :value="dept.id"
                        >
                          {{ dept.name }}
                        </option>
                      </select>
                      <p v-if="departments.length === 0 && !loadingDepartments" class="mt-1 text-xs text-amber-600">
                        No departments set up yet. Contact your organization admin.
                      </p>
                    </label>

                    <p v-if="errorMessage" class="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {{ errorMessage }}
                    </p>

                    <button
                      type="submit"
                      :disabled="loadingSubmit"
                      class="app-auth-submit mt-2 w-full rounded-full px-6 py-4 text-lg font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
                    >
                      {{ loadingSubmit ? 'Registering...' : 'Complete Registration' }}
                    </button>

                  </form>
                </template>

              </div>
            </div>

          </section>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>