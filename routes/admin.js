import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import config from '../config.js'
import pool from '../database.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// 所有管理员路由都需要 requireAdmin
router.use(requireAdmin)

// multer 配置（和用户端共享 uploads 目录）
const storage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdirSync(config.materialsDir, { recursive: true })
    cb(null, config.materialsDir)
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname) || '.png'
    const unique = crypto.randomBytes(12).toString('hex')
    cb(null, `${Date.now()}-${unique}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter(req, file, cb) {
    if (config.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件格式，仅支持 jpg/png/gif/webp'))
    }
  },
})

// ==================== 数据概览 ====================

// GET /api/admin/stats — 统计数据
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = (await pool.query('SELECT COUNT(*) AS cnt FROM users WHERE is_admin = 0')).rows[0].cnt
    const todayUsers = (await pool.query(
      "SELECT COUNT(*) AS cnt FROM users WHERE is_admin = 0 AND created_at >= CURRENT_DATE"
    )).rows[0].cnt
    const vipUsers = (await pool.query('SELECT COUNT(*) AS cnt FROM users WHERE is_vip = 1 AND is_admin = 0')).rows[0].cnt
    const totalMaterials = (await pool.query('SELECT COUNT(*) AS cnt FROM materials')).rows[0].cnt
    const totalDrafts = (await pool.query('SELECT COUNT(*) AS cnt FROM drafts')).rows[0].cnt
    const totalRecommended = (await pool.query('SELECT COUNT(*) AS cnt FROM recommended_materials')).rows[0].cnt

    const totalOrders = (await pool.query("SELECT COUNT(*) AS cnt FROM orders WHERE status = 'paid'")).rows[0].cnt
    const totalRevenue = (await pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'paid'")).rows[0].total
    const todayRevenue = (await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'paid' AND paid_at >= CURRENT_DATE"
    )).rows[0].total

    res.json({
      totalUsers: parseInt(totalUsers, 10),
      todayUsers: parseInt(todayUsers, 10),
      vipUsers: parseInt(vipUsers, 10),
      totalMaterials: parseInt(totalMaterials, 10),
      totalDrafts: parseInt(totalDrafts, 10),
      totalRecommended: parseInt(totalRecommended, 10),
      totalOrders: parseInt(totalOrders, 10),
      totalRevenue: parseInt(totalRevenue, 10),
      todayRevenue: parseInt(todayRevenue, 10),
    })
  } catch (err) {
    console.error('获取统计数据失败:', err)
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

// ==================== 素材管理 ====================

// GET /api/admin/materials — 推荐素材列表
router.get('/materials', async (req, res) => {
  try {
    const { rows: materials } = await pool.query(
      'SELECT * FROM recommended_materials ORDER BY sort_order ASC, id DESC'
    )

    res.json({ materials })
  } catch (err) {
    console.error('获取推荐素材失败:', err)
    res.status(500).json({ error: '获取推荐素材列表失败' })
  }
})

// POST /api/admin/materials — 上传新推荐素材
router.post('/materials', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: '文件大小不能超过 10MB' })
        }
        return res.status(400).json({ error: '上传失败：' + err.message })
      }
      return res.status(400).json({ error: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' })
    }

    try {
      const { name, tags, is_free, color, sort_order } = req.body
      const filePath = `/uploads/materials/${req.file.filename}`

      const { rows } = await pool.query(
        `INSERT INTO recommended_materials (name, filename, file_path, tags, is_free, color, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          name || req.file.originalname,
          req.file.filename,
          filePath,
          tags || '',
          is_free !== undefined ? Number(is_free) : 1,
          color || '',
          sort_order !== undefined ? Number(sort_order) : 0,
        ]
      )

      res.json({ material: rows[0] })
    } catch (dbErr) {
      console.error('保存推荐素材失败:', dbErr)
      res.status(500).json({ error: '保存推荐素材失败' })
    }
  })
})

