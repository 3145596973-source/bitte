import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayersStore = defineStore('layers', () => {
  // 图层列表（从画布对象派生，保存渲染所需信息）
  const layers = ref([])

  // 隐藏对象集合（用 Map<canvasIndex, true>跟踪，因为 WeakSet 不适合响应式）
  // 实际隐藏状态仍在 CanvasArea 中用 WeakSet 管理，这里只同步 UI 用的数据
  const hiddenIndices = ref(new Set())

  // 当前活跃的图层菜单目标 canvas index
  const menuTargetIndex = ref(-1)

  function syncFromCanvas(canvasInstance, activeObjects, hiddenObjects) {
    if (!canvasInstance) {
      layers.value = []
      return
    }
    const objects = canvasInstance.getObjects()
    const result = []

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      const isHidden = hiddenObjects ? hiddenObjects.has(obj) : false
      const isActive = activeObjects ? activeObjects.includes(obj) : false

      const name = obj._customName || obj.type || '对象'
      const typeMap = {
        'rect': '矩形',
        'circle': '圆形',
        'triangle': '三角形',
        'image': '图片',
        'i-text': '文字',
        'textbox': '文字',
        'path': '画笔',
      }
      const typeStr = typeMap[obj.type] || obj.type

      let thumbStyle
      if (obj.type === 'image' && obj._element) {
        try {
          thumbStyle = `background-image:url('${obj.toDataURL({ multiplier: 0.2 })}');background-size:cover;background-position:center;`
        } catch {
          thumbStyle = 'background:#ccc;'
        }
      } else if (obj.type === 'path') {
        thumbStyle = `background:${obj.stroke || '#ff8fa3'};`
      } else {
        const color = obj.fill || '#ccc'
        thumbStyle = `background:${typeof color === 'string' ? color : '#ccc'};`
      }

      result.push({
        canvasIndex: i,
        name,
        typeStr,
        thumbStyle,
        isActive,
        isHidden,
      })
    }

    layers.value = result
  }

  return {
    layers,
    hiddenIndices,
    menuTargetIndex,
    syncFromCanvas,
  }
})
