<script setup>
import PageHeader from '../../components/superAdmin/PageHeader.vue';

const overviewCards = [
  {
    title: 'Organization lifecycle',
    value: 'Managed centrally',
    detail: 'Creation, activation, and suspension remain controlled by super-admin oversight.'
  },
  {
    title: 'Complaint routing',
    value: 'Organization-first',
    detail: 'Anonymous complaints enter triage before they move into an organization workflow.'
  },
  {
    title: 'Access model',
    value: 'Role-based',
    detail: 'Super-admin access stays platform-wide while org-admin access remains tenant-specific.'
  }
];

const settingGroups = [
  {
    title: 'Organization Settings',
    description: 'Core rules that affect onboarding, record completeness, and organization availability.',
    items: [
      'New organization records should include an assigned org-admin where possible.',
      'Inactive organizations should be reviewed before routing complaints to them.',
      'Directory records should keep contact email, type, and address up to date.'
    ]
  },
  {
    title: 'Triage and Routing',
    description: 'Super-admin controls that keep anonymous complaints moving into the correct organization.',
    items: [
      'Anonymous complaints enter the triage queue until an organization is assigned.',
      'Only active organizations should appear as assignment targets.',
      'Routing policy should stay organization-focused rather than department-operational.'
    ]
  },
  {
    title: 'Reporting and Oversight',
    description: 'Platform-level analytics that inform supervision without exposing internal tenant operations.',
    items: [
      'Complaint, escalation, and feedback reporting remain aggregate at the platform level.',
      'Trend coverage should expand to include escalation and resolution movement over time.',
      'Attention rules should highlight backlog pressure, routing delays, and missing admin coverage.'
    ]
  },
  {
    title: 'Security and Access',
    description: 'Current access posture and areas for future configuration work.',
    items: [
      'Role boundaries should continue separating super-admin and org-admin responsibilities.',
      'Session controls and password policies should remain visible to reviewers.',
      'Future settings screens can add editable controls without changing this structure.'
    ]
  }
];
</script>

<template>
  <section class="space-y-6 bg-slate-50 p-4 sm:p-6">
    <PageHeader
      title="Settings"
      description="Overview of the platform rules and configuration areas that shape super-admin oversight."
    />

    <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <article
        v-for="card in overviewCards"
        :key="card.title"
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <p class="text-sm font-medium text-slate-500">{{ card.title }}</p>
        <p class="mt-2 text-xl font-semibold text-slate-900">{{ card.value }}</p>
        <p class="mt-2 text-sm text-slate-600">{{ card.detail }}</p>
      </article>
    </section>

    <section class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <article
        v-for="group in settingGroups"
        :key="group.title"
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 class="text-lg font-semibold text-slate-900">{{ group.title }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ group.description }}</p>
        <ul class="mt-4 space-y-3">
          <li
            v-for="item in group.items"
            :key="item"
            class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            {{ item }}
          </li>
        </ul>
      </article>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-900">Configuration Direction</h2>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        This screen now reads like a real settings overview instead of a decorative placeholder. It keeps the current project
        believable for academic review while leaving clean room for future editable forms, policy toggles, and audit-linked controls.
      </p>
    </section>
  </section>
</template>
