<template>
  <div
    class="canvas-area"
    ref="canvasAreaRef"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
  >
    <div
      class="canvas-wrapper"
      ref="canvasWrapperRef"
      @contextmenu.prevent="handleCanvasContextMenu"
    >
      <canvas ref="canvasEl" width="600" height="700"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { fabric } from 'fabric'
import { useCanvasStore } from '@/stores/canvas'
import { useLayersStore } from '@/stores/layers'
import { useUserStore } from '@/stores/user'

const emit = defineEmits(['context-menu', 'selection-change'])

const canvasStore = useCanvasStore()
const layersStore = useLayersStore()
const userStore = useUserStore()

const canvasAreaRef = ref(null)
const canvasWrapperRef = ref(null)
const canvasEl = ref(null)

// Fabric 实例不放进 reactive，用普通变量持有
let canvas = null

// 隐藏对象集合
const hiddenObjects = new WeakSet()

function syncLayers() {
  if (!canvas) return
  const activeObjs = canvas.getActiveObjects()
  layersStore.syncFromCanvas(canvas, activeObjs, hiddenObjects)
}

function resizeCanvas() {
  if (!canvas || !canvasAreaRef.value) return
  const area = canvasAreaRef.value
  const maxW = area.clientWidth - 40
  const maxH = area.clientHeight - 40
  let w, h

  if (canvasStore.customFixedSize) {
    w = canvasStore.customFixedSize[0]
    h = canvasStore.customFixedSize[1]
    if (w > maxW || h > maxH) {
      const scale = Math.min(maxW / w, maxH / h)
      canvas.setWidth(Math.floor(w * scale))
      canvas.setHeight(Math.floor(h * scale))
      canvas.setZoom(scale)
      canvas.renderAll()
      return
    }
    canvas.setZoom(1)
  } else {
    const ratio = canvasStore.currentRatio[0] / canvasStore.currentRatio[1]
    w = maxW
    h = w / ratio
    if (h > maxH) {
      h = maxH
      w = h * ratio
    }
  }
  canvas.setWidth(Math.floor(w))
  canvas.setHeight(Math.floor(h))
  canvas.renderAll()
}

// 暴露方法供父组件/toolbar调用
function getCanvas() {
  return canvas
}

function getHiddenObjects() {
  return hiddenObjects
}

function addObject(obj) {
  if (!canvas) return
  canvas.add(obj)
  canvas.setActiveObject(obj)
  canvas.requestRenderAll()
  syncLayers()
}

function addImageToCanvas(dataUrl, name) {
  if (!canvas) return
  fabric.Image.fromURL(dataUrl, (img) => {
    const zoom = canvas.getZoom()
    const cw = canvas.getWidth() / zoom
    const ch = canvas.getHeight() / zoom
    const maxW = cw * 0.6
    const maxH = ch * 0.6
    let scale = 1
    if (img.width > maxW || img.height > maxH) {
      scale = Math.min(maxW / img.width, maxH / img.height)
    }
    img.set({
      left: cw / 2,
      top: ch / 2,
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
      _customName: name || '图片',
    })
    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.requestRenderAll()
    syncLayers()
  })
}

function addMaterialToCanvasCenter(item) {
  if (!canvas) return
  const zoom = canvas.getZoom()
  const cw = canvas.getWidth() / zoom
  const ch = canvas.getHeight() / zoom
  const w = 120
  const h = Math.round(item.h * 0.6)
  const newRect = new fabric.Rect({
    left: cw / 2 - w / 2,
    top: ch / 2 - h / 2,
    width: w,
    height: h,
    fill: item.color,
    rx: 8,
    ry: 8,
    _customName: item.name,
  })
  canvas.add(newRect)
  canvas.setActiveObject(newRect)
  canvas.requestRenderAll()
  syncLayers()
}

