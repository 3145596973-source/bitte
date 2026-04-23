<template>
  <div class="profile-page">
    <div class="profile-card">
      <router-link to="/editor" class="profile-back">← 返回编辑器</router-link>

      <!-- 未登录状态 -->
      <template v-if="!userStore.isLoggedIn">
        <div class="profile-avatar">
          <div class="avatar-circle">🎨</div>
        </div>
        <h2 class="profile-nickname">未登录</h2>
        <p class="profile-hint">登录后可查看个人信息和草稿</p>
        <router-link to="/login" class="profile-login-btn">去登录</router-link>
      </template>

      <!-- 已登录状态 -->
      <template v-else>
        <div class="profile-avatar">
          <div class="avatar-circle">{{ avatarEmoji }}</div>
        </div>
        <h2 class="profile-nickname">{{ userStore.nickname }}</h2>
        <p class="profile-email">{{ userStore.email }}</p>
        <span class="profile-member" :class="{ 'profile-member-vip': userStore.isVip }">
          {{ userStore.isVip ? '✨ VIP 会员' : '🌸 免费版' }}
        </span>
        <div v-if="userStore.isVip && userStore.vipExpiresAt" class="vip-expires">
          到期时间：{{ formatTime(userStore.vipExpiresAt) }}
        </div>
        <button
          class="profile-vip-btn"
          @click="router.push('/pricing')"
        >
          {{ userStore.isVip ? '续费会员' : '开通会员' }}
        </button>

        <div class="profile-stats">
          <div class="stat-item">
            <div class="stat-num">{{ userStore.draftCount }}</div>
            <div class="stat-label">草稿</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ userStore.materialCount }}</div>
            <div class="stat-label">素材</div>
          </div>
        </div>

        <div class="profile-section">
          <h3 class="section-title">我的草稿</h3>
          <div v-if="draftsLoading" class="loading-hint">加载中...</div>
          <div v-else-if="drafts.length === 0" class="works-placeholder">
            <span class="works-icon">🖼️</span>
            <p>还没有草稿哦，去创作一个吧！</p>
            <router-link to="/editor" class="works-create-btn">开始创作</router-link>
          </div>
          <div v-else class="drafts-list">
            <div
              v-for="draft in drafts"
              :key="draft.id"
              class="draft-list-item"
            >
              <img
                v-if="draft.thumb"
                class="draft-list-thumb"
                :src="draft.thumb"
                alt="草稿缩略图"
              >
              <div v-else class="draft-list-thumb draft-list-thumb-empty">📝</div>
              <div class="draft-list-info">
                <span class="draft-list-name">{{ draft.name || '未命名草稿' }}</span>
                <span class="draft-list-time">{{ formatTime(draft.time) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <h3 class="section-title">我的订单</h3>
          <div v-if="ordersLoading" class="loading-hint">加载中...</div>
          <div v-else-if="orders.length === 0" class="works-placeholder">
            <span class="works-icon">🧾</span>
            <p>还没有订单哦</p>
          </div>
          <div v-else class="orders-list">
            <div
              v-for="order in orders"
              :key="order.order_no"
              class="order-item"
            >
              <div class="order-item-top">
                <span class="order-no">{{ order.order_no }}</span>
                <span
                  class="order-status"
                  :class="'order-status-' + order.status"
                >{{ statusLabel(order.status) }}</span>
              </div>
              <div class="order-item-info">
                <span>{{ order.plan_name }}</span>
                <span class="order-amount">¥{{ (order.amount / 100).toFixed(2) }}</span>
              </div>
              <div class="order-item-time">{{ formatTime(order.created_at) }}</div>
            </div>
          </div>
        </div>

        <button class="profile-logout-btn" @click="onLogout">退出登录</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMaterialsStore } from '@/stores/materials'

const router = useRouter()
const userStore = useUserStore()
const materialsStore = useMaterialsStore()

const drafts = computed(() => materialsStore.drafts)
const draftsLoading = computed(() => materialsStore.draftsLoading)

const orders = ref([])
const ordersLoading = ref(false)

function statusLabel(status) {
  const map = { pending: '待支付', paid: '已支付', cancelled: '已取消', refunded: '已退款' }
  return map[status] || status
}

const avatarEmoji = computed(() => {
  const emojis = ['🎨', '🌸', '🦋', '🌈', '💫', '🎀', '🌺', '🍀']
  if (!userStore.userId) return '🎨'
  return emojis[userStore.userId % emojis.length]
})

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function onLogout() {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  if (userStore.isLoggedIn) {
    userStore.fetchProfile()
    materialsStore.fetchDrafts()
    ordersLoading.value = true
    try {
      orders.value = await userStore.fetchMyOrders()
    } catch (err) {
      console.error('获取订单失败:', err)
    } finally {
      ordersLoading.value = false
    }
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: linear-gradient(135deg, #fff0f3, #fce4ec, #f8bbd0);
  padding: 40px 20px;
}

.profile-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px 36px;
  box-shadow: 0 8px 32px rgba(255, 143, 163, 0.15);
  text-align: center;
  min-width: 380px;
  max-width: 480px;
  width: 100%;
  position: relative;
}

.profile-back {
  position: absolute;
  top: 20px;
  left: 24px;
  font-size: 13px;
  color: #999;
  text-decoration: none;
  transition: color 0.15s;
}

.profile-back:hover {
  color: #ff8fa3;
}

.profile-avatar {
  margin-top: 12px;
  margin-bottom: 12px;
}

.avatar-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #fff0f3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  border: 3px solid #ffd6e0;
}

.profile-nickname {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 6px;
}

.profile-email {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.profile-hint {
  font-size: 13px;
  color: #bbb;
  margin-bottom: 20px;
}

.profile-login-btn {
  display: inline-block;
  height: 38px;
  line-height: 38px;
  padding: 0 28px;
  background: #ff8fa3;
  color: #fff;
  border-radius: 19px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
}

.profile-login-btn:hover {
  background: #ff7a91;
}

.profile-member {
  display: inline-block;
  font-size: 12px;
  color: #ff8fa3;
  background: #fff0f3;
  padding: 4px 12px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.profile-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.profile-section {
  text-align: left;
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.loading-hint {
  text-align: center;
  padding: 20px;
  color: #bbb;
  font-size: 13px;
}

.works-placeholder {
  text-align: center;
  padding: 32px 20px;
  color: #bbb;
  font-size: 13px;
}

.works-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
  opacity: 0.5;
}

.works-placeholder p {
  margin-bottom: 16px;
}

.works-create-btn {
  display: inline-block;
  height: 34px;
  line-height: 34px;
  padding: 0 20px;
  background: #ff8fa3;
  color: #fff;
  border-radius: 17px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
}

.works-create-btn:hover {
  background: #ff7a91;
}

.drafts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.draft-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  transition: background 0.15s;
}

.draft-list-item:hover {
  background: #fff0f3;
}

.draft-list-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
  background: #fff;
  flex-shrink: 0;
}

.draft-list-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #f5f5f5;
}

