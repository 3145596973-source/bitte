import { Router } from 'express'
import pool from '../database.js'
import auth from '../middleware/auth.js'

const router = Router()

// 获取我的草稿列表
router.get('/', auth, async (req, res) => {
  try {
    const { rows: drafts } = await pool.query(
      'SELECT id, user_id, name, thumbnail, created_at, updated_at FROM drafts WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.userId]
    )

    res.json({ drafts })
  } catch (err) {
    console.error('获取草稿失败:', err)
    res.status(500).json({ error: '获取草稿列表失败' })
  }
})

// 获取单个草稿（含 canvas_json）
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM drafts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    const draft = rows[0]

    if (!draft) {
      return res.status(404).json({ error: '草稿不存在' })
    }

    res.json({ draft })
  } catch (err) {
    console.error('获取草稿失败:', err)
    res.status(500).json({ error: '获取草稿失败' })
  }
})

// 保存新草稿
router.post('/', auth, async (req, res) => {
  try {
    const { name, canvas_json, thumbnail } = req.body

    if (!canvas_json) {
      return res.status(400).json({ error: '画布数据不能为空' })
    }

    const { rows } = await pool.query(
      `INSERT INTO drafts (user_id, name, canvas_json, thumbnail)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, name || '未命名草稿', canvas_json, thumbnail || '']
    )

    res.json({ draft: rows[0] })
  } catch (err) {
    console.error('保存草稿失败:', err)
    res.status(500).json({ error: '保存草稿失败' })
  }
})

// 更新草稿
router.put('/:id', auth, async (req, res) => {
  try {
    const { rows: existingRows } = await pool.query(
      'SELECT * FROM drafts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )

    if (existingRows.length === 0) {
      return res.status(404).json({ error: '草稿不存在' })
    }

    const { name, canvas_json, thumbnail } = req.body
    const updates = []
    const values = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(name)
    }
    if (canvas_json !== undefined) {
      updates.push(`canvas_json = $${paramIndex++}`)
      values.push(canvas_json)
    }
    if (thumbnail !== undefined) {
      updates.push(`thumbnail = $${paramIndex++}`)
      values.push(thumbnail)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' })
    }

    updates.push(`updated_at = NOW()`)
    values.push(req.params.id)

    const { rows } = await pool.query(
      `UPDATE drafts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    res.json({ draft: rows[0] })
  } catch (err) {
    console.error('更新草稿失败:', err)
    res.status(500).json({ error: '更新草稿失败' })
  }
})

// 删除草稿
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM drafts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '草稿不存在' })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('删除草稿失败:', err)
    res.status(500).json({ error: '删除草稿失败' })
  }
})

export default router
