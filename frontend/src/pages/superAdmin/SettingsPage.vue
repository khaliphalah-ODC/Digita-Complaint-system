<script setup>
import PageHeader from '../../components/superAdmin/PageHeader.vue';

const settingGroups = [
  {
    title: 'Platform Guardrails',
    description: 'Keep organization creation, triage, and analytics access consistent across the platform.',
    items: ['Super-admin-only analytics access', 'Organization activation lifecycle', 'Anonymous complaint triage rules']
  },
  {
    title: 'Organization Policy',
    description: 'Control the baseline rules that new organizations inherit during onboarding.',
    items: ['Default org-admin onboarding flow', 'Organization status policy', 'Directory record completeness']
  },
  {
    title: 'Routing Rules',
    description: 'Protect complaint routing quality without exposing tenant-internal operations to platform admins.',
    items: ['Organization-first complaint routing', 'Fallback triage queue assignment', 'Department-aware complaint submission']
  },
  {
    title: 'Security Snapshot',
    description: 'Keep access posture visible even before deeper system configuration pages are added.',
    items: ['JWT-based platform sessions', 'Forced first-login password change', 'Tenant-safe RBAC boundaries']
  }
];
</script>

<template>
  <section class="app-dark-stage space-y-5 rounded-[34px] p-4 sm:p-6">
    <PageHeader
      theme="dark"
      kicker="Platform Controls"
      title="Settings"
      description="Review the operational guardrails that shape organization onboarding, complaint routing, and super-admin platform control."
    />

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="group in settingGroups"
        :key="group.title"
        class="rounded-[26px] border border-white/8 bg-white/[0.04] p-5"
      >
        <p class="text-xs uppercase tracking-wide text-white/46">{{ group.title }}</p>
        <p class="mt-3 text-sm leading-6 text-white/58">{{ group.description }}</p>
        <ul class="mt-4 space-y-2 text-sm font-medium text-white/84">
          <li v-for="item in group.items" :key="item" class="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2">
            {{ item }}
          </li>
        </ul>
      </article>
    </section>

    <section class="app-dark-panel rounded-[30px] p-6">
      <h2 class="text-xl font-black text-white">Configuration Direction</h2>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-white/58">
        This page is now aligned with the standard super-admin shell. It presents policy and platform-control groups cleanly
        while leaving room for future live configuration forms without breaking the current flow.
      </p>
    </section>
  </section>
</template>
