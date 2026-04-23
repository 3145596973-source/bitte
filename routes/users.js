import { Router } from 'express'
import pool from '../database.js'
import auth from '../middleware/auth.js'

const router = Router()

// 获取用户信息
router.get('/profile', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, nickname, avatar, is_vip, vip_expires_at, created_at FROM users WHERE id = $1',
      [req.userId]
    )
    const user = rows[0]

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 统计草稿数
    const draftResult = await pool.query('SELECT COUNT(*) AS cnt FROM drafts WHERE user_id = $1', [req.userId])
    const draftCount = parseInt(draftResult.rows[0].cnt, 10)

    // 统计素材数
    const materialResult = await pool.query('SELECT COUNT(*) AS cnt FROM materials WHERE user_id = $1', [req.userId])
    const materialCount = parseInt(materialResult.rows[0].cnt, 10)

    res.json({
      user: {
        ...user,
        draftCount,
        materialCount,
      },
    })
  } catch (err) {
    console.error('获取用户信息失败:', err)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

// 更新用户信息
router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname, avatar } = req.body
    const updates = []
    const values = []
    let paramIndex = 1

    if (nickname !== undefined) {
      updates.push(`nickname = $${paramIndex++}`)
      values.push(nickname)
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramIndex++}`)
      values.push(avatar)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' })
    }

    updates.push(`updated_at = NOW()`)
    values.push(req.userId)

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    const { rows } = await pool.query(
      'SELECT id, email, nickname, avatar, is_vip, vip_expires_at, created_at FROM users WHERE id = $1',
      [req.userId]
    )

    res.json({ user: rows[0] })
  } catch (err) {
    console.error('更新用户信息失败:', err)
    res.status(500).json({ error: '更新用户信息失败' })
  }
})

export default router
