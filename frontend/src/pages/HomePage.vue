<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useSessionStore } from '../stores/session';

const session = useSessionStore();
const isLoggedIn = computed(() => session.isLoggedIn);
const dashboardRoute = computed(() => (session.currentUser?.role === 'admin' ? '/admin/dashboard' : '/team-dashboard'));
</script>

<template>
  <div class="min-h-screen w-screen bg-white">
    <div class="min-h-screen w-full px-4 py-3 md:px-8">
      <header class="border-b border-slate-200 pb-3">
        <nav class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-2xl font-black text-slate-900">Complaint <span class="text-orange-500 text-x12 text-bold">MS</span> </p>
            <p class="text-xs font-medium text-slate-500">Submit · Track · Resolve</p>
          </div>

          <ul class="flex flex-wrap items-center gap-5 text-sm font-semibold text-slate-700">
            <li><RouterLink to="/" class="border-b-2 border-slate-900 pb-1">Home</RouterLink></li>
            <li><RouterLink to="/signin" class="hover:text-slate-900">Submit Complaint</RouterLink></li>
            <li><RouterLink to="/signin" class="hover:text-slate-900">My Complaints</RouterLink></li>
            <li><RouterLink to="/organizations" class="hover:text-slate-900">Organizations</RouterLink></li>
          </ul>

          <div class="flex items-center gap-3">
            <RouterLink
              to="/signin"
              class="rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Login
            </RouterLink>
            <RouterLink
              to="/signup"
              class="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign Up
            </RouterLink>
            <RouterLink
              v-if="isLoggedIn"
              :to="dashboardRoute"
              class="rounded-xl border border-blue-600 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Dashboard
            </RouterLink>
          </div>
        </nav>
      </header>

      <section class="mx-auto max-w-5xl py-14 text-center md:py-20">
        <h1 class="text-5xl font-black leading-tight text-slate-900 md:text-7xl">
          Voice Your Concerns,<br>Track Real Change
        </h1>
        <p class="mt-4 text-xl text-slate-600 md:text-lg">
          For schools, NGOs, local offices - anonymous or named submissions
        </p>

        <div class="mt-9 flex flex-wrap items-center justify-center gap-5">
          <RouterLink to="/signin" class="rounded-xl bg-blue-600 px-9 py-3 text-2xl font-semibold text-white hover:bg-blue-700 md:text-lg">
            Submit Now
          </RouterLink>
          <a href="#features" class="rounded-xl px-6 py-3 text-2xl font-semibold text-blue-700 hover:bg-blue-50 md:text-lg">
            See How It Works
          </a>
        </div>
      </section>

      <section id="features" class="grid grid-cols-1 gap-4 pb-8 md:grid-cols-3">
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="mb-3 text-4xl">🧾</p>
          <h2 class="text-4xl font-bold text-slate-900 md:text-3xl">Easy Form</h2>
          <p class="mt-2 text-lg text-slate-600 md:text-base">Simple complaint submission for organizations.</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="mb-3 text-4xl">📊</p>
          <h2 class="text-4xl font-bold text-slate-900 md:text-3xl">Live Tracking</h2>
          <p class="mt-2 text-lg text-slate-600 md:text-base">Track complaint progress from start to finish.</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="mb-3 text-4xl">🔒</p>
          <h2 class="text-4xl font-bold text-slate-900 md:text-3xl">Secure & Anonymous</h2>
          <p class="mt-2 text-lg text-slate-600 md:text-base">Submit safely with optional anonymity.</p>
        </article>
      </section>
    </div>
  </div>
</template>
