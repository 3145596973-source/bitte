import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from '../config.js'
import pool from '../database.js'
import auth from '../middleware/auth.js'

const router = Router()

// 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少 6 位' })
    }

    // 检查邮箱是否已存在
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.length > 0) {
      return res.status(400).json({ error: '该邮箱已注册' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const { rows } = await pool.query(
      `INSERT INTO users (email, password, nickname)
       VALUES ($1, $2, $3)
       RETURNING id, email, nickname, avatar, is_vip, is_admin, is_banned, vip_expires_at, created_at`,
      [email, hashedPassword, nickname || '新用户']
    )
    const user = rows[0]

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    })

    res.json({ token, user })
  } catch (err) {
    console.error('注册失败:', err)
    res.status(500).json({ error: '注册失败，请稍后再试' })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' })
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = rows[0]
    if (!user) {
      return res.status(400).json({ error: '邮箱或密码错误' })
    }

    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) {
      return res.status(400).json({ error: '邮箱或密码错误' })
    }

    // 检查是否被封禁
    if (user.is_banned === 1) {
      return res.status(403).json({ error: '该账号已被封禁，请联系管理员' })
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    })

    // 不返回密码字段
    const { password: _, ...safeUser } = user

    res.json({ token, user: safeUser })
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json({ error: '登录失败，请稍后再试' })
  }
})

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, nickname, avatar, is_vip, vip_expires_at, created_at FROM users WHERE id = $1',
      [req.userId]
    )
    const user = rows[0]

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 检查 VIP 是否已过期，如果过期则自动清除
    if (user.is_vip === 1 && user.vip_expires_at) {
      const expiresAt = new Date(user.vip_expires_at)
      if (expiresAt <= new Date()) {
        await pool.query('UPDATE users SET is_vip = 0, updated_at = NOW() WHERE id = $1', [req.userId])
        user.is_vip = 0
      }
    }

    res.json({ user })
  } catch (err) {
    console.error('获取用户信息失败:', err)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

export default router
