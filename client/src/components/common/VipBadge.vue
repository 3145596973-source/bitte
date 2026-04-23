<template>
  <span class="vip-badge" :class="{ 'is-vip': userStore.isVip }">
    {{ userStore.isVip ? '✨ VIP' : '🌸 免费版' }}
  </span>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style scoped>
.vip-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  background: #f5f5f5;
  color: #999;
  font-weight: 500;
  white-space: nowrap;
}

.vip-badge.is-vip {
  background: linear-gradient(135deg, #fff0f3, #ffe8cc);
  color: #e67e22;
  border: 1px solid #ffd6a5;
}
</style>
