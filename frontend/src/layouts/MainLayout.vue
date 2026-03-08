<script setup>
import { computed, onMounted } from 'vue';
import { RouterView } from 'vue-router';
import SidebarNav from '../components/SidebarNav.vue';
import AppToast from '../components/AppToast.vue';
import { useSessionStore } from '../stores/session';

const session = useSessionStore();
const isAdmin = computed(() => session.currentUser?.role === 'admin');
const profileAvatar = computed(() => {
  return (
    session.currentUser?.avatar_url ||
    session.currentUser?.avatar ||
    session.currentUser?.profile_image ||
    session.currentUser?.photo_url ||
    ''
  );
});

onMounted(session.fetchCurrentUser);
</script>

<template>
  <div class="h-screen w-full bg-[radial-gradient(circle_at_20%_0%,#cde0ff_0,#e9eef8_45%,#eef2f7_100%)]">
    <AppToast />
    <div class="flex h-full w-full overflow-hidden">
      <SidebarNav @logout="session.logout" />
      <main class="h-full w-full overflow-y-auto">
        <header class="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-7">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-orange-600">{{ isAdmin ? 'Admin Workspace' : 'User Workspace' }}</p>
            <p class="text-sm text-slate-600">Complaint Management System</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="hidden text-right sm:block">
              <p class="text-sm font-semibold text-slate-900">{{ session.currentUser?.full_name || 'User' }}</p>
              <p class="text-xs text-slate-500">{{ session.currentUser?.email || 'No email' }}</p>
            </div>

            <img
              v-if="profileAvatar"
              :src="profileAvatar"
              alt="User Avatar"
              class="h-10 w-10 rounded-full border border-slate-200 object-cover"
            >
            <div
              v-else
              class="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 text-center text-sm font-bold leading-10 text-white"
            >
              {{ session.userInitials }}
            </div>

            <button
              class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100"
              @click="session.logout"
            >
              Logout
            </button>
          </div>
        </header>

        <section class="p-4 md:p-7">
          <RouterView />
        </section>
      </main>
    </div>
  </div>
</template>