function addMaterialAtPosition(data, clientX, clientY) {
  if (!canvas) return
  const canvasElBounds = canvasEl.value.getBoundingClientRect()
  const zoom = canvas.getZoom()
  const x = (clientX - canvasElBounds.left) / zoom
  const y = (clientY - canvasElBounds.top) / zoom
  if (x < 0 || y < 0 || x > canvas.getWidth() / zoom || y > canvas.getHeight() / zoom) return

  if (data.source === 'material') {
    const newRect = new fabric.Rect({
      left: x - data.width / 2,
      top: y - data.height / 2,
      width: data.width,
      height: data.height,
      fill: data.color,
      rx: 8,
      ry: 8,
      _customName: data.name,
    })
    canvas.add(newRect)
    canvas.setActiveObject(newRect)
    canvas.requestRenderAll()
    syncLayers()
  } else if (data.source === 'my-material') {
    addImageToCanvas(data.dataUrl, data.name)
  } else if (data.source === 'layer') {
    const srcObj = canvas.getObjects()[data.index]
    if (srcObj) {
      srcObj.clone((cloned) => {
        cloned.set({
          left: x - (cloned.width * cloned.scaleX) / 2,
          top: y - (cloned.height * cloned.scaleY) / 2,
        })
        canvas.add(cloned)
        canvas.setActiveObject(cloned)
        canvas.requestRenderAll()
        syncLayers()
      }, ['_customName'])
    }
  }
}

function addTextToCanvas() {
  if (!canvas) return
  canvasStore.exitBrushMode()
  const zoom = canvas.getZoom()
  const cw = canvas.getWidth() / zoom
  const ch = canvas.getHeight() / zoom
  const text = new fabric.IText('双击编辑文字', {
    left: cw / 2,
    top: ch / 2,
    originX: 'center',
    originY: 'center',
    fontSize: 24,
    fill: '#333333',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    _customName: '文字',
  })
  canvas.add(text)
  canvas.setActiveObject(text)
  canvas.requestRenderAll()
  syncLayers()
}

