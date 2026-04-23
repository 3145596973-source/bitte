<template>
  <div class="app">
    <!-- 左侧图层面板 -->
    <LayerPanel
      @select-object="onSelectObject"
      @toggle-visibility="onToggleVisibility"
      @bring-to-front="onBringToFront"
      @send-to-back="onSendToBack"
      @delete-object="onDeleteObject"
      @reorder="onReorder"
    />

    <!-- 中间画布区 -->
    <main class="panel-center">
      <TopToolbar
        @undo="onUndo"
        @redo="onRedo"
        @save-draft="onSaveDraft"
        @export="onExport"
      />

      <CanvasArea
        ref="canvasArea"
        @context-menu="onCanvasContextMenu"
        @selection-change="onSelectionChange"
      />

      <BottomToolbar
        @add-text="onAddText"
        @upload-image="onUploadImage"
      />

      <TextFormatBar
        ref="textFormatBar"
        @change="onTextPropChange"
      />
    </main>

    <!-- 右侧素材面板 -->
    <MaterialPanel
      @add-material="onAddMaterial"
      @add-image="onAddImage"
      @load-draft="onLoadDraft"
      @toast="showToast"
      @confirm="onConfirm"
    />

    <!-- 右键菜单 -->
    <ContextMenu
      ref="contextMenu"
      :items="contextMenuItems"
      @action="onContextAction"
    />

    <!-- Toast 通知 -->
    <Toast ref="toast" />

    <!-- 确认弹窗 -->
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useMaterialsStore } from '@/stores/materials'

import LayerPanel from '@/components/layers/LayerPanel.vue'
import CanvasArea from '@/components/editor/CanvasArea.vue'
import TopToolbar from '@/components/editor/TopToolbar.vue'
import BottomToolbar from '@/components/editor/BottomToolbar.vue'
import TextFormatBar from '@/components/editor/TextFormatBar.vue'
import MaterialPanel from '@/components/materials/MaterialPanel.vue'
import ContextMenu from '@/components/common/ContextMenu.vue'
import Toast from '@/components/common/Toast.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const canvasStore = useCanvasStore()
const materialsStore = useMaterialsStore()

const canvasArea = ref(null)
const textFormatBar = ref(null)
const contextMenu = ref(null)
const toast = ref(null)
const confirmDialog = ref(null)

const contextMenuItems = [
  { icon: '📋', label: '复制', action: 'copy', shortcut: '⌘C' },
  { icon: '📌', label: '粘贴', action: 'paste', shortcut: '⌘V' },
  { icon: '✂️', label: '剪切', action: 'cut', shortcut: '⌘X' },
  { icon: '🗑', label: '删除', action: 'delete', shortcut: '⌫' },
  { divider: true },
  { icon: '⬆️', label: '置顶', action: 'bringToFront' },
  { icon: '⬇️', label: '置底', action: 'sendToBack' },
  { icon: '↑', label: '上移一层', action: 'bringForward' },
  { icon: '↓', label: '下移一层', action: 'sendBackwards' },
]

// Toast
function showToast(msg) {
  toast.value?.show(msg)
}

// 确认弹窗
async function onConfirm({ message, resolve }) {
  const ok = await confirmDialog.value?.show(message)
  resolve(ok)
}

// 图层面板事件
function onSelectObject(canvasIndex) {
  canvasArea.value?.selectObjectByIndex(canvasIndex)
}

function onToggleVisibility(canvasIndex) {
  canvasArea.value?.toggleObjectVisibility(canvasIndex)
}

function onBringToFront(canvasIndex) {
  canvasArea.value?.bringToFrontByIndex(canvasIndex)
}

function onSendToBack(canvasIndex) {
  canvasArea.value?.sendToBackByIndex(canvasIndex)
}

function onDeleteObject(canvasIndex) {
  canvasArea.value?.deleteObjectByIndex(canvasIndex)
}

function onReorder({ from, to }) {
  canvasArea.value?.moveObjectTo(from, to)
}

// 工具栏事件
function onUndo() {
  canvasStore.undo(() => canvasArea.value?.syncLayers())
}

function onRedo() {
  canvasStore.redo(() => canvasArea.value?.syncLayers())
}

function onSaveDraft() {
  const data = canvasArea.value?.saveDraftData()
  if (data) {
    materialsStore.addDraft(
      data.thumbDataUrl,
      data.json,
      canvasStore.currentRatio,
      canvasStore.customFixedSize
    )
    showToast('草稿已保存 ✓')
  }
}

function onExport() {
  canvasArea.value?.exportPNG()
  showToast('导出成功 ✓')
}

function onAddText() {
  canvasArea.value?.addTextToCanvas()
}

function onUploadImage({ dataUrl, name }) {
  canvasArea.value?.addImageToCanvas(dataUrl, name)
  materialsStore.addToMyMaterials(dataUrl, name)
}

// 素材面板事件
function onAddMaterial(item) {
  canvasArea.value?.addMaterialToCanvasCenter(item)
}

function onAddImage({ dataUrl, name }) {
  canvasArea.value?.addImageToCanvas(dataUrl, name)
}

function onLoadDraft(draft) {
  canvasArea.value?.loadDraft(draft)
  showToast('草稿已恢复')
}

// 右键菜单
function onCanvasContextMenu({ x, y }) {
  contextMenu.value?.show(x, y)
}

function onContextAction(action) {
  canvasArea.value?.handleContextMenuAction(action)
}

// 画布选中变化 → 文字格式面板
function onSelectionChange() {
  const textObj = canvasArea.value?.getActiveTextObject()
  if (textObj) {
    textFormatBar.value?.show(textObj)
  } else {
    textFormatBar.value?.hide()
  }
}

function onTextPropChange({ prop, value }) {
  canvasArea.value?.setTextProp(prop, value)
}

// 初始化
onMounted(() => {
  materialsStore.fetchRecommended()
  materialsStore.loadMyMaterials()
  materialsStore.loadDrafts()
  materialsStore.loadGallery()
})
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
}

.panel-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
