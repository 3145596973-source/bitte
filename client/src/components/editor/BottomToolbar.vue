<template>
  <div class="toolbar-bottom">
    <button class="tool-btn" title="添加文字" @click="emit('add-text')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="4 7 4 4 20 4 20 7"/>
        <line x1="9.5" y1="4" x2="9.5" y2="20"/>
        <line x1="14.5" y1="4" x2="14.5" y2="20"/>
        <line x1="7" y1="20" x2="17" y2="20"/>
      </svg>
    </button>
    <button
      class="tool-btn"
      :class="{ 'active-tool': canvasStore.brushMode }"
      title="画笔"
      @click="toggleBrush"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>
    </button>
    <button class="tool-btn" title="上传图片" @click="triggerUpload">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      style="display:none"
      @change="handleFileChange"
    >
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

const emit = defineEmits(['add-text', 'upload-image'])

const canvasStore = useCanvasStore()
const fileInput = ref(null)

function toggleBrush() {
  if (canvasStore.brushMode) {
    canvasStore.exitBrushMode()
  } else {
    canvasStore.enterBrushMode()
  }
}

function triggerUpload() {
  canvasStore.exitBrushMode()
  fileInput.value.click()
}

function handleFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const dataUrl = ev.target.result
    const name = file.name.replace(/\.[^.]+$/, '')
    emit('upload-image', { dataUrl, name })
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}
</script>

<style scoped>
.toolbar-bottom {
  height: 56px;
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}

.tool-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: #f8f8f8;
  border-radius: 12px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  transition: background 0.15s, color 0.15s, transform 0.1s;
}

.tool-btn:hover {
  background: #fff0f3;
  color: #ff8fa3;
}

.tool-btn:active {
  transform: scale(0.93);
}

.tool-btn.active-tool {
  background: #ff8fa3;
  color: #fff;
}

.tool-btn.active-tool:hover {
  background: #ff7a91;
  color: #fff;
}
</style>
