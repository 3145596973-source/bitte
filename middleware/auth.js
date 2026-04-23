import jwt from 'jsonwebtoken'
import config from '../config.js'
import pool from '../database.js'

export default function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' })
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Token 无效或已过期，请重新登录' })
  }
}

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' })
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.userId = decoded.userId

    // 检查是否为管理员
    const { rows } = await pool.query('SELECT is_admin FROM users WHERE id = $1', [decoded.userId])
    const user = rows[0]
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ error: '无管理员权限' })
    }

    next()
  } catch {
    return res.status(401).json({ error: 'Token 无效或已过期，请重新登录' })
  }
}