function exportPNG() {
  if (!canvas) return
  canvasStore.exitBrushMode()
  canvas.discardActiveObject()
  canvas.requestRenderAll()

  // 免费用户添加水印
  let watermark = null
  if (!userStore.isVip) {
    const zoom = canvas.getZoom()
    const cw = canvas.getWidth() / zoom
    const ch = canvas.getHeight() / zoom
    watermark = new fabric.Text('Bitté', {
      left: cw - 16,
      top: ch - 16,
      originX: 'right',
      originY: 'bottom',
      fontSize: 20,
      fill: 'rgba(0, 0, 0, 0.15)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '600',
      selectable: false,
      evented: false,
    })
    canvas.add(watermark)
    canvas.requestRenderAll()
  }

  let dataUrl
  if (canvasStore.customFixedSize) {
    const multiplier = 1 / canvas.getZoom()
    dataUrl = canvas.toDataURL({ format: 'png', multiplier, width: canvas.getWidth(), height: canvas.getHeight() })
  } else {
    dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 })
  }

  // 导出后移除水印
  if (watermark) {
    canvas.remove(watermark)
    canvas.requestRenderAll()
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const link = document.createElement('a')
  link.download = `bitté-作品-${timestamp}.png`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function saveDraftData() {
  if (!canvas) return null
  const thumbDataUrl = canvas.toDataURL({ format: 'png', multiplier: 0.3 })
  const json = canvas.toJSON(['_customName'])
  return { thumbDataUrl, json }
}

function loadDraft(draft) {
  if (!canvas) return
  canvasStore.isUndoRedo = true
  if (draft.customSize) {
    canvasStore.customFixedSize = draft.customSize
  } else if (draft.ratio) {
    canvasStore.customFixedSize = null
    canvasStore.currentRatio = draft.ratio
  }
  resizeCanvas()
  canvas.loadFromJSON(draft.json, () => {
    canvas.renderAll()
    canvasStore.isUndoRedo = false
    canvasStore.undoStack = []
    canvasStore.redoStack = []
    canvasStore.saveState()
    syncLayers()
  })
}

function selectObjectByIndex(idx) {
  if (!canvas) return
  const obj = canvas.getObjects()[idx]
  if (obj) {
    canvas.setActiveObject(obj)
    canvas.requestRenderAll()
    syncLayers()
  }
}

function toggleObjectVisibility(idx) {
  if (!canvas) return
  const obj = canvas.getObjects()[idx]
  if (!obj) return
  if (hiddenObjects.has(obj)) {
    hiddenObjects.delete(obj)
    obj.set({ opacity: obj._savedOpacity || 1, evented: true, selectable: true })
  } else {
    obj._savedOpacity = obj.opacity || 1
    hiddenObjects.add(obj)
    obj.set({ opacity: 0, evented: false, selectable: false })
    if (canvas.getActiveObject() === obj) canvas.discardActiveObject()
  }
  canvas.requestRenderAll()
  canvasStore.saveState()
  syncLayers()
}

function bringToFrontByIndex(idx) {
  if (!canvas) return
  const obj = canvas.getObjects()[idx]
  if (obj) {
    canvas.bringToFront(obj)
    canvas.requestRenderAll()
    canvasStore.saveState()
    syncLayers()
  }
}

function sendToBackByIndex(idx) {
  if (!canvas) return
  const obj = canvas.getObjects()[idx]
  if (obj) {
    canvas.sendToBack(obj)
    canvas.requestRenderAll()
    canvasStore.saveState()
    syncLayers()
  }
}

function deleteObjectByIndex(idx) {
  if (!canvas) return
  const obj = canvas.getObjects()[idx]
  if (obj) {
    canvas.remove(obj)
    canvas.requestRenderAll()
    canvasStore.saveState()
    syncLayers()
  }
}

function moveObjectTo(fromIdx, toIdx) {
  if (!canvas) return
  const obj = canvas.getObjects()[fromIdx]
  if (!obj) return
  canvas.moveTo(obj, toIdx)
  canvas.requestRenderAll()
  canvasStore.saveState()
  syncLayers()
}

function handleContextMenuAction(action) {
  const active = canvas?.getActiveObject()
  if (!active) return

  switch (action) {
    case 'copy':
      canvasStore.copySelection()
      break
    case 'paste':
      canvasStore.pasteClipboard(() => syncLayers())
      break
    case 'cut':
      canvasStore.cutSelection(() => syncLayers())
      break
    case 'delete':
      canvasStore.deleteSelection(() => syncLayers())
      break
    case 'bringToFront':
      if (active.type === 'activeSelection') active.forEachObject(o => canvas.bringToFront(o))
      else canvas.bringToFront(active)
      canvas.requestRenderAll()
      canvasStore.saveState()
      syncLayers()
      break
    case 'sendToBack':
      if (active.type === 'activeSelection') active.forEachObject(o => canvas.sendToBack(o))
      else canvas.sendToBack(active)
      canvas.requestRenderAll()
      canvasStore.saveState()
      syncLayers()
      break
    case 'bringForward':
      if (active.type === 'activeSelection') active.forEachObject(o => canvas.bringForward(o))
      else canvas.bringForward(active)
      canvas.requestRenderAll()
      canvasStore.saveState()
      syncLayers()
      break
    case 'sendBackwards':
      if (active.type === 'activeSelection') active.forEachObject(o => canvas.sendBackwards(o))
      else canvas.sendBackwards(active)
      canvas.requestRenderAll()
      canvasStore.saveState()
      syncLayers()
      break
  }
}

// 获取当前活跃文字对象
function getActiveTextObject() {
  if (!canvas) return null
  const active = canvas.getActiveObject()
  if (active && (active.type === 'i-text' || active.type === 'textbox')) return active
  return null
}

function setTextProp(prop, value) {
  const obj = getActiveTextObject()
  if (!obj) return
  obj.set(prop, value)
  canvas.requestRenderAll()
  canvasStore.saveState()
}

// 键盘快捷键处理
function handleKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  if (e.target.isContentEditable) return
  const activeObj = canvas?.getActiveObject()
  if (activeObj && activeObj.isEditing) return
  const isMeta = e.metaKey || e.ctrlKey

  if (isMeta && !e.shiftKey && e.key === 'z') {
    e.preventDefault()
    canvasStore.undo(() => syncLayers())
  } else if (isMeta && e.shiftKey && e.key === 'z') {
    e.preventDefault()
    canvasStore.redo(() => syncLayers())
  } else if (isMeta && e.key === 'c') {
    e.preventDefault()
    canvasStore.copySelection()
  } else if (isMeta && e.key === 'v') {
    e.preventDefault()
    canvasStore.pasteClipboard(() => syncLayers())
  } else if (isMeta && e.key === 'x') {
    e.preventDefault()
    canvasStore.cutSelection(() => syncLayers())
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    canvasStore.deleteSelection(() => syncLayers())
  }
}

