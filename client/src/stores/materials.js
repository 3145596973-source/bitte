import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useMaterialsStore = defineStore('materials', () => {
  // 当前 tab
  const currentTab = ref('recommend')

  // 搜索关键词
  const searchKeyword = ref('')

  // ========================
  // 推荐素材（从后端加载）
  // ========================
  const recommendMaterials = ref([])
  const recommendLoading = ref(false)

  async function fetchRecommended() {
    recommendLoading.value = true
    try {
      const data = await api.get('/materials/recommended')
      recommendMaterials.value = data.materials.map(m => ({
        id: m.id,
        color: m.color,
        h: 140 + (m.sort_order * 7) % 80, // 从 sort_order 推算高度，保持瀑布流效果
        name: m.name,
        tags: m.tags ? m.tags.split(',') : [],
        is_free: m.is_free,
        file_path: m.file_path,
      }))
    } catch (err) {
      console.error('获取推荐素材失败:', err)
    } finally {
      recommendLoading.value = false
    }
  }

  async function searchRecommended(keyword) {
    recommendLoading.value = true
    try {
      const data = await api.get(`/materials/recommended?q=${encodeURIComponent(keyword)}`)
      recommendMaterials.value = data.materials.map(m => ({
        id: m.id,
        color: m.color,
        h: 140 + (m.sort_order * 7) % 80,
        name: m.name,
        tags: m.tags ? m.tags.split(',') : [],
        is_free: m.is_free,
        file_path: m.file_path,
      }))
    } catch (err) {
      console.error('搜索推荐素材失败:', err)
    } finally {
      recommendLoading.value = false
    }
  }

  // 过滤后的推荐素材
  const filteredRecommend = computed(() => {
    const kw = searchKeyword.value.trim().toLowerCase()
    if (!kw) return recommendMaterials.value
    return recommendMaterials.value.filter(item =>
      item.name.toLowerCase().includes(kw) || item.tags.some(t => t.toLowerCase().includes(kw))
    )
  })

  // ========================
  // 我的素材（从后端加载）
  // ========================
  const myMaterials = ref([])
  const myMatSelected = ref(new Set())
  const myMaterialsLoading = ref(false)

  async function fetchMyMaterials() {
    myMaterialsLoading.value = true
    try {
      const data = await api.get('/materials')
      myMaterials.value = data.materials.map(m => ({
        id: m.id,
        dataUrl: m.file_path, // 后端返回的是 /uploads/materials/xxx 路径
        name: m.original_name,
        time: new Date(m.created_at).getTime(),
      }))
    } catch (err) {
      console.error('获取我的素材失败:', err)
    } finally {
      myMaterialsLoading.value = false
    }
  }

  async function uploadMaterial(file) {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const data = await api.upload('/materials/upload', formData)
      const m = data.material
      myMaterials.value.unshift({
        id: m.id,
        dataUrl: m.file_path,
        name: m.original_name,
        time: new Date(m.created_at).getTime(),
      })
      return data.material
    } catch (err) {
      console.error('上传素材失败:', err)
      throw err
    }
  }

  async function deleteMaterial(materialId) {
    try {
      await api.delete(`/materials/${materialId}`)
      myMaterials.value = myMaterials.value.filter(m => m.id !== materialId)
    } catch (err) {
      console.error('删除素材失败:', err)
      throw err
    }
  }

  // 保留本地方法用于未登录时的兼容
  function loadMyMaterials() {
    const token = localStorage.getItem('bitte_token')
    if (token) {
      fetchMyMaterials()
    } else {
      try {
        myMaterials.value = JSON.parse(localStorage.getItem('bitte_my_materials') || '[]')
      } catch {
        myMaterials.value = []
      }
    }
  }

  function saveMyMaterials() {
    localStorage.setItem('bitte_my_materials', JSON.stringify(myMaterials.value))
  }

  function addToMyMaterials(dataUrl, name) {
    myMaterials.value.unshift({ dataUrl, name: name || '上传图片', time: Date.now() })
    if (myMaterials.value.length > 50) myMaterials.value.pop()
    saveMyMaterials()
  }

  function deleteSelectedMaterials() {
    const token = localStorage.getItem('bitte_token')
    if (token) {
      // 在线模式：调用后端 API 逐个删除
      const indices = Array.from(myMatSelected.value).sort((a, b) => b - a)
      const promises = indices.map(i => {
        const item = myMaterials.value[i]
        if (item && item.id) return deleteMaterial(item.id)
        return Promise.resolve()
      })
      Promise.all(promises).catch(() => {})
      myMatSelected.value = new Set()
    } else {
      // 离线模式：本地删除
      const indices = Array.from(myMatSelected.value).sort((a, b) => b - a)
      indices.forEach(i => myMaterials.value.splice(i, 1))
      saveMyMaterials()
      myMatSelected.value = new Set()
    }
  }

  function toggleSelectMaterial(idx) {
    const s = new Set(myMatSelected.value)
    if (s.has(idx)) s.delete(idx)
    else s.add(idx)
    myMatSelected.value = s
  }

  function selectAllMaterials(selectAll) {
    if (selectAll) {
      myMatSelected.value = new Set(myMaterials.value.map((_, i) => i))
    } else {
      myMatSelected.value = new Set()
    }
  }

  function applyCutout() {
    return new Promise((resolve) => {
      const promises = []
      myMatSelected.value.forEach(idx => {
        const item = myMaterials.value[idx]
        if (!item) return
        promises.push(new Promise((res) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = function () {
            const tmpC = document.createElement('canvas')
            tmpC.width = img.width
            tmpC.height = img.height
            const ctx = tmpC.getContext('2d')
            ctx.drawImage(img, 0, 0)
            const imageData = ctx.getImageData(0, 0, tmpC.width, tmpC.height)
            const data = imageData.data
            for (let i = 0; i < data.length; i += 4) {
              if (data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230) {
                data[i + 3] = 0
              } else {
                data[i] = Math.min(255, data[i] * 1.2)
                data[i + 1] = Math.min(255, data[i + 1] * 1.2)
                data[i + 2] = Math.min(255, data[i + 2] * 1.2)
              }
            }
            ctx.putImageData(imageData, 0, 0)
            myMaterials.value[idx] = { ...item, dataUrl: tmpC.toDataURL('image/png') }
            saveMyMaterials()
            res()
          }
          img.src = item.dataUrl
        }))
      })
      setTimeout(() => {
        Promise.all(promises).then(resolve)
      }, 2000)
    })
  }

  // ========================
  // 草稿箱（从后端加载）
  // ========================
  const drafts = ref([])
  const draftsLoading = ref(false)

  async function fetchDrafts() {
    draftsLoading.value = true
    try {
      const data = await api.get('/drafts')
      drafts.value = data.drafts.map(d => ({
        id: d.id,
        name: d.name,
        thumb: d.thumbnail,
        time: new Date(d.updated_at || d.created_at).getTime(),
      }))
    } catch (err) {
      console.error('获取草稿失败:', err)
    } finally {
      draftsLoading.value = false
    }
  }

  async function saveDraft(thumbDataUrl, canvasJson, ratio, customSize) {
    const token = localStorage.getItem('bitte_token')
    if (token) {
      try {
        const data = await api.post('/drafts', {
          name: '草稿',
          canvas_json: typeof canvasJson === 'string' ? canvasJson : JSON.stringify(canvasJson),
          thumbnail: thumbDataUrl,
        })
        const d = data.draft
        drafts.value.unshift({
          id: d.id,
          name: d.name,
          thumb: d.thumbnail,
          json: d.canvas_json,
          time: new Date(d.created_at).getTime(),
          ratio: ratio ? ratio.slice() : [1, 1],
          customSize: customSize ? customSize.slice() : null,
        })
        return data.draft
      } catch (err) {
        console.error('保存草稿失败:', err)
        throw err
      }
    } else {
      // 离线模式
      addDraftLocal(thumbDataUrl, canvasJson, ratio, customSize)
    }
  }

  function addDraftLocal(thumbDataUrl, canvasJson, ratio, customSize) {
    drafts.value.unshift({
      id: Date.now(),
      name: '草稿',
      thumb: thumbDataUrl,
      json: canvasJson,
      time: Date.now(),
      ratio: ratio ? ratio.slice() : [1, 1],
      customSize: customSize ? customSize.slice() : null,
    })
    if (drafts.value.length > 20) drafts.value.pop()
    saveDraftsToStorage()
  }

  async function updateDraft(draftId, updates) {
    const token = localStorage.getItem('bitte_token')
    if (token && typeof draftId === 'number') {
      try {
        const data = await api.put(`/drafts/${draftId}`, updates)
        const idx = drafts.value.findIndex(d => d.id === draftId)
        if (idx >= 0 && data.draft) {
          drafts.value[idx] = {
            ...drafts.value[idx],
            name: data.draft.name,
            thumb: data.draft.thumbnail || drafts.value[idx].thumb,
            time: new Date(data.draft.updated_at).getTime(),
          }
        }
        return data.draft
      } catch (err) {
        console.error('更新草稿失败:', err)
        throw err
      }
    }
  }

  async function deleteDraftById(draftId) {
    const token = localStorage.getItem('bitte_token')
    if (token && typeof draftId === 'number') {
      try {
        await api.delete(`/drafts/${draftId}`)
        drafts.value = drafts.value.filter(d => d.id !== draftId)
      } catch (err) {
        console.error('删除草稿失败:', err)
        throw err
      }
    }
  }

  function loadDrafts() {
    const token = localStorage.getItem('bitte_token')
    if (token) {
      fetchDrafts()
    } else {
      try {
        drafts.value = JSON.parse(localStorage.getItem('bitte_drafts') || '[]')
      } catch {
        drafts.value = []
      }
    }
  }

  function saveDraftsToStorage() {
    localStorage.setItem('bitte_drafts', JSON.stringify(drafts.value))
  }

  function addDraft(thumbDataUrl, canvasJson, ratio, customSize) {
    saveDraft(thumbDataUrl, canvasJson, ratio, customSize)
  }

  function deleteDraft(idx) {
    const draft = drafts.value[idx]
    const token = localStorage.getItem('bitte_token')
    if (token && draft && draft.id) {
      deleteDraftById(draft.id)
    } else {
      drafts.value.splice(idx, 1)
      saveDraftsToStorage()
    }
  }

  function renameDraft(idx, newName) {
    const draft = drafts.value[idx]
    if (!draft) return
    const token = localStorage.getItem('bitte_token')
    if (token && draft.id) {
      updateDraft(draft.id, { name: newName })
    } else {
      draft.name = newName
      saveDraftsToStorage()
    }
  }

  // ========================
  // 案例库（保留 localStorage）
  // ========================
  const galleryCases = [
    { id: 'c1', title: '春日花园拼贴', color: '#ffd6e0', gradient: 'linear-gradient(135deg, #ffd6e0, #f8bbd0)', likes: 128, comments: [] },
    { id: 'c2', title: '海边日落记忆', color: '#d0f0fd', gradient: 'linear-gradient(135deg, #b3e5fc, #d0f0fd)', likes: 86, comments: [] },
    { id: 'c3', title: '城市霓虹夜景', color: '#e8dff5', gradient: 'linear-gradient(135deg, #d1c4e9, #e8dff5)', likes: 215, comments: [] },
    { id: 'c4', title: '森林探险日记', color: '#c8e6c9', gradient: 'linear-gradient(135deg, #a5d6a7, #c8e6c9)', likes: 64, comments: [] },
    { id: 'c5', title: '复古胶片风格', color: '#ffe8cc', gradient: 'linear-gradient(135deg, #ffe0b2, #ffccbc)', likes: 173, comments: [] },
  ]

  const galleryData = ref([])

  function loadGallery() {
    try {
      const stored = JSON.parse(localStorage.getItem('bitte_gallery') || 'null')
      if (stored && stored.length === galleryCases.length) {
        galleryData.value = stored
        return
      }
    } catch { /* ignore */ }
    galleryData.value = galleryCases.map(c => ({ ...c, myLike: false, comments: [] }))
    localStorage.setItem('bitte_gallery', JSON.stringify(galleryData.value))
  }

  function saveGalleryData() {
    localStorage.setItem('bitte_gallery', JSON.stringify(galleryData.value))
  }

  function toggleLike(idx) {
    const item = galleryData.value[idx]
    item.myLike = !item.myLike
    item.likes += item.myLike ? 1 : -1
    saveGalleryData()
  }

  function addComment(idx, text) {
    if (!galleryData.value[idx].comments) galleryData.value[idx].comments = []
    galleryData.value[idx].comments.push({ text, time: Date.now() })
    saveGalleryData()
  }

  // 初始化加载推荐素材
  function initRecommended() {
    fetchRecommended()
  }

  return {
    currentTab,
    searchKeyword,
    recommendMaterials,
    recommendLoading,
    filteredRecommend,
    fetchRecommended,
    searchRecommended,
    initRecommended,
    myMaterials,
    myMatSelected,
    myMaterialsLoading,
    fetchMyMaterials,
    uploadMaterial,
    deleteMaterial,
    loadMyMaterials,
    addToMyMaterials,
    deleteSelectedMaterials,
    toggleSelectMaterial,
    selectAllMaterials,
    applyCutout,
    drafts,
    draftsLoading,
    fetchDrafts,
    saveDraft,
    updateDraft,
    deleteDraftById,
    loadDrafts,
    addDraft,
    deleteDraft,
    renameDraft,
    galleryData,
    loadGallery,
    toggleLike,
    addComment,
  }
})
