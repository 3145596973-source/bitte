<template>
  <div>
    <div v-if="materialsStore.drafts.length === 0" class="empty-hint">
      <span class="empty-icon">📝</span>
      还没有草稿
    </div>

    <div v-else class="drafts-grid">
      <div
        v-for="(draft, idx) in materialsStore.drafts"
        :key="draft.id"
        class="draft-item"
        @click="onClickDraft($event, draft)"
      >
        <img class="draft-item-thumb" :src="draft.thumb" alt="草稿">
        <div class="draft-item-info">
          <div style="display:flex;flex-direction:column;gap:2px;flex:1;min-width:0;">
            <span
              class="draft-item-name"
              :ref="el => setNameRef(el, idx)"
              :contenteditable="editingIdx === idx"
              title="双击重命名"
              @dblclick.stop="startRename(idx)"
              @blur="finishRename(idx)"
              @keydown.enter.prevent="finishRenameByEnter(idx)"
            >{{ draft.name || '草稿' }}</span>
            <span class="draft-item-time">{{ formatTime(draft.time) }}</span>
          </div>
          <button class="draft-item-del" title="删除草稿" @click.stop="onDelete(idx)">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useMaterialsStore } from '@/stores/materials'

const materialsStore = useMaterialsStore()
const emit = defineEmits(['load-draft', 'toast', 'confirm'])

const editingIdx = ref(-1)
const nameRefs = {}

function setNameRef(el, idx) {
  if (el) nameRefs[idx] = el
}

function formatTime(ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function onClickDraft(e, draft) {
  if (e.target.closest('.draft-item-del')) return
  if (e.target.classList.contains('draft-item-name') && editingIdx.value >= 0) return
  emit('load-draft', draft)
}

function startRename(idx) {
  editingIdx.value = idx
  nextTick(() => {
    const el = nameRefs[idx]
    if (el) {
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }
  })
}

function finishRename(idx) {
  editingIdx.value = -1
  const el = nameRefs[idx]
  if (el) {
    const newName = el.textContent.trim() || '草稿'
    el.textContent = newName
    materialsStore.renameDraft(idx, newName)
  }
}

function finishRenameByEnter(idx) {
  const el = nameRefs[idx]
  if (el) el.blur()
}

async function onDelete(idx) {
  const ok = await new Promise(resolve => {
    emit('confirm', { message: '确定删除这个草稿？', resolve })
  })
  if (!ok) return
  materialsStore.deleteDraft(idx)
  emit('toast', '草稿已删除')
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

.drafts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.draft-item {
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #f9f9f9;
  border: 1.5px solid #eee;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  position: relative;
}

.draft-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  border-color: #ff8fa3;
}

.draft-item-thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  display: block;
  background: #fff;
  border-radius: 8px 8px 0 0;
}

.draft-item-info {
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.draft-item-name {
  font-size: 11px;
  color: #666;
  cursor: text;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: 3px;
  padding: 1px 3px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.draft-item-name:focus {
  border-color: #ff8fa3;
  background: #fff;
  color: #333;
}

.draft-item-time {
  font-size: 10px;
  color: #bbb;
}

.draft-item-del {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: #ccc;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.draft-item-del:hover {
  color: #ff6b81;
  background: #fff0f3;
}
</style>