// PUT /api/admin/materials/:id — 编辑素材信息
router.put('/materials/:id', async (req, res) => {
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM recommended_materials WHERE id = $1', [req.params.id])
    if (existingRows.length === 0) {
      return res.status(404).json({ error: '素材不存在' })
    }

    const { name, tags, is_free, color, sort_order } = req.body
    const updates = []
    const values = []
    let paramIndex = 1

    if (name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(name) }
    if (tags !== undefined) { updates.push(`tags = $${paramIndex++}`); values.push(tags) }
    if (is_free !== undefined) { updates.push(`is_free = $${paramIndex++}`); values.push(Number(is_free)) }
    if (color !== undefined) { updates.push(`color = $${paramIndex++}`); values.push(color) }
    if (sort_order !== undefined) { updates.push(`sort_order = $${paramIndex++}`); values.push(Number(sort_order)) }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' })
    }

    values.push(req.params.id)
    const { rows } = await pool.query(
      `UPDATE recommended_materials SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    res.json({ material: rows[0] })
  } catch (err) {
    console.error('编辑素材失败:', err)
    res.status(500).json({ error: '编辑素材失败' })
  }
})

// DELETE /api/admin/materials/:id — 删除推荐素材
router.delete('/materials/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM recommended_materials WHERE id = $1', [req.params.id])
    const material = rows[0]
    if (!material) {
      return res.status(404).json({ error: '素材不存在' })
    }

    // 删除文件
    if (material.filename) {
      const fullPath = path.join(config.materialsDir, material.filename)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    }

    await pool.query('DELETE FROM recommended_materials WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error('删除素材失败:', err)
    res.status(500).json({ error: '删除素材失败' })
  }
})

// PUT /api/admin/materials/:id/sort — 调整排序
router.put('/materials/:id/sort', async (req, res) => {
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM recommended_materials WHERE id = $1', [req.params.id])
    if (existingRows.length === 0) {
      return res.status(404).json({ error: '素材不存在' })
    }

    const { sort_order } = req.body
    if (sort_order === undefined) {
      return res.status(400).json({ error: '请提供 sort_order' })
    }

    const { rows } = await pool.query(
      'UPDATE recommended_materials SET sort_order = $1 WHERE id = $2 RETURNING *',
      [Number(sort_order), req.params.id]
    )

    res.json({ material: rows[0] })
  } catch (err) {
    console.error('调整排序失败:', err)
    res.status(500).json({ error: '调整排序失败' })
  }
})

// ==================== 用户管理 ====================

// GET /api/admin/users — 用户列表（分页 + 搜索）
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
    const offset = (page - 1) * limit
    const q = (req.query.q || '').trim().toLowerCase()

    let whereClause = 'WHERE is_admin = 0'
    const countParams = []
    const queryParams = []
    let paramIndex = 1

    if (q) {
      whereClause += ` AND (LOWER(email) LIKE $${paramIndex} OR LOWER(nickname) LIKE $${paramIndex + 1})`
      countParams.push(`%${q}%`, `%${q}%`)
      queryParams.push(`%${q}%`, `%${q}%`)
      paramIndex += 2
    }

    const totalResult = await pool.query(`SELECT COUNT(*) AS cnt FROM users ${whereClause}`, countParams)
    const total = parseInt(totalResult.rows[0].cnt, 10)

    queryParams.push(limit, offset)
    const { rows: users } = await pool.query(
      `SELECT id, email, nickname, avatar, is_vip, is_banned, vip_expires_at, created_at, updated_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    )

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('获取用户列表失败:', err)
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

// GET /api/admin/users/:id — 用户详情
router.get('/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, nickname, avatar, is_vip, is_banned, vip_expires_at, created_at, updated_at FROM users WHERE id = $1',
      [req.params.id]
    )
    const user = rows[0]

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    const materialResult = await pool.query('SELECT COUNT(*) AS cnt FROM materials WHERE user_id = $1', [req.params.id])
    const materialCount = parseInt(materialResult.rows[0].cnt, 10)

    const draftResult = await pool.query('SELECT COUNT(*) AS cnt FROM drafts WHERE user_id = $1', [req.params.id])
    const draftCount = parseInt(draftResult.rows[0].cnt, 10)

    res.json({
      user: {
        ...user,
        materialCount,
        draftCount,
      },
    })
  } catch (err) {
    console.error('获取用户详情失败:', err)
    res.status(500).json({ error: '获取用户详情失败' })
  }
})

