<template>
  <div class="page">
    <div class="page-header">
      <h2>订单管理</h2>
    </div>

    <div class="table-container">
      <div class="table-toolbar">
        <select v-model="statusFilter" class="filter-select" @change="fetchOrders(1)">
          <option value="">全部状态</option>
          <option value="pending">待支付</option>
          <option value="paid">已支付</option>
          <option value="cancelled">已取消</option>
          <option value="refunded">已退款</option>
        </select>
        <span class="text-muted">共 {{ pagination.total }} 条订单</span>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-icon">🧾</div>
        <p>暂无订单数据</p>
      </div>

      <table v-else>
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户昵称</th>
            <th>套餐名</th>
            <th>金额</th>
            <th>支付方式</th>
            <th>状态</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.order_no">
            <td class="text-mono">{{ o.order_no }}</td>
            <td>{{ o.user_nickname || '—' }}</td>
            <td>{{ o.plan_name || '—' }}</td>
            <td>¥{{ (o.amount / 100).toFixed(2) }}</td>
            <td class="text-muted">{{ o.pay_method || '—' }}</td>
            <td>
              <span class="badge" :class="'badge-' + o.status">
                {{ statusLabel(o.status) }}
              </span>
            </td>
            <td class="text-muted">{{ o.created_at }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button :disabled="pagination.page <= 1" @click="goPage(pagination.page - 1)">上一页</button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button :disabled="pagination.page >= pagination.totalPages" @click="goPage(pagination.page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../utils/api.js'

const orders = ref([])
const loading = ref(true)
const statusFilter = ref('')
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })

function statusLabel(status) {
  const map = { pending: '待支付', paid: '已支付', cancelled: '已取消', refunded: '已退款' }
  return map[status] || status
}

async function fetchOrders(page = 1) {
  loading.value = true
  try {
    let url = `/admin/orders?page=${page}&limit=20`
    if (statusFilter.value) url += `&status=${statusFilter.value}`

    const data = await get(url)
    orders.value = data.orders
    pagination.value = data.pagination
  } catch (err) {
    console.error('获取订单列表失败:', err)
  } finally {
    loading.value = false
  }
}

function goPage(page) {
  fetchOrders(page)
}

onMounted(() => fetchOrders())
</script>

<style scoped>
.filter-select {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: #fff;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.filter-select:focus {
  border-color: #667eea;
}

.text-mono {
  font-family: monospace;
  font-size: 12px;
}

.badge-paid {
  background: #e6f4ea;
  color: #188038;
}

.badge-pending {
  background: #fef7e0;
  color: #ea8600;
}

.badge-cancelled {
  background: #f0f0f0;
  color: #999;
}

.badge-refunded {
  background: #fce8e6;
  color: #c5221f;
}
</style>
