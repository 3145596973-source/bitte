<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ isEdit ? '编辑素材' : '上传新素材' }}</h3>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- 上传文件（仅新增时显示） -->
        <div v-if="!isEdit" class="form-group">
          <label>素材图片</label>
          <div
            class="file-upload"
            :class="{ 'has-file': fileName }"
            @click="$refs.fileInput.click()"
          >
            <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" />
            <div v-if="!fileName">
              <div class="upload-icon">📁</div>
              <div class="upload-text">点击选择图片文件</div>
            </div>
            <div v-else>
              <div class="upload-icon">✅</div>
              <div class="upload-filename">{{ fileName }}</div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>名称</label>
          <input v-model="form.name" class="form-input" placeholder="素材名称" />
        </div>

        <div class="form-group">
          <label>标签（逗号分隔）</label>
          <input v-model="form.tags" class="form-input" placeholder="粉色,卡片,浪漫" />
        </div>

        <div class="form-group">
          <label>颜色</label>
          <div style="display: flex; align-items: center; gap: 12px;">
            <input v-model="form.color" class="form-input" placeholder="#ffd6e0" style="flex: 1;" />
            <input type="color" v-model="form.color" style="width: 44px; height: 38px; border: none; cursor: pointer; border-radius: 8px;" />
          </div>
        </div>

        <div class="form-group">
          <label>排序值（越小越靠前）</label>
          <input v-model.number="form.sort_order" type="number" class="form-input" placeholder="0" />
        </div>

        <div class="form-group">
          <label>免费/付费</label>
          <label class="toggle">
            <input type="checkbox" v-model="isFree" />
            <span class="slider"></span>
          </label>
          <span style="margin-left: 8px; font-size: 13px; color: #666;">{{ isFree ? '免费' : '付费' }}</span>
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="submit" :disabled="saving">
          {{ saving ? '保存中...' : (isEdit ? '保存修改' : '上传') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { post, put } from '../utils/api.js'

const props = defineProps({
  material: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => !!props.material)

const form = reactive({
  name: props.material?.name || '',
  tags: props.material?.tags || '',
  color: props.material?.color || '#ffd6e0',
  sort_order: props.material?.sort_order ?? 0,
})

const isFree = ref(props.material ? props.material.is_free === 1 : true)
const file = ref(null)
const fileName = ref('')
const saving = ref(false)
const error = ref('')

function onFileChange(e) {
  const f = e.target.files[0]
  if (f) {
    file.value = f
    fileName.value = f.name
  }
}

async function submit() {
  error.value = ''
  saving.value = true

  try {
    if (isEdit.value) {
      // 编辑
      await put(`/admin/materials/${props.material.id}`, {
        name: form.name,
        tags: form.tags,
        color: form.color,
        sort_order: form.sort_order,
        is_free: isFree.value ? 1 : 0,
      })
    } else {
      // 新增
      if (!file.value) {
        error.value = '请选择一个图片文件'
        saving.value = false
        return
      }

      const fd = new FormData()
      fd.append('file', file.value)
      fd.append('name', form.name)
      fd.append('tags', form.tags)
      fd.append('color', form.color)
      fd.append('sort_order', String(form.sort_order))
      fd.append('is_free', isFree.value ? '1' : '0')

      await post('/admin/materials', fd)
    }

    emit('saved')
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>
