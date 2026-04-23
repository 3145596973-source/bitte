<template>
  <aside class="panel-right">
    <div class="search-bar">
      <input
        class="search-input"
        type="text"
        placeholder="搜索素材…"
        v-model="materialsStore.searchKeyword"
        @input="onSearch"
      >
    </div>

    <div class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: materialsStore.currentTab === tab.key }"
        @click="switchTab(tab.key)"
      >{{ tab.label }}</div>
    </div>

    <div class="material-grid">
      <RecommendTab
        v-show="materialsStore.currentTab === 'recommend'"
        @add-to-canvas="item => emit('add-material', item)"
        @toast="msg => emit('toast', msg)"
      />
      <MyMaterialTab
        v-show="materialsStore.currentTab === 'mine'"
        @add-image="data => emit('add-image', data)"
        @toast="msg => emit('toast', msg)"
        @confirm="data => emit('confirm', data)"
      />
      <DraftTab
        v-show="materialsStore.currentTab === 'drafts'"
        @load-draft="draft => emit('load-draft', draft)"
        @toast="msg => emit('toast', msg)"
        @confirm="data => emit('confirm', data)"
      />
      <GalleryTab
        v-show="materialsStore.currentTab === 'gallery'"
        @toast="msg => emit('toast', msg)"
      />
    </div>
  </aside>
</template>

<script setup>
import { useMaterialsStore } from '@/stores/materials'
import RecommendTab from './RecommendTab.vue'
import MyMaterialTab from './MyMaterialTab.vue'
import DraftTab from './DraftTab.vue'
import GalleryTab from './GalleryTab.vue'

const materialsStore = useMaterialsStore()
const emit = defineEmits(['add-material', 'add-image', 'load-draft', 'toast', 'confirm'])

const tabs = [
  { key: 'recommend', label: '推荐素材' },
  { key: 'mine', label: '我的素材' },
  { key: 'drafts', label: '草稿箱' },
  { key: 'gallery', label: '案例库' },
]

function switchTab(key) {
  materialsStore.currentTab = key
  if (key === 'mine') materialsStore.loadMyMaterials()
  if (key === 'drafts') materialsStore.loadDrafts()
  if (key === 'gallery') materialsStore.loadGallery()
}

function onSearch() {
  // 搜索时自动切到推荐素材 tab
  if (materialsStore.currentTab !== 'recommend') {
    materialsStore.currentTab = 'recommend'
  }
}
</script>

<style scoped>
.panel-right {
  width: 300px;
  min-width: 300px;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.search-bar {
  padding: 14px 14px 10px;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  height: 38px;
  border: 1.5px solid #eee;
  border-radius: 20px;
  padding: 0 14px 0 36px;
  font-size: 13px;
  outline: none;
  background: #f9f9f9 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23bbb' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242.156a5 5 0 1 1 0-10 5 5 0 0 1 0 10z'/%3E%3C/svg%3E") no-repeat 12px center;
  transition: border-color 0.2s, background-color 0.2s;
}

.search-input::placeholder {
  color: #bbb;
}

.search-input:focus {
  border-color: #ff8fa3;
  background-color: #fff;
}

.tabs {
  display: flex;
  padding: 0 10px;
  gap: 0;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 10px 0 9px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  user-select: none;
  white-space: nowrap;
}

.tab:hover {
  color: #666;
}

.tab.active {
  color: #ff8fa3;
  border-bottom-color: #ff8fa3;
  font-weight: 500;
}

.material-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  position: relative;
}
</style>
