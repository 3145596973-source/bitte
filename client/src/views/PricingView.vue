<template>
  <div class="pricing-page">
    <div class="pricing-container">
      <router-link to="/editor" class="pricing-back">← 返回编辑器</router-link>

      <h1 class="pricing-title">选择你的会员套餐</h1>
      <p class="pricing-subtitle">解锁全部 VIP 素材，导出无水印作品</p>

      <!-- 当前 VIP 状态 -->
      <div v-if="userStore.isVip" class="vip-status-banner">
        <span class="vip-status-icon">✨</span>
        <div class="vip-status-info">
          <span class="vip-status-label">当前为 VIP 会员</span>
          <span class="vip-status-expires">到期时间：{{ formatDate(userStore.vipExpiresAt) }}</span>
        </div>
      </div>

      <!-- 套餐卡片 -->
      <div v-if="loading" class="loading-hint">加载中...</div>
      <div v-else class="plan-cards">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="plan-card"
          :class="{ recommended: plan.duration_days === 365 }"
        >
          <div v-if="plan.duration_days === 365" class="plan-badge">最划算</div>
          <h3 class="plan-name">{{ plan.name }}</h3>
          <div class="plan-price">
            <span class="plan-currency">¥</span>
            <span class="plan-amount">{{ (plan.price / 100).toFixed(2) }}</span>
          </div>
          <p class="plan-duration">{{ plan.duration_days }} 天</p>
          <p class="plan-desc">{{ plan.description }}</p>
          <ul class="plan-features">
            <li>✓ 全部 VIP 素材</li>
            <li>✓ 导出无水印</li>
            <li>✓ 优先客服支持</li>
          </ul>
          <button
            class="plan-btn"
            :class="{ 'plan-btn-recommended': plan.duration_days === 365 }"
            @click="openPayDialog(plan)"
          >
            {{ userStore.isVip ? '续费' : '立即开通' }}
          </button>
        </div>
      </div>

      <!-- 支付确认弹窗 -->
      <div v-if="showPayDialog" class="pay-overlay" @click.self="closePayDialog">
        <div class="pay-dialog">
          <button class="pay-close" @click="closePayDialog">✕</button>
          <h3 class="pay-title">确认支付</h3>
          <div class="pay-info">
            <div class="pay-info-row">
              <span>套餐</span>
              <span>{{ selectedPlan?.name }}</span>
            </div>
            <div class="pay-info-row">
              <span>时长</span>
              <span>{{ selectedPlan?.duration_days }} 天</span>
            </div>
            <div class="pay-info-row pay-info-total">
              <span>应付金额</span>
              <span class="pay-total-amount">¥{{ (selectedPlan?.price / 100).toFixed(2) }}</span>
            </div>
          </div>
          <p class="pay-mock-hint">🔧 当前为模拟支付，点击即完成</p>
          <button
            class="pay-confirm-btn"
            :disabled="paying"
            @click="handlePay"
          >
            {{ paying ? '支付中...' : '确认支付' }}
          </button>
        </div>
      </div>

      <!-- 支付成功弹窗 -->
      <div v-if="showSuccess" class="pay-overlay" @click.self="showSuccess = false">
        <div class="pay-dialog pay-success-dialog">
          <div class="success-icon">🎉</div>
          <h3 class="pay-title">支付成功！</h3>
          <p class="success-msg">恭喜你已成为 VIP 会员，尽情享受所有特权吧</p>
          <button class="pay-confirm-btn" @click="showSuccess = false">好的</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const plans = ref([])
const loading = ref(true)
const showPayDialog = ref(false)
const showSuccess = ref(false)
const selectedPlan = ref(null)
const paying = ref(false)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

async function loadPlans() {
  loading.value = true
  try {
    plans.value = await userStore.fetchPlans()
  } catch (err) {
    console.error('加载套餐失败:', err)
  } finally {
    loading.value = false
  }
}

function openPayDialog(plan) {
  if (!userStore.isLoggedIn) {
    // 未登录则跳转登录
    window.location.href = '/login'
    return
  }
  selectedPlan.value = plan
  showPayDialog.value = true
}

function closePayDialog() {
  showPayDialog.value = false
  selectedPlan.value = null
}

