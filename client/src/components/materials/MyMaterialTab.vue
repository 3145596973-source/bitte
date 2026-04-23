<template>
  <div>
    <!-- 空状态 -->
    <div v-if="materialsStore.myMaterials.length === 0" class="empty-hint">
      <span class="empty-icon">📷</span>
      还没有素材哦，上传一张试试？
    </div>

    <template v-else>
      <!-- 全选 -->
      <div class="my-material-header">
        <label>
          <input
            type="checkbox"
            :checked="isAllSelected"
            @change="onSelectAll"
          >
          全选
        </label>
      </div>

      <!-- 素材网格 -->
      <div class="my-material-grid">
        <div
          v-for="(item, idx) in materialsStore.myMaterials"
          :key="idx"
          class="my-material-item"
          draggable="true"
          @dragstart="onDragStart($event, item)"
          @dblclick="emit('add-image', { dataUrl: item.dataUrl, name: item.name })"
        >
          <input
            type="checkbox"
            class="my-mat-check"
            :checked="materialsStore.myMatSelected.has(idx)"
            @change.stop="materialsStore.toggleSelectMaterial(idx)"
          >
          <img :src="item.dataUrl" :alt="item.name">
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="my-material-actions" :class="{ show: materialsStore.myMatSelected.size > 0 }">
        <button class="my-mat-action-btn" @click="onCutout">✨ 智能抠图</button>
        <button class="my-mat-action-btn danger" @click="onDelete">🗑 删除</button>
      </div>
    </template>

    <!-- 抠图 loading -->
    <div class="cutout-overlay" :class="{ show: cutoutLoading }">
      <div class="cutout-spinner"></div>
      <div class="cutout-text">智能抠图中…</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMaterialsStore } from '@/stores/materials'

const materialsStore = useMaterialsStore()
const emit = defineEmits(['add-image', 'toast', 'confirm'])

const cutoutLoading = ref(false)

const isAllSelected = computed(() => {
  return materialsStore.myMaterials.length > 0 &&
    materialsStore.myMatSelected.size === materialsStore.myMaterials.length
})

function onSelectAll(e) {
  materialsStore.selectAllMaterials(e.target.checked)
}

function onDragStart(e, item) {
  e.dataTransfer.setData('text/plain', JSON.stringify({
    source: 'my-material',
    dataUrl: item.dataUrl,
    name: item.name,
  }))
  e.dataTransfer.effectAllowed = 'copy'
}

async function onDelete() {
  if (materialsStore.myMatSelected.size === 0) return
  const ok = await new Promise(resolve => {
    emit('confirm', {
      message: `确定删除 ${materialsStore.myMatSelected.size} 个素材？`,
      resolve,
    })
  })
  if (!ok) return
  materialsStore.deleteSelectedMaterials()
  emit('toast', '已删除')
}

async function onCutout() {
  if (materialsStore.myMatSelected.size === 0) return
  cutoutLoading.value = true
  await materialsStore.applyCutout()
  cutoutLoading.value = false
  emit('toast', '抠图完成 ✨')
}
</script>

<style scoped>
.empty-hint {
  text-align: center;
  padding: 40px 20px;
  color: #bbb;
  font-size: 13px;
  line-height: 1.8;
}

.empty-hint .empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
  display: block;
  opacity: 0.5;
}

.my-material-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  padding: 2px 0;
}

.my-material-header label {
  font-size: 12px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.my-material-header input[type="checkbox"] {
  accent-color: #ff8fa3;
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.my-material-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.my-material-item {
  border-radius: 10px;
  overflow: visible;
  cursor: grab;
  transition: transform 0.15s, box-shadow 0.15s;
  aspect-ratio: 1;
  position: relative;
}

.my-material-item:hover {
  transform: scale(1.03) translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.my-material-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}

.my-mat-check {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 18px;
  height: 18px;
  accent-color: #ff8fa3;
  cursor: pointer;
  z-index: 5;
}

.my-material-actions {
  display: none;
  gap: 8px;
  padding: 10px 0 4px;
  justify-content: center;
}

.my-material-actions.show {
  display: flex;
}

.my-mat-action-btn {
  height: 30px;
  padding: 0 14px;
  border: 1.5px solid #e8e8e8;
  background: #fff;
  color: #555;
  font-size: 12px;
  font-weight: 500;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.my-mat-action-btn:hover {
  border-color: #ff8fa3;
  color: #ff8fa3;
}

.my-mat-action-btn.danger:hover {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.cutout-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 10000;
  display: none;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
}

.cutout-overlay.show {
  display: flex;
}

.cutout-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ff8fa3;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.cutout-text {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}
</style>
