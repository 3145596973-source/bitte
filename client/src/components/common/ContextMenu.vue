<template>
  <div
    class="context-menu"
    :class="{ show: visible }"
    :style="{ left: x + 'px', top: y + 'px' }"
    @click.stop
  >
    <template v-for="(item, idx) in items" :key="idx">
      <div v-if="item.divider" class="ctx-divider"></div>
      <div v-else class="ctx-item" @click="handleClick(item)">
        <span class="ctx-icon">{{ item.icon }}</span>
        {{ item.label }}
        <span v-if="item.shortcut" class="ctx-shortcut">{{ item.shortcut }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
})

const emit = defineEmits(['action', 'hide'])

const visible = ref(false)
const x = ref(0)
const y = ref(0)

function show(clientX, clientY) {
  x.value = clientX
  y.value = clientY
  visible.value = true

  requestAnimationFrame(() => {
    // 边界检测
    const el = document.querySelector('.context-menu.show')
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.right > window.innerWidth) x.value = clientX - rect.width
    if (rect.bottom > window.innerHeight) y.value = clientY - rect.height
  })
}

function hide() {
  visible.value = false
  emit('hide')
}

function handleClick(item) {
  emit('action', item.action)
  hide()
}

function onDocClick() {
  if (visible.value) hide()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})

defineExpose({ show, hide })
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 6px 0;
  z-index: 1000;
  display: none;
  min-width: 160px;
  overflow: hidden;
}

.context-menu.show {
  display: block;
}

.ctx-item {
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
  transition: background 0.12s;
  user-select: none;
}

.ctx-item:hover {
  background: #fff0f3;
  color: #ff6b81;
}

.ctx-icon {
  font-size: 15px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.ctx-shortcut {
  margin-left: auto;
  font-size: 11px;
  color: #bbb;
}

.ctx-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}
</style>
