<template>
  <div class="text-props-panel" :class="{ show: visible }" :style="positionStyle">
    <div class="text-prop-group">
      <span class="text-prop-label">大小</span>
      <input
        type="number"
        class="text-prop-input"
        :value="fontSize"
        min="8"
        max="200"
        @change="onFontSizeChange"
      >
    </div>
    <div class="text-prop-divider"></div>
    <div class="text-prop-group">
      <span class="text-prop-label">颜色</span>
      <input
        type="color"
        class="text-prop-color"
        :value="textColor"
        @input="onColorInput"
      >
    </div>
    <div class="text-prop-divider"></div>
    <div class="text-prop-group">
      <button
        class="text-prop-btn"
        :class="{ active: isBold }"
        title="加粗"
        @click="toggleBold"
      ><b>B</b></button>
      <button
        class="text-prop-btn"
        :class="{ active: isItalic }"
        title="斜体"
        @click="toggleItalic"
      ><i>I</i></button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const visible = ref(false)
const fontSize = ref(24)
const textColor = ref('#333333')
const isBold = ref(false)
const isItalic = ref(false)
const panelTop = ref(60)
const panelLeft = ref(200)

const emit = defineEmits(['change'])

const positionStyle = computed(() => ({
  left: panelLeft.value + 'px',
  top: panelTop.value + 'px',
}))

function show(obj) {
  fontSize.value = Math.round(obj.fontSize || 24)
  textColor.value = obj.fill || '#333333'
  isBold.value = obj.fontWeight === 'bold'
  isItalic.value = obj.fontStyle === 'italic'

  // 定位在顶部工具栏下方居中
  const toolbar = document.querySelector('.toolbar-top')
  if (toolbar) {
    const rect = toolbar.getBoundingClientRect()
    panelLeft.value = rect.left + rect.width / 2 - 140
    panelTop.value = rect.bottom + 8
  }
  visible.value = true
}

function hide() {
  visible.value = false
}

function onFontSizeChange(e) {
  let val = parseInt(e.target.value)
  if (val < 8) val = 8
  if (val > 200) val = 200
  fontSize.value = val
  emit('change', { prop: 'fontSize', value: val })
}

function onColorInput(e) {
  textColor.value = e.target.value
  emit('change', { prop: 'fill', value: e.target.value })
}

function toggleBold() {
  isBold.value = !isBold.value
  emit('change', { prop: 'fontWeight', value: isBold.value ? 'bold' : 'normal' })
}

function toggleItalic() {
  isItalic.value = !isItalic.value
  emit('change', { prop: 'fontStyle', value: isItalic.value ? 'italic' : 'normal' })
}

defineExpose({ show, hide })
</script>

<style scoped>
.text-props-panel {
  position: fixed;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06);
  padding: 10px 12px;
  z-index: 999;
  display: none;
  gap: 8px;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
}

.text-props-panel.show {
  display: flex;
}

.text-prop-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-prop-label {
  font-size: 11px;
  color: #999;
  margin-right: 2px;
}

.text-prop-input {
  width: 48px;
  height: 28px;
  border: 1.5px solid #e8e8e8;
  border-radius: 6px;
  text-align: center;
  font-size: 12px;
  color: #333;
  outline: none;
  transition: border-color 0.15s;
}

.text-prop-input:focus {
  border-color: #ff8fa3;
}

.text-prop-color {
  width: 28px;
  height: 28px;
  border: 1.5px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  background: none;
  overflow: hidden;
}

.text-prop-color::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.text-prop-color::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}

.text-prop-btn {
  width: 28px;
  height: 28px;
  border: 1.5px solid #e8e8e8;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  transition: all 0.15s;
}

.text-prop-btn:hover {
  border-color: #ff8fa3;
  color: #ff8fa3;
}

.text-prop-btn.active {
  background: #ff8fa3;
  border-color: #ff8fa3;
  color: #fff;
}

.text-prop-divider {
  width: 1px;
  height: 20px;
  background: #eee;
  margin: 0 4px;
}
</style>
