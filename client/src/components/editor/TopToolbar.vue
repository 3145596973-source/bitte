<template>
  <div class="toolbar-top">
    <div class="toolbar-top-left">
      <img src="/logo.png" alt="Bitté" class="toolbar-logo">
      <button
        class="tb-btn"
        :class="{ disabled: canvasStore.undoStack.length <= 1 }"
        title="撤销"
        @click="handleUndo"
      >↩</button>
      <button
        class="tb-btn"
        :class="{ disabled: canvasStore.redoStack.length === 0 }"
        title="重做"
        @click="handleRedo"
      >↪</button>
      <button class="tb-btn" title="更多">⋯</button>

      <div class="ratio-group">
        <button
          v-for="r in ratios"
          :key="r"
          class="ratio-btn"
          :class="{ active: activeRatio === r && !canvasStore.customFixedSize }"
          @click="setRatio(r)"
        >{{ r }}</button>
        <button
          class="ratio-btn"
          :class="{ active: !!canvasStore.customFixedSize }"
          @click.stop="toggleCustomPopup"
        >自定义</button>
      </div>

      <div class="custom-size-popup" :class="{ show: showCustomPopup }" @click.stop>
        <div class="size-row">
          <input
            type="number"
            v-model.number="customW"
            placeholder="宽"
            min="100"
            max="4000"
          >
          <span class="size-x">×</span>
          <input
            type="number"
            v-model.number="customH"
            placeholder="高"
            min="100"
            max="4000"
          >
          <span class="size-unit">px</span>
          <button class="size-apply" @click="applyCustomSize">确定</button>
        </div>
      </div>
    </div>

    <div class="toolbar-top-right">
      <VipBadge />
      <button class="btn-save-draft" @click="emit('save-draft')">💾 保存草稿</button>
      <button class="btn-export" @click="emit('export')">{{ userStore.isVip ? '导出' : '导出(带水印)' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

const emit = defineEmits(['undo', 'redo', 'save-draft', 'export'])

const canvasStore = useCanvasStore()

const ratios = ['16:9', '3:4', '1:1', '9:16', '4:3']
const activeRatio = ref('1:1')
const showCustomPopup = ref(false)
const customW = ref(800)
const customH = ref(800)

function setRatio(ratioStr) {
  const parts = ratioStr.split(':')
  activeRatio.value = ratioStr
  canvasStore.setRatio([parseInt(parts[0]), parseInt(parts[1])])
  canvasStore.fabricCanvas?.setZoom(1)
}

function toggleCustomPopup() {
  showCustomPopup.value = !showCustomPopup.value
}

function applyCustomSize() {
  const w = customW.value
  const h = customH.value
  if (w >= 100 && h >= 100 && w <= 4000 && h <= 4000) {
    activeRatio.value = ''
    canvasStore.setCustomSize(w, h)
    showCustomPopup.value = false
  }
}

function handleUndo() {
  emit('undo')
}

function handleRedo() {
  emit('redo')
}

function onDocClick(e) {
  if (showCustomPopup.value) {
    showCustomPopup.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped>
.toolbar-top {
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  position: relative;
}

.toolbar-top-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-top-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-logo {
  height: 32px;
  border-radius: 6px;
  margin-right: 12px;
  vertical-align: middle;
}

.tb-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  transition: background 0.15s, color 0.15s;
}

.tb-btn:hover:not(.disabled) {
  background: #f5f5f5;
  color: #333;
}

.tb-btn:active:not(.disabled) {
  background: #eee;
}

.tb-btn.disabled {
  opacity: 0.35;
  cursor: default;
  pointer-events: none;
}

.ratio-group {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid #eee;
}

.ratio-btn {
  height: 30px;
  padding: 0 10px;
  border: 1.5px solid #e8e8e8;
  background: #fff;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.ratio-btn:hover {
  border-color: #ff8fa3;
  color: #ff8fa3;
}

.ratio-btn.active {
  background: #ff8fa3;
  border-color: #ff8fa3;
  color: #fff;
}

.custom-size-popup {
  display: none;
  position: absolute;
  top: 52px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 16px;
  z-index: 100;
  gap: 10px;
  flex-direction: column;
}

.custom-size-popup.show {
  display: flex;
}

.size-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-size-popup input {
  width: 72px;
  height: 32px;
  border: 1.5px solid #e8e8e8;
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  color: #333;
  outline: none;
  transition: border-color 0.15s;
}

.custom-size-popup input:focus {
  border-color: #ff8fa3;
}

.size-x {
  color: #999;
  font-size: 13px;
}

.size-unit {
  color: #999;
  font-size: 12px;
}

.size-apply {
  height: 32px;
  padding: 0 16px;
  border: none;
  background: #ff8fa3;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.size-apply:hover {
  background: #ff7a91;
}

.btn-export {
  height: 34px;
  padding: 0 20px;
  border: none;
  background: #ff8fa3;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  border-radius: 18px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.btn-export:hover {
  background: #ff7a91;
}

.btn-export:active {
  transform: scale(0.97);
}

.btn-save-draft {
  height: 34px;
  padding: 0 16px;
  border: 1.5px solid #ff8fa3;
  background: #fff;
  color: #ff8fa3;
  font-size: 13px;
  font-weight: 500;
  border-radius: 18px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s, color 0.15s;
}

.btn-save-draft:hover {
  background: #fff0f3;
}

.btn-save-draft:active {
  transform: scale(0.97);
}
</style>
