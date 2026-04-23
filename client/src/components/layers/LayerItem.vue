<template>
  <div
    class="layer-item"
    :class="{
      active: layer.isActive,
      'layer-hidden': layer.isHidden,
      'layer-dragging': isDragging,
      'drag-over-top': dragOverPosition === 'top',
      'drag-over-bottom': dragOverPosition === 'bottom',
    }"
    :data-canvas-index="layer.canvasIndex"
    :draggable="draggable"
    @click="onClick"
    @dragstart="onDragStart"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @dragend="onDragEnd"
  >
    <span
      class="layer-drag"
      title="拖拽排序"
      @mousedown="enableDrag"
    >≡</span>
    <div class="layer-thumb" :style="layer.thumbStyle"></div>
    <div class="layer-info">
      <div class="layer-name">{{ layer.name }}</div>
      <div class="layer-type">{{ layer.typeStr }}</div>
    </div>
    <span class="layer-more" title="更多" @click.stop="onMore">⋯</span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  layer: { type: Object, required: true },
})

const emit = defineEmits(['select', 'more', 'drag-start', 'drag-over', 'drag-leave', 'drop', 'drag-end'])

const draggable = ref(false)
const isDragging = ref(false)
const dragOverPosition = ref(null)

function enableDrag() {
  draggable.value = true
}

function onClick(e) {
  if (e.target.closest('.layer-more') || e.target.closest('.layer-drag')) return
  emit('select', props.layer.canvasIndex)
}

function onMore(e) {
  emit('more', { event: e, canvasIndex: props.layer.canvasIndex })
}

function onDragStart(e) {
  if (!draggable.value) {
    e.preventDefault()
    return
  }
  isDragging.value = true
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', 'layer-reorder')
  emit('drag-start', props.layer.canvasIndex)
}

function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  const rect = e.currentTarget.getBoundingClientRect()
  const midY = rect.top + rect.height / 2
  dragOverPosition.value = e.clientY < midY ? 'top' : 'bottom'
  emit('drag-over', {
    canvasIndex: props.layer.canvasIndex,
    insertBefore: e.clientY < midY,
  })
}

function onDragLeave() {
  dragOverPosition.value = null
  emit('drag-leave')
}

function onDrop(e) {
  e.preventDefault()
  dragOverPosition.value = null
  emit('drop')
}

function onDragEnd() {
  draggable.value = false
  isDragging.value = false
  dragOverPosition.value = null
  emit('drag-end')
}
</script>

<style scoped>
.layer-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
  user-select: none;
  border-left: 3px solid transparent;
  position: relative;
}

.layer-item:hover {
  background: #fef0f2;
}

.layer-item.active {
  background: #fff0f3;
  border-left-color: #ff8fa3;
}

.layer-item.layer-dragging {
  opacity: 0.4;
  background: #fff0f3;
}

.layer-item.layer-hidden {
  opacity: 0.5;
}

.layer-item.layer-hidden .layer-name {
  color: #bbb;
}

.layer-item.layer-hidden .layer-thumb {
  opacity: 0.4;
}

.layer-item.drag-over-top::before {
  content: '';
  position: absolute;
  top: -1.5px;
  left: 0;
  right: 0;
  height: 3px;
  background: #ff8fa3;
  border-radius: 2px;
  z-index: 10;
}

.layer-item.drag-over-bottom::after {
  content: '';
  position: absolute;
  bottom: -1.5px;
  left: 0;
  right: 0;
  height: 3px;
  background: #ff8fa3;
  border-radius: 2px;
  z-index: 10;
}

.layer-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  flex-shrink: 0;
}

.layer-info {
  flex: 1;
  min-width: 0;
}

.layer-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layer-type {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.layer-drag {
  color: #ccc;
  font-size: 16px;
  cursor: grab;
  padding: 2px 4px;
  letter-spacing: -1px;
}

.layer-drag:hover {
  color: #999;
}

.layer-more {
  color: #ccc;
  font-size: 18px;
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
}

.layer-more:hover {
  color: #999;
}
</style>
