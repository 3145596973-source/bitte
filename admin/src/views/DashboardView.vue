<template>
  <div class="page">
    <div class="page-header">
      <h2>仪表盘</h2>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e8f0fe; color: #1967d2;">👥</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #e6f4ea; color: #188038;">📈</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.todayUsers }}</div>
          <div class="stat-label">今日新增</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fef7e0; color: #ea8600;">⭐</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.vipUsers }}</div>
          <div class="stat-label">VIP 用户</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fce8e6; color: #c5221f;">🎨</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalRecommended }}</div>
          <div class="stat-label">推荐素材</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f3e8fd; color: #8430ce;">📦</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalMaterials }}</div>
          <div class="stat-label">用户素材总量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #e0f7fa; color: #00838f;">📝</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalDrafts }}</div>
          <div class="stat-label">草稿总量</div>
        </div>
      </div>
    </div>

    <!-- 收入统计 -->
    <div v-if="!loading" class="stat-cards" style="margin-top: 24px;">
      <div class="stat-card">
        <div class="stat-icon" style="background: #fff8e1; color: #f9a825;">💰</div>
        <div class="stat-info">
          <div class="stat-number">{{ formatYuan(revenue.todayRevenue) }}</div>
          <div class="stat-label">今日收入</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #e8f5e9; color: #2e7d32;">📊</div>
        <div class="stat-info">
          <div class="stat-number">{{ formatYuan(revenue.monthRevenue) }}</div>
          <div class="stat-label">本月收入</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #ede7f6; color: #6a1b9a;">💎</div>
        <div class="stat-info">
          <div class="stat-number">{{ formatYuan(revenue.totalRevenue) }}</div>
          <div class="stat-label">总收入</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fce4ec; color: #c62828;">🧾</div>
        <div class="stat-info">
          <div class="stat-number">{{ revenue.paidOrders }}</div>
          <div class="stat-label">付费订单</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../utils/api.js'

const loading = ref(true)
const stats = ref({
  totalUsers: 0,
  todayUsers: 0,
  vipUsers: 0,
  totalMaterials: 0,
  totalDrafts: 0,
  totalRecommended: 0,
})
const revenue = ref({
  todayRevenue: 0,
  monthRevenue: 0,
  totalRevenue: 0,
  paidOrders: 0,
})

function formatYuan(fen) {
  return '¥' + (fen / 100).toFixed(2)
}

onMounted(async () => {
  try {
    const [statsData, revenueData] = await Promise.all([
      get('/admin/stats'),
      get('/admin/revenue'),
    ])
    stats.value = statsData
    revenue.value = revenueData
  } catch (err) {
    console.error('获取统计数据失败:', err)
  } finally {
    loading.value = false
  }
})
</script>
