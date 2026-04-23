import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import config from '../config.js'
import pool from '../database.js'
import auth from '../middleware/auth.js'

const router = Router()

// multer 配置
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

// 获取我的素材列表
router.get('/', auth, async (req, res) => {
  try {
    const { rows: materials } = await pool.query(
      'SELECT * FROM materials WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    )

    res.json({ materials })
  } catch (err) {
    console.error('获取素材失败:', err)
    res.status(500).json({ error: '获取素材列表失败' })
  }
})

// 上传素材
router.post('/upload', auth, (req, res) => {
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
      const filePath = `/uploads/materials/${req.file.filename}`
      const { rows } = await pool.query(
        `INSERT INTO materials (user_id, filename, original_name, file_path, file_size, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.userId, req.file.filename, req.file.originalname, filePath, req.file.size, req.file.mimetype]
      )

      res.json({ material: rows[0] })
    } catch (dbErr) {
      console.error('保存素材记录失败:', dbErr)
      res.status(500).json({ error: '保存素材记录失败' })
    }
  })
})

// 删除素材
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM materials WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    const material = rows[0]

    if (!material) {
      return res.status(404).json({ error: '素材不存在' })
    }

    // 删除文件
    const fullPath = path.join(config.uploadDir, 'materials', material.filename)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }

    // 删除数据库记录
    await pool.query('DELETE FROM materials WHERE id = $1', [req.params.id])

    res.json({ success: true })
  } catch (err) {
    console.error('删除素材失败:', err)
    res.status(500).json({ error: '删除素材失败' })
  }
})

// 推荐素材（公开接口）
router.get('/recommended', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase()

    let rows
    if (q) {
      const result = await pool.query(
        `SELECT * FROM recommended_materials
         WHERE LOWER(name) LIKE $1 OR LOWER(tags) LIKE $2
         ORDER BY sort_order ASC`,
        [`%${q}%`, `%${q}%`]
      )
      rows = result.rows
    } else {
      const result = await pool.query(
        'SELECT * FROM recommended_materials ORDER BY sort_order ASC'
      )
      rows = result.rows
    }

    res.json({ materials: rows })
  } catch (err) {
    console.error('获取推荐素材失败:', err)
    res.status(500).json({ error: '获取推荐素材列表失败' })
  }
})

export default router