.draft-list-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.draft-list-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draft-list-time {
  font-size: 11px;
  color: #bbb;
}

.profile-member-vip {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  color: #e65100;
}

.vip-expires {
  font-size: 12px;
  color: #bbb;
  margin-bottom: 8px;
}

.profile-vip-btn {
  display: inline-block;
  height: 34px;
  padding: 0 24px;
  border: none;
  background: linear-gradient(135deg, #ff8fa3, #ff6b8a);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  border-radius: 17px;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-bottom: 20px;
}

.profile-vip-btn:hover {
  opacity: 0.85;
}

/* 订单列表 */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-item {
  padding: 12px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  transition: background 0.15s;
}

.order-item:hover {
  background: #fff0f3;
}

.order-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.order-no {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.order-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 500;
}

.order-status-paid {
  background: #e6f4ea;
  color: #188038;
}

.order-status-pending {
  background: #fef7e0;
  color: #ea8600;
}

.order-status-cancelled {
  background: #f0f0f0;
  color: #999;
}

.order-status-refunded {
  background: #fce8e6;
  color: #c5221f;
}

.order-item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
}

.order-amount {
  font-weight: 600;
  color: #ff6b8a;
}

.order-item-time {
  font-size: 11px;
  color: #bbb;
}

.profile-logout-btn {
  width: 100%;
  height: 40px;
  border: 1.5px solid #eee;
  background: #fff;
  color: #999;
  font-size: 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.profile-logout-btn:hover {
  border-color: #ff6b6b;
  color: #ff6b6b;
}
</style>