async function handlePay() {
  if (!selectedPlan.value || paying.value) return
  paying.value = true
  try {
    // 1. 创建订单
    const order = await userStore.createOrder(selectedPlan.value.id)
    // 2. 模拟支付
    await userStore.payOrder(order.order_no)
    // 3. 成功
    showPayDialog.value = false
    selectedPlan.value = null
    showSuccess.value = true
  } catch (err) {
    alert(err.message || '支付失败，请稍后再试')
  } finally {
    paying.value = false
  }
}

onMounted(() => {
  loadPlans()
})
</script>

<style scoped>
.pricing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff0f3, #fce4ec, #f8bbd0);
  padding: 40px 20px;
  display: flex;
  justify-content: center;
}

.pricing-container {
  max-width: 900px;
  width: 100%;
  position: relative;
}

.pricing-back {
  display: inline-block;
  font-size: 13px;
  color: #999;
  text-decoration: none;
  margin-bottom: 24px;
  transition: color 0.15s;
}

.pricing-back:hover {
  color: #ff8fa3;
}

.pricing-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.pricing-subtitle {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-bottom: 32px;
}

.vip-status-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #fff8e1, #fff0f3);
  border: 1px solid #ffd6a5;
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 28px;
}

.vip-status-icon {
  font-size: 28px;
}

.vip-status-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vip-status-label {
  font-size: 15px;
  font-weight: 600;
  color: #e67e22;
}

.vip-status-expires {
  font-size: 12px;
  color: #999;
}

.loading-hint {
  text-align: center;
  padding: 40px;
  color: #bbb;
  font-size: 14px;
}

.plan-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.plan-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.plan-card.recommended {
  border-color: #ff8fa3;
  box-shadow: 0 8px 30px rgba(255, 143, 163, 0.2);
}

.plan-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff8fa3;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 16px;
  border-radius: 12px;
  white-space: nowrap;
}

.plan-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.plan-price {
  margin-bottom: 4px;
}

.plan-currency {
  font-size: 16px;
  color: #ff8fa3;
  font-weight: 500;
  vertical-align: top;
  line-height: 1.8;
}

.plan-amount {
  font-size: 36px;
  font-weight: 700;
  color: #ff8fa3;
}

.plan-duration {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.plan-desc {
  font-size: 13px;
  color: #bbb;
  margin-bottom: 20px;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  text-align: left;
}

.plan-features li {
  font-size: 13px;
  color: #666;
  padding: 4px 0;
}

.plan-btn {
  width: 100%;
  height: 42px;
  border: 2px solid #ff8fa3;
  background: #fff;
  color: #ff8fa3;
  font-size: 14px;
  font-weight: 600;
  border-radius: 21px;
  cursor: pointer;
  transition: all 0.15s;
}

.plan-btn:hover {
  background: #fff0f3;
}

.plan-btn-recommended {
  background: #ff8fa3;
  color: #fff;
}

.plan-btn-recommended:hover {
  background: #ff7a91;
}

/* 支付弹窗 */
.pay-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.pay-dialog {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  width: 380px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.pay-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.pay-close:hover {
  color: #333;
}

.pay-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 24px;
}

.pay-info {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.pay-info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: #666;
}

.pay-info-total {
  border-top: 1px solid #eee;
  padding-top: 10px;
  margin-top: 6px;
  font-weight: 600;
  color: #333;
}

.pay-total-amount {
  color: #ff8fa3;
  font-size: 18px;
  font-weight: 700;
}

.pay-mock-hint {
  text-align: center;
  font-size: 12px;
  color: #bbb;
  margin-bottom: 16px;
}

.pay-confirm-btn {
  width: 100%;
  height: 44px;
  border: none;
  background: #ff8fa3;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border-radius: 22px;
  cursor: pointer;
  transition: background 0.15s;
}

.pay-confirm-btn:hover:not(:disabled) {
  background: #ff7a91;
}

.pay-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pay-success-dialog {
  text-align: center;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.success-msg {
  font-size: 13px;
  color: #999;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .plan-cards {
    grid-template-columns: 1fr;
    max-width: 360px;
    margin: 0 auto;
  }
}
</style>
