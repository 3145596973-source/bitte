<template>
  <aside class="side-nav">
    <div class="logo">
      <h1>Bitté</h1>
      <span>管理后台</span>
    </div>

    <nav>
      <router-link to="/dashboard" class="nav-item" active-class="active">
        <span class="icon">📊</span>
        <span>仪表盘</span>
      </router-link>
      <router-link to="/materials" class="nav-item" active-class="active">
        <span class="icon">🎨</span>
        <span>素材管理</span>
      </router-link>
      <router-link to="/users" class="nav-item" active-class="active">
        <span class="icon">👥</span>
        <span>用户管理</span>
      </router-link>
      <router-link to="/orders" class="nav-item" active-class="active">
        <span class="icon">📋</span>
        <span>订单管理</span>
      </router-link>
    </nav>

    <div class="nav-footer">
      <a class="nav-item" @click="logout">
        <span class="icon">🚪</span>
        <span>退出登录</span>
      </a>
    </div>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function logout() {
  localStorage.removeItem('admin_token')
  router.push('/login')
}
</script>
