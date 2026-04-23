<template>
  <div class="page">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <div class="table-container">
      <div class="table-toolbar">
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="搜索用户昵称或邮箱..."
          @input="onSearch"
        />
        <span class="text-muted">共 {{ pagination.total }} 位用户</span>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="users.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <p>暂无用户数据</p>
      </div>

      <table v-else>
        <thead>
          <tr>
            <th>头像</th>
            <th>昵称</th>
            <th>邮箱</th>
            <th>VIP</th>
            <th>状态</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>
              <div class="avatar-sm">{{ u.nickname?.charAt(0) || '?' }}</div>
            </td>
            <td>{{ u.nickname }}</td>
            <td class="text-muted">{{ u.email }}</td>
            <td>
              <span v-if="u.is_vip" class="badge badge-vip">VIP</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <span :class="u.is_banned ? 'badge badge-banned' : 'badge badge-active'">
                {{ u.is_banned ? '已封禁' : '正常' }}
              </span>
            </td>
            <td class="text-muted">{{ u.created_at }}</td>
            <td>
              <div class="actions">
                <button class="btn btn-outline btn-sm" @click="showDetail(u)">详情</button>
                <button
                  class="btn btn-sm"
                  :class="u.is_banned ? 'btn-success' : 'btn-danger'"
                  @click="confirmBan(u)"
                >
                  {{ u.is_banned ? '解封' : '封禁' }}
                </button>
                <button
                  class="btn btn-sm"
                  :class="u.is_vip ? 'btn-outline' : 'btn-warn'"
                  @click="toggleVip(u)"
                >
                  {{ u.is_vip ? '取消VIP' : '设为VIP' }}
                </button>
              </div>
            </td>
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

    <!-- 用户详情弹窗 -->
    <UserDetailModal
      v-if="detailUserId"
      :userId="detailUserId"
      @close="detailUserId = null"
    />

    <!-- 封禁确认 -->
    <div v-if="banningUser" class="confirm-overlay" @click.self="banningUser = null">
      <div class="confirm-box">
        <p>
          确定要{{ banningUser.is_banned ? '解封' : '封禁' }}用户
          「{{ banningUser.nickname }}」吗？
        </p>
        <div class="confirm-actions">
          <button class="btn btn-outline" @click="banningUser = null">取消</button>
          <button
            class="btn"
            :class="banningUser.is_banned ? 'btn-success' : 'btn-danger'"
            @click="doBan"
          >
            确定{{ banningUser.is_banned ? '解封' : '封禁' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, put } from '../utils/api.js'
import UserDetailModal from '../components/UserDetailModal.vue'

const users = ref([])
const loading = ref(true)
const searchQuery = ref('')
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })

const detailUserId = ref(null)
const banningUser = ref(null)

let searchTimer = null

async function fetchUsers(page = 1) {
  loading.value = true
  try {
    const q = searchQuery.value.trim()
    let url = `/admin/users?page=${page}&limit=20`
    if (q) url += `&q=${encodeURIComponent(q)}`

    const data = await get(url)
    users.value = data.users
    pagination.value = data.pagination
  } catch (err) {
    console.error('获取用户列表失败:', err)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchUsers(1), 300)
}

function goPage(page) {
  fetchUsers(page)
}

function showDetail(u) {
  detailUserId.value = u.id
}

function confirmBan(u) {
  banningUser.value = u
}

async function doBan() {
  try {
    const data = await put(`/admin/users/${banningUser.value.id}/ban`)
    // 更新列表中的用户状态
    const idx = users.value.findIndex((u) => u.id === banningUser.value.id)
    if (idx !== -1) {
      users.value[idx] = data.user
    }
    banningUser.value = null
  } catch (err) {
    console.error('操作失败:', err)
  }
}

async function toggleVip(u) {
  try {
    const data = await put(`/admin/users/${u.id}/vip`)
    const idx = users.value.findIndex((item) => item.id === u.id)
    if (idx !== -1) {
      users.value[idx] = data.user
    }
  } catch (err) {
    console.error('操作失败:', err)
  }
}

onMounted(() => fetchUsers())
</script>
