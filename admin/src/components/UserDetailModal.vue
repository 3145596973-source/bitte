<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>用户详情</h3>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="user">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
            <div class="avatar-sm" style="width: 56px; height: 56px; font-size: 22px;">
              {{ user.nickname?.charAt(0) || '?' }}
            </div>
            <div>
              <div style="font-size: 18px; font-weight: 600;">{{ user.nickname }}</div>
              <div class="text-muted">{{ user.email }}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="stat-card" style="box-shadow: none; border: 1px solid #f0f0f0;">
              <div class="stat-info">
                <div class="stat-number" style="font-size: 22px;">{{ user.materialCount }}</div>
                <div class="stat-label">素材数量</div>
              </div>
            </div>
            <div class="stat-card" style="box-shadow: none; border: 1px solid #f0f0f0;">
              <div class="stat-info">
                <div class="stat-number" style="font-size: 22px;">{{ user.draftCount }}</div>
                <div class="stat-label">草稿数量</div>
              </div>
            </div>
          </div>

          <div style="margin-top: 20px; font-size: 13px; color: #888;">
            <p><strong style="color: #555;">VIP 状态：</strong>
              <span :class="user.is_vip ? 'badge badge-vip' : 'badge'">{{ user.is_vip ? 'VIP' : '普通用户' }}</span>
            </p>
            <p style="margin-top: 8px;"><strong style="color: #555;">封禁状态：</strong>
              <span :class="user.is_banned ? 'badge badge-banned' : 'badge badge-active'">{{ user.is_banned ? '已封禁' : '正常' }}</span>
            </p>
            <p style="margin-top: 8px;"><strong style="color: #555;">注册时间：</strong> {{ user.created_at }}</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../utils/api.js'

const props = defineProps({
  userId: { type: Number, required: true },
})

defineEmits(['close'])

const user = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await get(`/admin/users/${props.userId}`)
    user.value = data.user
  } catch (err) {
    console.error('获取用户详情失败:', err)
  } finally {
    loading.value = false
  }
})
</script>
