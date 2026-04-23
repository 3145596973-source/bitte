<template>
  <div class="app">
    <SideNav v-if="isLoggedIn && !isLoginPage" />
    <main :class="{ 'with-nav': isLoggedIn && !isLoginPage }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SideNav from './components/SideNav.vue'

const route = useRoute()

const isLoginPage = computed(() => route.path === '/login')
const isLoggedIn = computed(() => !!localStorage.getItem('admin_token'))
</script>
