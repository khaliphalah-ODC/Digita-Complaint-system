<script setup>
defineProps({
  isLoggedIn: {
    type: Boolean,
    required: true
  },
  loadingLogin: {
    type: Boolean,
    required: true
  },
  errorMessage: {
    type: String,
    default: ''
  },
  loginForm: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  },
  userInitials: {
    type: String,
    default: 'U'
  }
});

defineEmits(['submit-login']);
</script>

<template>
  <div class="flex w-full flex-col items-stretch gap-2 md:w-auto">
    <form v-if="!isLoggedIn" class="flex flex-col gap-2 md:flex-row" @submit.prevent="$emit('submit-login')">
      <input
        v-model="loginForm.email"
        type="email"
        required
        placeholder="Email"
        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 md:w-56"
      >
      <input
        v-model="loginForm.password"
        type="password"
        required
        placeholder="Password"
        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 md:w-44"
      >
      <button
        type="submit"
        :disabled="loadingLogin"
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
      >
        {{ loadingLogin ? 'Logging in...' : 'Login' }}
      </button>
    </form>

    <div v-else class="flex items-center gap-3 self-end rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div class="h-11 w-11 rounded-full bg-gradient-to-br from-blue-600 to-slate-700 text-center text-sm font-bold leading-[2.8rem] text-white">
        {{ userInitials }}
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-slate-900">{{ currentUser?.full_name || 'User Profile' }}</p>
        <p class="text-xs text-slate-500">{{ currentUser?.email }}</p>
      </div>
    </div>

    <p v-if="errorMessage" class="text-right text-xs text-red-600">{{ errorMessage }}</p>
  </div>
</template>
