<script setup>
import { RouterView } from 'vue-router';
import AppFooter from '../components/AppFooter.vue';
</script>

<template>
  <div class="public-site-shell flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
    <RouterView />
    <AppFooter />
  </div>
</template>

<style scoped>
.public-site-shell {
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
}
</style>
