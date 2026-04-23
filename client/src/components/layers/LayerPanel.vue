<template>
  <aside class="panel-left">
    <div class="panel-left-header">
      <span class="icon">🗂</span> 图层
    </div>
    <div class="layer-list">
      <LayerItem
        v-for="layer in layersStore.layers"
        :key="layer.canvasIndex"
        :layer="layer"
        @select="onSelect"
        @more="onMore"
        @drag-start="onDragStart"
        @drag-over="onDragOver"
        @drag-leave="onDragLeave"
        @drop="onDrop"
        @drag-end="onDragEnd"
      />
    </div>

    <!-- 图层更多菜单 -->
    <div
      class="layer-context-menu"
      :class="{ show: menuVisible }"
      :style="{ left: menuX + 'px', top: menuY + 'px' }"
      @click.stop
    >
      <div class="layer-ctx-item" @click="toggleVisibility">
        <span class="lctx-icon">{{ isMenuTargetHidden ? '👁' : '🙈' }}</span>
        <span class="lctx-label">{{ isMenuTargetHidden ? '显示' : '隐藏' }}</span>
      </div>
      <div class="layer-ctx-divider"></div>
      <div class="layer-ctx-item" @click="bringToFront">
        <span class="lctx-icon">⬆️</span>置顶
      </div>
      <div class="layer-ctx-item" @click="sendToBack">
        <span class="lctx-icon">⬇️</span>置底
      </div>
      <div class="layer-ctx-divider"></div>
      <div class="layer-ctx-item" @click="deleteLayer">
        <span class="lctx-icon">🗑</span>删除
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useLayersStore } from '@/stores/layers'
import LayerItem from './LayerItem.vue'

const layersStore = useLayersStore()

const emit = defineEmits([
  'select-object',
  'toggle-visibility',
  'bring-to-front',
  'send-to-back',
  'delete-object',
  'reorder',
])

// 更多菜单
const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuTargetIndex = ref(-1)

const isMenuTargetHidden = computed(() => {
  const layer = layersStore.layers.find(l => l.canvasIndex === menuTargetIndex.value)
  return layer ? layer.isHidden : false
})

function onSelect(canvasIndex) {
  emit('select-object', canvasIndex)
}

function onMore({ event, canvasIndex }) {
  menuTargetIndex.value = canvasIndex
  menuX.value = event.clientX
  menuY.value = event.clientY
  menuVisible.value = true

  requestAnimationFrame(() => {
    const el = document.querySelector('.layer-context-menu.show')
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.right > window.innerWidth) menuX.value = event.clientX - rect.width
    if (rect.bottom > window.innerHeight) menuY.value = event.clientY - rect.height
  })
}

function hideMenu() {
  menuVisible.value = false
  menuTargetIndex.value = -1
}

function toggleVisibility() {
  emit('toggle-visibility', menuTargetIndex.value)
  hideMenu()
}

function bringToFront() {
  emit('bring-to-front', menuTargetIndex.value)
  hideMenu()
}

function sendToBack() {
  emit('send-to-back', menuTargetIndex.value)
  hideMenu()
}

function deleteLayer() {
  emit('delete-object', menuTargetIndex.value)
  hideMenu()
}

// 拖拽排序状态
const dragState = {
  dragging: false,
  draggedIndex: -1,
  overIndex: -1,
  insertBefore: true,
}

function onDragStart(canvasIndex) {
  dragState.dragging = true
  dragState.draggedIndex = canvasIndex
}

function onDragOver({ canvasIndex, insertBefore }) {
  if (!dragState.dragging) return
  dragState.overIndex = canvasIndex
  dragState.insertBefore = insertBefore
}

function onDragLeave() {
  // handled by LayerItem
}

function onDrop() {
  if (!dragState.dragging) return
  const fromIdx = dragState.draggedIndex
  const overIdx = dragState.overIndex
  if (fromIdx === overIdx) return

  let targetIdx = dragState.insertBefore ? overIdx + 1 : overIdx
  if (fromIdx < targetIdx) targetIdx -= 1
  const maxIdx = layersStore.layers.length - 1
  targetIdx = Math.max(0, Math.min(targetIdx, maxIdx))
  if (targetIdx !== fromIdx) {
    emit('reorder', { from: fromIdx, to: targetIdx })
  }
  resetDragState()
}

function onDragEnd() {
  resetDragState()
}

function resetDragState() {
  dragState.dragging = false
  dragState.draggedIndex = -1
  dragState.overIndex = -1
}

function onDocClick(e) {
  if (menuVisible.value) {
    const menu = document.querySelector('.layer-context-menu')
    if (menu && !menu.contains(e.target)) hideMenu()
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
.panel-left {
  width: 240px;
  min-width: 240px;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.panel-left-header {
  padding: 18px 16px 12px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-left-header .icon {
  font-size: 18px;
}

.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* 图层更多菜单 */
.layer-context-menu {
  position: fixed;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06);
  padding: 5px 0;
  z-index: 1001;
  display: none;
  min-width: 140px;
  overflow: hidden;
}

.layer-context-menu.show {
  display: block;
}

.layer-ctx-item {
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  transition: background 0.12s;
  user-select: none;
}

.layer-ctx-item:hover {
  background: #fff0f3;
  color: #ff6b81;
}

.lctx-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.layer-ctx-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 3px 0;
}
</style>
