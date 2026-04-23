<template>
  <div class="login-page">
    <div class="login-card">
      <img :src="'/logo.png'" alt="Bitté" class="login-logo">
      <h1 class="login-title">欢迎来到 Bitté</h1>
      <p class="login-subtitle">创意拼贴，从这里开始</p>

      <div class="login-tabs">
        <span
          class="login-tab"
          :class="{ active: mode === 'login' }"
          @click="mode = 'login'"
        >登录</span>
        <span
          class="login-tab"
          :class="{ active: mode === 'register' }"
          @click="mode = 'register'"
        >注册</span>
      </div>

      <form class="login-form" @submit.prevent="onSubmit">
        <input
          v-if="mode === 'register'"
          class="login-input"
          type="text"
          placeholder="昵称（选填）"
          v-model="nickname"
        >
        <input
          class="login-input"
          type="email"
          placeholder="邮箱"
          v-model="account"
        >
        <input
          class="login-input"
          type="password"
          placeholder="密码"
          v-model="password"
        >
        <input
          v-if="mode === 'register'"
          class="login-input"
          type="password"
          placeholder="确认密码"
          v-model="confirmPassword"
        >

        <div v-if="errorMsg" class="login-error">{{ errorMsg }}</div>

        <button class="login-btn" :disabled="loading">
          <span v-if="loading" class="login-spinner"></span>
          {{ loading ? '请稍候...' : (mode === 'login' ? '登录' : '注册') }}
        </button>
      </form>

      <router-link to="/editor" class="login-back">← 返回编辑器</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const mode = ref('login')
const account = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function onSubmit() {
  errorMsg.value = ''

  if (!account.value.trim()) {
    errorMsg.value = '请输入邮箱'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }

  if (mode.value === 'register') {
    if (password.value.length < 6) {
      errorMsg.value = '密码至少 6 位'
      return
    }
    if (password.value !== confirmPassword.value) {
      errorMsg.value = '两次密码不一致'
      return
    }
  }

  loading.value = true
  try {
    if (mode.value === 'login') {
      await userStore.login(account.value.trim(), password.value)
    } else {
      await userStore.register(account.value.trim(), password.value, nickname.value.trim())
    }
    router.push('/editor')
  } catch (err) {
    errorMsg.value = err.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff0f3, #fce4ec, #f8bbd0);
}

.login-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 8px 32px rgba(255, 143, 163, 0.15);
  text-align: center;
  min-width: 340px;
  max-width: 400px;
  width: 100%;
}

.login-logo {
  height: 48px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 6px;
}

.login-subtitle {
  font-size: 13px;
  color: #999;
  margin-bottom: 24px;
}

.login-tabs {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 20px;
}

.login-tab {
  font-size: 14px;
  color: #999;
  cursor: pointer;
  padding-bottom: 6px;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.login-tab.active {
  color: #ff8fa3;
  border-bottom-color: #ff8fa3;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-input {
  height: 42px;
  border: 1.5px solid #eee;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}

.login-input:focus {
  border-color: #ff8fa3;
}

.login-error {
  color: #ff6b6b;
  font-size: 13px;
  text-align: left;
  padding: 0 4px;
}

.login-btn {
  height: 42px;
  border: none;
  background: #ff8fa3;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn:hover {
  background: #ff7a91;
}

.login-btn:active {
  transform: scale(0.98);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-back {
  display: inline-block;
  margin-top: 20px;
  font-size: 13px;
  color: #999;
  text-decoration: none;
  transition: color 0.15s;
}

.login-back:hover {
  color: #ff8fa3;
}
</style>