// PUT /api/admin/users/:id/ban — 封禁/解封用户
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, is_banned FROM users WHERE id = $1', [req.params.id])
    const user = rows[0]
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    const newStatus = user.is_banned === 1 ? 0 : 1
    await pool.query('UPDATE users SET is_banned = $1, updated_at = NOW() WHERE id = $2', [newStatus, req.params.id])

    const { rows: updatedRows } = await pool.query(
      'SELECT id, email, nickname, avatar, is_vip, is_banned, vip_expires_at, created_at, updated_at FROM users WHERE id = $1',
      [req.params.id]
    )

    res.json({ user: updatedRows[0] })
  } catch (err) {
    console.error('封禁/解封用户失败:', err)
    res.status(500).json({ error: '操作失败' })
  }
})

// PUT /api/admin/users/:id/vip — 设置/取消 VIP
router.put('/users/:id/vip', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, is_vip FROM users WHERE id = $1', [req.params.id])
    const user = rows[0]
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    const newStatus = user.is_vip === 1 ? 0 : 1
    await pool.query('UPDATE users SET is_vip = $1, updated_at = NOW() WHERE id = $2', [newStatus, req.params.id])

    const { rows: updatedRows } = await pool.query(
      'SELECT id, email, nickname, avatar, is_vip, is_banned, vip_expires_at, created_at, updated_at FROM users WHERE id = $1',
      [req.params.id]
    )

    res.json({ user: updatedRows[0] })
  } catch (err) {
    console.error('设置 VIP 失败:', err)
    res.status(500).json({ error: '操作失败' })
  }
})

// ==================== 订单管理 ====================

// GET /api/admin/orders — 所有订单列表（分页 + 状态筛选）
router.get('/orders', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
    const offset = (page - 1) * limit
    const status = (req.query.status || '').trim()

    let whereClause = ''
    const countParams = []
    const queryParams = []
    let paramIndex = 1

    if (status) {
      whereClause = `WHERE o.status = $${paramIndex}`
      countParams.push(status)
      queryParams.push(status)
      paramIndex++
    }

    const totalResult = await pool.query(
      `SELECT COUNT(*) AS cnt FROM orders o ${whereClause}`,
      countParams
    )
    const total = parseInt(totalResult.rows[0].cnt, 10)

    queryParams.push(limit, offset)
    const { rows: orders } = await pool.query(`
      SELECT o.*, u.nickname AS user_nickname, u.email AS user_email, p.name AS plan_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN plans p ON o.plan_id = p.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, queryParams)

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('获取订单列表失败:', err)
    res.status(500).json({ error: '获取订单列表失败' })
  }
})

// GET /api/admin/revenue — 收入统计
router.get('/revenue', async (req, res) => {
  try {
    const todayRevenue = (await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'paid' AND paid_at >= CURRENT_DATE"
    )).rows[0].total
    const monthRevenue = (await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'paid' AND paid_at >= date_trunc('month', CURRENT_DATE)"
    )).rows[0].total
    const totalRevenue = (await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'paid'"
    )).rows[0].total
    const totalOrders = (await pool.query(
      "SELECT COUNT(*) AS cnt FROM orders WHERE status = 'paid'"
    )).rows[0].cnt
    const paidUsers = (await pool.query(
      "SELECT COUNT(DISTINCT user_id) AS cnt FROM orders WHERE status = 'paid'"
    )).rows[0].cnt

    res.json({
      todayRevenue: parseInt(todayRevenue, 10),
      monthRevenue: parseInt(monthRevenue, 10),
      totalRevenue: parseInt(totalRevenue, 10),
      totalOrders: parseInt(totalOrders, 10),
      paidUsers: parseInt(paidUsers, 10),
    })
  } catch (err) {
    console.error('获取收入统计失败:', err)
    res.status(500).json({ error: '获取收入统计失败' })
  }
})

export default router
