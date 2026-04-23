<template>
  <div class="page">
    <div class="page-header">
      <h2>素材管理</h2>
      <button class="btn btn-primary" @click="openCreateModal">＋ 上传新素材</button>
    </div>

    <div class="table-container">
      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="materials.length === 0" class="empty-state">
        <div class="empty-icon">🎨</div>
        <p>暂无推荐素材</p>
      </div>

      <table v-else>
        <thead>
          <tr>
            <th>缩略图</th>
            <th>名称</th>
            <th>标签</th>
            <th>类型</th>
            <th>排序</th>
            <th>上传时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in materials" :key="m.id">
            <td>
              <img
                v-if="m.file_path"
                :src="m.file_path"
                class="thumb"
                :alt="m.name"
              />
              <div
                v-else
                class="color-swatch"
                :style="{ background: m.color || '#eee' }"
              ></div>
            </td>
            <td>{{ m.name }}</td>
            <td>
              <span class="text-muted">{{ m.tags }}</span>
            </td>
            <td>
              <span :class="m.is_free ? 'badge badge-free' : 'badge badge-paid'">
                {{ m.is_free ? '免费' : '付费' }}
              </span>
            </td>
            <td>{{ m.sort_order }}</td>
            <td class="text-muted">{{ m.created_at }}</td>
            <td>
              <div class="actions">
                <button class="btn btn-outline btn-sm" @click="openEditModal(m)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="confirmDelete(m)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑/创建弹窗 -->
    <MaterialEditModal
      v-if="showModal"
      :material="editingMaterial"
      @close="showModal = false"
      @saved="onSaved"
    />

    <!-- 删除确认 -->
    <div v-if="deletingMaterial" class="confirm-overlay" @click.self="deletingMaterial = null">
      <div class="confirm-box">
        <p>确定要删除素材「{{ deletingMaterial.name }}」吗？<br />此操作不可撤销。</p>
        <div class="confirm-actions">
          <button class="btn btn-outline" @click="deletingMaterial = null">取消</button>
          <button class="btn btn-danger" @click="doDelete" :disabled="deleting">
            {{ deleting ? '删除中...' : '确定删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, del } from '../utils/api.js'
import MaterialEditModal from '../components/MaterialEditModal.vue'

const materials = ref([])
const loading = ref(true)

const showModal = ref(false)
const editingMaterial = ref(null)

const deletingMaterial = ref(null)
const deleting = ref(false)

async function fetchMaterials() {
  loading.value = true
  try {
    const data = await get('/admin/materials')
    materials.value = data.materials
  } catch (err) {
    console.error('获取素材失败:', err)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingMaterial.value = null
  showModal.value = true
}

function openEditModal(m) {
  editingMaterial.value = m
  showModal.value = true
}

function onSaved() {
  showModal.value = false
  fetchMaterials()
}

function confirmDelete(m) {
  deletingMaterial.value = m
}

async function doDelete() {
  deleting.value = true
  try {
    await del(`/admin/materials/${deletingMaterial.value.id}`)
    deletingMaterial.value = null
    fetchMaterials()
  } catch (err) {
    console.error('删除失败:', err)
  } finally {
    deleting.value = false
  }
}

onMounted(fetchMaterials)
</script>
