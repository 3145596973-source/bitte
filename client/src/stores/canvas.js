import { defineStore } from 'pinia'
import { shallowRef, ref } from 'vue'

export const useCanvasStore = defineStore('canvas', () => {
  // Fabric canvas 实例，用 shallowRef 避免深层响应式
  const fabricCanvas = shallowRef(null)

  // 画布比例
  const currentRatio = ref([1, 1])
  const customFixedSize = ref(null)

  // 撤销/重做栈
  const undoStack = ref([])
  const redoStack = ref([])
  const isUndoRedo = ref(false)

  // 画笔模式
  const brushMode = ref(false)

  // 剪贴板
  let clipboard = null

  // 防抖计时器
  let stateChangeTimer = null

  function setCanvas(instance) {
    fabricCanvas.value = instance
  }

  function saveState() {
    if (isUndoRedo.value) return
    const c = fabricCanvas.value
    if (!c) return
    clearTimeout(stateChangeTimer)
    stateChangeTimer = setTimeout(() => {
      const json = JSON.stringify(c.toJSON(['_customName']))
      if (undoStack.value.length > 0 && undoStack.value[undoStack.value.length - 1] === json) return
      undoStack.value.push(json)
      if (undoStack.value.length > 50) undoStack.value.shift()
      redoStack.value = []
    }, 80)
  }

  function undo(onComplete) {
    const c = fabricCanvas.value
    if (!c || undoStack.value.length <= 1) return
    isUndoRedo.value = true
    redoStack.value.push(undoStack.value.pop())
    c.loadFromJSON(undoStack.value[undoStack.value.length - 1], () => {
      c.renderAll()
      isUndoRedo.value = false
      if (onComplete) onComplete()
    })
  }

  function redo(onComplete) {
    const c = fabricCanvas.value
    if (!c || redoStack.value.length === 0) return
    isUndoRedo.value = true
    const state = redoStack.value.pop()
    undoStack.value.push(state)
    c.loadFromJSON(state, () => {
      c.renderAll()
      isUndoRedo.value = false
      if (onComplete) onComplete()
    })
  }

  function copySelection() {
    const c = fabricCanvas.value
    if (!c) return
    const active = c.getActiveObject()
    if (!active) return
    active.clone((cloned) => { clipboard = cloned }, ['_customName'])
  }

  function cutSelection(onComplete) {
    const c = fabricCanvas.value
    if (!c) return
    const active = c.getActiveObject()
    if (!active) return
    active.clone((cloned) => {
      clipboard = cloned
      if (active.type === 'activeSelection') {
        active.forEachObject(obj => c.remove(obj))
        c.discardActiveObject()
      } else {
        c.remove(active)
      }
      c.requestRenderAll()
      if (onComplete) onComplete()
    }, ['_customName'])
  }

  function pasteClipboard(onComplete) {
    const c = fabricCanvas.value
    if (!c || !clipboard) return
    clipboard.clone((clonedObj) => {
      c.discardActiveObject()
      clonedObj.set({ left: clonedObj.left + 20, top: clonedObj.top + 20, evented: true })
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = c
        clonedObj.forEachObject(obj => c.add(obj))
        clonedObj.setCoords()
      } else {
        c.add(clonedObj)
      }
      clipboard.top += 20
      clipboard.left += 20
      c.setActiveObject(clonedObj)
      c.requestRenderAll()
      if (onComplete) onComplete()
    }, ['_customName'])
  }

  function deleteSelection(onComplete) {
    const c = fabricCanvas.value
    if (!c) return
    const active = c.getActiveObject()
    if (!active) return
    if (active.type === 'activeSelection') {
      active.forEachObject(obj => c.remove(obj))
      c.discardActiveObject()
    } else {
      c.remove(active)
    }
    c.requestRenderAll()
    if (onComplete) onComplete()
  }

  function enterBrushMode() {
    const c = fabricCanvas.value
    if (!c) return
    brushMode.value = true
    c.isDrawingMode = true
    c.freeDrawingBrush.color = '#ff8fa3'
    c.freeDrawingBrush.width = 3
    c.discardActiveObject()
    c.requestRenderAll()
  }

  function exitBrushMode() {
    const c = fabricCanvas.value
    if (!c) return
    brushMode.value = false
    c.isDrawingMode = false
  }

  function setRatio(ratio) {
    currentRatio.value = ratio
    customFixedSize.value = null
  }

  function setCustomSize(w, h) {
    customFixedSize.value = [w, h]
  }

  return {
    fabricCanvas,
    currentRatio,
    customFixedSize,
    undoStack,
    redoStack,
    isUndoRedo,
    brushMode,
    setCanvas,
    saveState,
    undo,
    redo,
    copySelection,
    cutSelection,
    pasteClipboard,
    deleteSelection,
    enterBrushMode,
    exitBrushMode,
    setRatio,
    setCustomSize,
  }
})
