<template>
  <div class="confirm-overlay" :class="{ show: visible }">
    <div class="confirm-dialog">
      <div class="confirm-dialog-msg">{{ message }}</div>
      <div class="confirm-dialog-btns">
        <button class="confirm-btn confirm-btn-cancel" @click="cancel">取消</button>
        <button class="confirm-btn confirm-btn-ok" @click="confirm">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
let resolvePromise = null

function show(msg) {
  return new Promise((resolve) => {
    message.value = msg
    visible.value = true
    resolvePromise = resolve
  })
}

function confirm() {
  visible.value = false
  if (resolvePromise) resolvePromise(true)
}

function cancel() {
  visible.value = false
  if (resolvePromise) resolvePromise(false)
}

defineExpose({ show })
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 10000;
  display: none;
  align-items: center;
  justify-content: center;
}

.confirm-overlay.show {
  display: flex;
}

.confirm-dialog {
  background: #fff;
  border-radius: 14px;
  padding: 24px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  text-align: center;
  min-width: 240px;
  max-width: 300px;
}

.confirm-dialog-msg {
  font-size: 14px;
  color: #333;
  margin-bottom: 18px;
  line-height: 1.5;
}

.confirm-dialog-btns {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.confirm-btn {
  height: 32px;
  padding: 0 20px;
  border: none;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.confirm-btn:active {
  transform: scale(0.97);
}

.confirm-btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.confirm-btn-cancel:hover {
  background: #e8e8e8;
}

.confirm-btn-ok {
  background: #ff8fa3;
  color: #fff;
}

.confirm-btn-ok:hover {
  background: #ff7a91;
}
</style>
