<script setup>
import { RouterLink } from 'vue-router';

import { useSessionStore } from '../stores/session';
                                                                                                                                               

const session = useSessionStore();
const isLoggedIn = computed(() => session.isLoggedIn);
const dashboardRoute = computed(() => (session.currentUser?.role === 'admin' ? '/admin/dashboard' : '/team-dashboard'));

import AuthTopNav from '../components/AuthTopNav.vue';
import AppFooter from '../components/AppFooter.vue';
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col">
    <div class="w-full flex-1 px-0 py-3">
      <AuthTopNav fixed />

      <section class="grid gap-5 px-4 pb-8 pt-24 sm:px-5 sm:pt-28 md:px-8 lg:grid-cols-[1.15fr,0.85fr] lg:items-stretch lg:py-10 lg:pt-32">
        <article class="app-shell-panel relative overflow-hidden rounded-[34px] px-5 py-8 sm:px-7 md:px-8 md:py-10">
          <div class="absolute -right-14 top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(217,119,6,0.26),transparent_68%)]"></div>
          <div class="absolute bottom-0 right-0 h-40 w-40 rounded-tl-[4rem] bg-[linear-gradient(135deg,rgba(31,77,183,0.18),rgba(16,33,60,0.02))]"></div>
          <p class="app-kicker">Public Reporting Experience</p>
          <h1 class="mt-4 max-w-3xl text-4xl font-black leading-[0.96] text-slate-900 sm:text-5xl lg:text-7xl">
            Raise issues clearly.
            <span class="block text-[var(--app-primary)]">Route them fast.</span>
          </h1>
          <p class="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            A civic reporting interface built for real use: direct organization routing, anonymous submissions when needed, and complaint tracking that stays readable and calm under pressure.
          </p>

          <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap">
            <RouterLink to="/submit-complaint" class="rounded-full bg-[var(--app-primary)] px-7 py-3 text-center text-base font-semibold text-white shadow-[0_14px_32px_rgba(31,77,183,0.24)] hover:-translate-y-0.5 hover:bg-[var(--app-primary-ink)]">
              Submit a Complaint
            </RouterLink>
            <RouterLink to="/track-complaint" class="rounded-full border border-slate-300 bg-white/70 px-7 py-3 text-center text-base font-semibold text-slate-800 hover:bg-white">
              Track Existing Case
            </RouterLink>
          </div>

          <div class="mt-8 grid gap-3 sm:grid-cols-3">
            <div class="app-ink-card rounded-[24px] p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Channels</p>
              <p class="mt-2 text-2xl font-black text-slate-900">Anonymous + Named</p>
            </div>
            <div class="app-ink-card rounded-[24px] p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Routing</p>
              <p class="mt-2 text-2xl font-black text-slate-900">Organization + Department</p>
            </div>
            <div class="app-ink-card rounded-[24px] p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tracking</p>
              <p class="mt-2 text-2xl font-black text-slate-900">Status-first</p>
            </div>
          </div>
        </article>

        <aside class="grid gap-4">
          <article class="rounded-[30px] border border-[#14345b] bg-[linear-gradient(180deg,#10213c_0%,#183563_100%)] p-6 text-white shadow-[0_24px_60px_rgba(16,33,60,0.25)]">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Why It Works</p>
            <div class="mt-4 space-y-4">
              <div class="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p class="text-sm font-semibold">Direct Routing</p>
                <p class="mt-1 text-sm text-blue-100/85">Complaints go to the right organization first, not a generic inbox.</p>
              </div>
              <div class="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p class="text-sm font-semibold">Triage Only When Needed</p>
                <p class="mt-1 text-sm text-blue-100/85">Unknown-organization complaints are treated as an exception, not the default.</p>
              </div>
              <div class="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p class="text-sm font-semibold">Tenant-Safe Admin Flow</p>
                <p class="mt-1 text-sm text-blue-100/85">Org admins see only their own operational space. Super admins stay at the organization layer.</p>
              </div>
            </div>
          </article>

          <article id="features" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div class="app-ink-card rounded-[28px] p-5">
              <p class="mb-3 text-4xl text-[var(--app-primary)]"><font-awesome-icon :icon="['fas', 'file-lines']" /></p>
              <h2 class="text-2xl font-bold text-slate-900">Focused Submission</h2>
              <p class="mt-2 text-base text-slate-600">Purpose-built forms that route by organization and optionally by department.</p>
            </div>
            <div class="app-ink-card rounded-[28px] p-5">
              <p class="mb-3 text-4xl text-emerald-600"><font-awesome-icon :icon="['fas', 'chart-line']" /></p>
              <h2 class="text-2xl font-bold text-slate-900">Readable Tracking</h2>
              <p class="mt-2 text-base text-slate-600">Tracking codes, timelines, and statuses are visible without making users decode the system.</p>
            </div>
          </article>
        </aside>
      </section>

        <!-- Footer -->
      <section class="w-full"><br><br><br>
        <div class="bg-black h-auto">
          <div class="bg-gray-900   flex flex-wrap p-6 justify-center sm:justify-between">

            <!-- Features -->
            <div class="p-4 w-60 flex flex-col">
              <p class="text-gray-400"><b>FEATURES</b></p><br>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
            </div>

            <!-- Partners -->
            <div class="p-4 w-60 flex flex-col">
              <p class="text-gray-400"><b>SERVICES</b></p><br>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>

            </div>

            <!-- Customers -->
            <div class="p-4 w-60 flex flex-col">
              <a href="#" class="text-gray-400"><p><b>CUSTOMERS</b></p></a><br>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">Automatic Email forwarding</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">Synchronize complaints</p></a>
            </div>

            <!-- Partners -->
            <div class="p-4 w-60 flex flex-col">
              <p class="p-1 decoration-curent text-gray-400"><b> PARTNERS</b></p><br>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">Automatic Email forwarding</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">Synchronize complaints</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">Automatic Email forwarding</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">Synchronize complaints</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">AI-Integration</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">Automatic Email forwarding</p></a>
              <a href="#"><p class="text-xs leading-tight p-1 decoration-curent text-gray-400 hover:underline hover:scale-102 duration-100 ease-out">Synchronize complaints</p></a>
            </div><br>

            <!-- fi-fa-con -->
            

          </div>
          <section class="flex flex-wrap hi-auto">
              <div class="p-2 mb-6 gap-4 justify-center w-auto flex items-center mx-auto">
                <a href="#" class="text-blue-600 hover:bg-gray-800 inline-flex p-1 rounded hover:scale-110 duration-300"><i class="fa-brands fa-facebook text-2xl"></i></a>
                <a href="#" class="text-sky-500 hover:bg-gray-800 inline-flex p-1 rounded hover:scale-110 duration-300"><i class="fa-brands fa-x-twitter text-2xl"></i></a>
                <a href="#" class="text-pink-500 hover:bg-gray-800 inline-flex p-1 rounded hover:scale-110 duration-300"><i class="fa-brands fa-instagram text-2xl"></i></a>
                <a href="#" class="text-red-500 hover:bg-gray-800 inline-flex p-1 rounded hover:scale-110 duration-300"><i class="fa-solid fa-envelope text-2xl"></i></a>
              </div> 
            </section>
        </div>
      </section>
    </div>
    <AppFooter />
  </div>
</template>
