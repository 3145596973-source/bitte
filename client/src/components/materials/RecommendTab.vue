<template>
  <div>
    <div v-if="materialsStore.filteredRecommend.length === 0" class="no-results">
      没有找到相关素材
    </div>
    <div v-else class="masonry">
      <div
        v-for="(item, idx) in materialsStore.filteredRecommend"
        :key="idx"
        class="masonry-item"
        :class="{ 'is-locked': !userStore.isVip && item.is_free === 0 }"
        draggable="true"
        @dragstart="onDragStart($event, item)"
        @dragend="onDragEnd"
        @dblclick="handleClick(item)"
      >
        <div
          class="placeholder-img"
          :style="{ background: item.color, height: item.h + 'px' }"
        ></div>
        <!-- 付费素材锁定遮罩 -->
        <div v-if="!userStore.isVip && item.is_free === 0" class="lock-overlay">
          <span class="lock-icon">🔒</span>
        </div>
        <button
          class="masonry-add-btn"
          title="添加到我的素材"
          @click.stop.prevent="handleClick(item)"
        >＋</button>
      </div>
    </div>

    <!-- VIP 提示弹窗 -->
    <div v-if="showVipDialog" class="vip-dialog-overlay" @click.self="showVipDialog = false">
      <div class="vip-dialog">
        <p class="vip-dialog-text">该素材为 VIP 专属，开通会员即可使用</p>
        <div class="vip-dialog-actions">
          <button class="vip-dialog-cancel" @click="showVipDialog = false">取消</button>
          <button class="vip-dialog-go" @click="goToPricing">去开通</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMaterialsStore } from '@/stores/materials'
import { useUserStore } from '@/stores/user'

const materialsStore = useMaterialsStore()
const userStore = useUserStore()
const router = useRouter()
const emit = defineEmits(['add-to-canvas', 'toast'])

const showVipDialog = ref(false)

function handleClick(item) {
  if (!userStore.isVip && item.is_free === 0) {
    showVipDialog.value = true
    return
  }
  addToMyMaterials(item)
}

function goToPricing() {
  showVipDialog.value = false
  router.push('/pricing')
}

function addToMyMaterials(item) {
  // 创建一个 canvas 生成色块 dataUrl
  const tmpC = document.createElement('canvas')
  tmpC.width = 200
  tmpC.height = item.h
  const ctx = tmpC.getContext('2d')
  ctx.fillStyle = item.color
  const r = 12
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(200 - r, 0)
  ctx.quadraticCurveTo(200, 0, 200, r)
  ctx.lineTo(200, item.h - r)
  ctx.quadraticCurveTo(200, item.h, 200 - r, item.h)
  ctx.lineTo(r, item.h)
  ctx.quadraticCurveTo(0, item.h, 0, item.h - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.fill()
  const dataUrl = tmpC.toDataURL('image/png')
  materialsStore.addToMyMaterials(dataUrl, item.name)
  emit('toast', '已添加到我的素材')
}

function onDragStart(e, item) {
  e.dataTransfer.setData('text/plain', JSON.stringify({
    source: 'material',
    color: item.color,
    name: item.name,
    width: 120,
    height: Math.round(item.h * 0.6),
  }))
  e.dataTransfer.effectAllowed = 'copy'
}

function onDragEnd() {
  // no-op
}
</script>

<style scoped>
.masonry {
  column-count: 2;
  column-gap: 10px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 10px;
  border-radius: 10px;
  overflow: visible;
  cursor: grab;
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative;
}

.masonry-item:hover {
  transform: scale(1.03) translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.placeholder-img {
  width: 100%;
  display: block;
  border-radius: 10px;
}

.masonry-add-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #ff8fa3;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s, transform 0.15s;
  z-index: 5;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
  line-height: 1;
}

.masonry-item:hover .masonry-add-btn {
  opacity: 1;
}

.masonry-add-btn:hover {
  background: #ff8fa3;
  color: #fff;
  transform: scale(1.1);
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #bbb;
  font-size: 13px;
}

/* 付费素材锁定 */
.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 10px;
  z-index: 4;
  pointer-events: none;
}

.lock-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 18px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.masonry-item.is-locked {
  cursor: pointer;
}

/* VIP 提示弹窗 */
.vip-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vip-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 320px;
  width: 90%;
}

.vip-dialog-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.5;
}

.vip-dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.vip-dialog-cancel {
  height: 36px;
  padding: 0 20px;
  border: 1.5px solid #eee;
  background: #fff;
  color: #999;
  font-size: 13px;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.15s;
}

.vip-dialog-cancel:hover {
  border-color: #ddd;
  color: #666;
}

.vip-dialog-go {
  height: 36px;
  padding: 0 20px;
  border: none;
  background: #ff8fa3;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  border-radius: 18px;
  cursor: pointer;
  transition: background 0.15s;
}

.vip-dialog-go:hover {
  background: #ff7a91;
}
</style>
