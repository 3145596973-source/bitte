<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Bitté Admin</h1>
      <p class="subtitle">管理员登录</p>

      <div v-if="error" class="login-error">{{ error }}</div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>邮箱</label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            placeholder="admin@bitte.com"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = '请输入邮箱和密码'
    return
  }

  loading.value = true

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const data = await res.json()

    if (!res.ok) {
      error.value = data.error || '登录失败'
      return
    }

    // 检查是否为管理员
    if (!data.user.is_admin) {
      error.value = '该账号没有管理员权限'
      return
    }

    localStorage.setItem('admin_token', data.token)
    router.push('/dashboard')
  } catch (err) {
    error.value = '网络错误，请检查服务是否启动'
  } finally {
    loading.value = false
  }
}
</script>
