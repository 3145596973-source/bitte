<template>
  <div class="gallery-grid">
    <div
      v-for="(item, idx) in materialsStore.galleryData"
      :key="item.id"
      class="gallery-card"
    >
      <div class="gallery-card-thumb" :style="{ background: item.gradient || item.color }"></div>
      <div class="gallery-card-body">
        <div class="gallery-card-title">{{ item.title }}</div>
        <div class="gallery-card-actions">
          <button
            class="gallery-action-btn ga-like"
            :class="{ liked: item.myLike }"
            @click="toggleLike(idx)"
          >
            <span class="ga-icon">{{ item.myLike ? '❤️' : '🤍' }}</span>
            <span class="ga-count">{{ item.likes }}</span>
          </button>
          <button class="gallery-action-btn ga-comment" @click="toggleComments(idx)">
            <span class="ga-icon">💬</span>
            <span class="ga-count">{{ (item.comments || []).length }}</span>
          </button>
          <button class="gallery-action-btn ga-share" @click="shareLink">
            <span class="ga-icon">🔗</span>
          </button>
        </div>
      </div>

      <div class="gallery-comments" :class="{ show: expandedComments === idx }">
        <div class="gallery-comment-list">
          <div v-if="(item.comments || []).length === 0" class="gallery-no-comments">暂无评论</div>
          <div
            v-for="(comment, ci) in (item.comments || [])"
            :key="ci"
            class="gallery-comment-item"
          >
            {{ comment.text }}
            <span style="color:#ccc;font-size:10px;margin-left:4px;">{{ formatTime(comment.time) }}</span>
          </div>
        </div>
        <div class="gallery-comment-input-row">
          <input
            class="gallery-comment-input"
            type="text"
            placeholder="写评论…"
            maxlength="100"
            v-model="commentInputs[idx]"
            @keydown.enter="submitComment(idx)"
          >
          <button class="gallery-comment-submit" @click="submitComment(idx)">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useMaterialsStore } from '@/stores/materials'

const materialsStore = useMaterialsStore()
const emit = defineEmits(['toast'])

const expandedComments = ref(-1)
const commentInputs = reactive({})

function formatTime(ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toggleLike(idx) {
  materialsStore.toggleLike(idx)
}

function toggleComments(idx) {
  expandedComments.value = expandedComments.value === idx ? -1 : idx
}

function submitComment(idx) {
  const text = (commentInputs[idx] || '').trim()
  if (!text) return
  materialsStore.addComment(idx, text)
  commentInputs[idx] = ''
}

function shareLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    emit('toast', '链接已复制 🔗')
  }).catch(() => {
    emit('toast', '复制失败，请手动复制')
  })
}
</script>

<style scoped>
.gallery-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gallery-card {
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  border: 1.5px solid #f0f0f0;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.gallery-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border-color: #ffd6e0;
}

.gallery-card-thumb {
  width: 100%;
  height: 140px;
  display: block;
}

.gallery-card-body {
  padding: 10px 12px;
}

.gallery-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.gallery-card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gallery-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  border: none;
  background: none;
  padding: 3px 6px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  user-select: none;
}

.gallery-action-btn:hover {
  background: #fff0f3;
  color: #ff8fa3;
}

.gallery-action-btn.liked {
  color: #ff8fa3;
}

.ga-icon {
  font-size: 14px;
}

.ga-count {
  font-size: 11px;
  min-width: 10px;
}

.gallery-comments {
  display: none;
  padding: 8px 12px 10px;
  border-top: 1px solid #f0f0f0;
}

.gallery-comments.show {
  display: block;
}

.gallery-comment-list {
  max-height: 120px;
  overflow-y: auto;
  margin-bottom: 6px;
}

.gallery-comment-item {
  font-size: 12px;
  color: #666;
  padding: 3px 0;
  border-bottom: 1px solid #f8f8f8;
  line-height: 1.5;
  word-break: break-all;
}

.gallery-comment-item:last-child {
  border-bottom: none;
}

.gallery-no-comments {
  font-size: 11px;
  color: #ccc;
  text-align: center;
  padding: 6px 0;
}

.gallery-comment-input-row {
  display: flex;
  gap: 6px;
}

.gallery-comment-input {
  flex: 1;
  height: 28px;
  border: 1.5px solid #eee;
  border-radius: 14px;
  padding: 0 10px;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}

.gallery-comment-input:focus {
  border-color: #ff8fa3;
}

.gallery-comment-submit {
  height: 28px;
  padding: 0 12px;
  border: none;
  background: #ff8fa3;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.gallery-comment-submit:hover {
  background: #ff7a91;
}

.gallery-comment-list::-webkit-scrollbar {
  width: 3px;
}

.gallery-comment-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}
</style>