// Drop 事件处理
function handleDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

function handleDrop(e) {
  e.preventDefault()
  const rawData = e.dataTransfer.getData('text/plain')
  if (rawData === 'layer-reorder') return
  let data
  try { data = JSON.parse(rawData) } catch { return }
  addMaterialAtPosition(data, e.clientX, e.clientY)
}

// 右键菜单
function handleCanvasContextMenu(e) {
  e.preventDefault()
  if (!canvas?.getActiveObject()) return
  emit('context-menu', { x: e.clientX, y: e.clientY })
}

onMounted(() => {
  canvas = new fabric.Canvas(canvasEl.value, {
    backgroundColor: '#ffffff',
    selection: true,
    preserveObjectStacking: true,
  })

  canvasStore.setCanvas(canvas)
  resizeCanvas()

  // 画布事件
  canvas.on('object:added', () => canvasStore.saveState())
  canvas.on('object:removed', () => canvasStore.saveState())
  canvas.on('object:modified', () => canvasStore.saveState())
  canvas.on('selection:created', () => { syncLayers(); emit('selection-change') })
  canvas.on('selection:updated', () => { syncLayers(); emit('selection-change') })
  canvas.on('selection:cleared', () => { syncLayers(); emit('selection-change') })
  canvas.on('text:changed', () => canvasStore.saveState())
  canvas.on('object:scaling', () => emit('selection-change'))
  canvas.on('path:created', (opt) => {
    if (opt.path) opt.path._customName = '画笔'
    syncLayers()
  })

  // 右键前选中目标
  canvas.on('mouse:down', () => {
    // 点击隐藏右键菜单（由父组件处理）
  })
  canvas.on('mouse:down:before', (opt) => {
    if (opt.e.button === 2) {
      const target = canvas.findTarget(opt.e, false)
      if (target) {
        if (!canvas.getActiveObjects().includes(target)) {
          canvas.setActiveObject(target)
        }
      }
    }
  })

  // 预置示例素材
  canvas.add(
    new fabric.Rect({ left: 80, top: 120, width: 160, height: 120, fill: '#ffc4d0', rx: 12, ry: 12, _customName: '粉色卡片' }),
    new fabric.Rect({ left: 300, top: 200, width: 140, height: 140, fill: '#c4e0ff', rx: 12, ry: 12, _customName: '蓝色方块' }),
    new fabric.Circle({ left: 200, top: 400, radius: 60, fill: '#d4f5c4', _customName: '绿色圆形' })
  )
  canvas.requestRenderAll()
  canvasStore.saveState()
  syncLayers()

  // 全局事件
  window.addEventListener('resize', resizeCanvas)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
  document.removeEventListener('keydown', handleKeydown)
  if (canvas) {
    canvas.dispose()
    canvas = null
  }
})

// 监听比例变化
watch(
  () => [canvasStore.currentRatio, canvasStore.customFixedSize],
  () => resizeCanvas(),
  { deep: true }
)

defineExpose({
  getCanvas,
  getHiddenObjects,
  addObject,
  addImageToCanvas,
  addMaterialToCanvasCenter,
  addMaterialAtPosition,
  addTextToCanvas,
  exportPNG,
  saveDraftData,
  loadDraft,
  selectObjectByIndex,
  toggleObjectVisibility,
  bringToFrontByIndex,
  sendToBackByIndex,
  deleteObjectByIndex,
  moveObjectTo,
  handleContextMenuAction,
  getActiveTextObject,
  setTextProp,
  syncLayers,
  resizeCanvas,
})
</script>

<style scoped>
.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  background: #f5f5f5;
}

.canvas-wrapper {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  line-height: 0;
}

.canvas-wrapper canvas {
  border-radius: 4px;
}
</style>
