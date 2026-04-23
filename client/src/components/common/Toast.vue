<template>
  <div class="toast" :class="{ show: visible }">{{ message }}</div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
let timer = null

function show(msg, duration = 2000) {
  message.value = msg
  visible.value = true
  clearTimeout(timer)
  timer = setTimeout(() => {
    visible.value = false
  }, duration)
}

defineExpose({ show })
</script>

<style scoped>
.toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%) translateY(-60px);
  background: #ff8fa3;
  color: #fff;
  padding: 10px 24px;
  border-radius: 22px;
  font-size: 13px;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.3s, transform 0.3s;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(255, 143, 163, 0.3);
  white-space: nowrap;
}

.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
