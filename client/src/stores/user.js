import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const isLoggedIn = ref(false)
  const nickname = ref('')
  const avatar = ref('')
  const email = ref('')
  const memberLevel = ref('free') // free | pro | premium
  const userId = ref(null)
  const draftCount = ref(0)
  const materialCount = ref(0)
  const vipExpiresAt = ref(null)

  // VIP 状态计算：is_vip=1 且未过期
  const isVip = computed(() => {
    if (memberLevel.value !== 'pro') return false
    if (!vipExpiresAt.value) return false
    return new Date(vipExpiresAt.value) > new Date()
  })

  // 从 token 恢复登录状态
  async function init() {
    const token = localStorage.getItem('bitte_token')
    if (!token) return
    try {
      await fetchMe()
    } catch {
      // token 无效，清除
      localStorage.removeItem('bitte_token')
    }
  }

  // 注册
  async function register(emailVal, passwordVal, nicknameVal) {
    const data = await api.post('/auth/register', {
      email: emailVal,
      password: passwordVal,
      nickname: nicknameVal,
    })
    localStorage.setItem('bitte_token', data.token)
    setUserData(data.user)
    return data
  }

  // 登录
  async function login(emailVal, passwordVal) {
    const data = await api.post('/auth/login', {
      email: emailVal,
      password: passwordVal,
    })
    localStorage.setItem('bitte_token', data.token)
    setUserData(data.user)
    return data
  }

  // 获取当前用户
  async function fetchMe() {
    const data = await api.get('/auth/me')
    setUserData(data.user)
    return data
  }

  // 获取详细资料（含统计）
  async function fetchProfile() {
    const data = await api.get('/users/profile')
    setUserData(data.user)
    draftCount.value = data.user.draftCount || 0
    materialCount.value = data.user.materialCount || 0
    return data
  }

  // 登出
  function logout() {
    localStorage.removeItem('bitte_token')
    isLoggedIn.value = false
    nickname.value = ''
    avatar.value = ''
    email.value = ''
    memberLevel.value = 'free'
    userId.value = null
    draftCount.value = 0
    materialCount.value = 0
    vipExpiresAt.value = null
  }

  function setUserData(user) {
    isLoggedIn.value = true
    userId.value = user.id
    nickname.value = user.nickname || '新用户'
    avatar.value = user.avatar || ''
    email.value = user.email || ''
    memberLevel.value = user.is_vip ? 'pro' : 'free'
    vipExpiresAt.value = user.vip_expires_at || null
    if (user.draftCount !== undefined) draftCount.value = user.draftCount
    if (user.materialCount !== undefined) materialCount.value = user.materialCount
  }

  // 获取所有活跃套餐
  async function fetchPlans() {
    const data = await api.get('/plans')
    return data.plans
  }

  // 创建订单
  async function createOrder(planId) {
    const data = await api.post('/orders/create', { plan_id: planId })
    return data.order
  }

  // 模拟支付
  async function payOrder(orderNo) {
    const data = await api.post(`/orders/${orderNo}/pay`)
    // 支付成功后刷新用户信息
    await fetchMe()
    return data
  }

  // 获取我的订单列表
  async function fetchMyOrders() {
    const data = await api.get('/orders/my')
    return data.orders
  }

  return {
    isLoggedIn,
    nickname,
    avatar,
    email,
    memberLevel,
    userId,
    draftCount,
    materialCount,
    vipExpiresAt,
    isVip,
    init,
    register,
    login,
    logout,
    fetchMe,
    fetchProfile,
    fetchPlans,
    createOrder,
    payOrder,
    fetchMyOrders,
  }
})
