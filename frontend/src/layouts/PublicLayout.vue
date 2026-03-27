<script setup>
import { RouterView } from 'vue-router';
import AppFooter from '../components/AppFooter.vue';
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <RouterView />
    <AppFooter />
  </div>
</template>
