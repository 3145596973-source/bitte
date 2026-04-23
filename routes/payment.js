import { Router } from 'express'
import pool from '../database.js'
import auth from '../middleware/auth.js'

const router = Router()

// 生成订单号：BT + yyyyMMddHHmmss + 3位随机数
function generateOrderNo() {
  const now = new Date()
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `BT${dateStr}${rand}`
}

// GET /api/plans — 获取所有活跃套餐（公开接口）
router.get('/plans', async (req, res) => {
  try {
    const { rows: plans } = await pool.query('SELECT * FROM plans WHERE is_active = 1 ORDER BY price ASC')
    res.json({ plans })
  } catch (err) {
    console.error('获取套餐失败:', err)
    res.status(500).json({ error: '获取套餐失败' })
  }
})

// POST /api/orders/create — 创建订单（需认证）
router.post('/orders/create', auth, async (req, res) => {
  try {
    const { plan_id } = req.body
    if (!plan_id) {
      return res.status(400).json({ error: '请选择套餐' })
    }

    const { rows: planRows } = await pool.query('SELECT * FROM plans WHERE id = $1 AND is_active = 1', [plan_id])
    const plan = planRows[0]
    if (!plan) {
      return res.status(400).json({ error: '套餐不存在或已下架' })
    }

    const orderNo = generateOrderNo()
    const { rows } = await pool.query(
      `INSERT INTO orders (order_no, user_id, plan_id, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [orderNo, req.userId, plan.id, plan.price]
    )

    res.json({ order: rows[0] })
  } catch (err) {
    console.error('创建订单失败:', err)
    res.status(500).json({ error: '创建订单失败' })
  }
})

// POST /api/orders/:orderNo/pay — 模拟支付（需认证）
router.post('/orders/:orderNo/pay', auth, async (req, res) => {
  try {
    const { rows: orderRows } = await pool.query(
      'SELECT * FROM orders WHERE order_no = $1 AND user_id = $2',
      [req.params.orderNo, req.userId]
    )
    const order = orderRows[0]

    if (!order) {
      return res.status(404).json({ error: '订单不存在' })
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态不允许支付' })
    }

    const { rows: planRows } = await pool.query('SELECT * FROM plans WHERE id = $1', [order.plan_id])
    const plan = planRows[0]
    if (!plan) {
      return res.status(400).json({ error: '套餐信息异常' })
    }

    // TODO: 接入真实支付（微信/支付宝）
    const paidAt = new Date().toISOString()

    // 计算 VIP 到期时间：如果当前是 VIP 且未过期，在现有基础上续期；否则从现在开始计算
    const { rows: userRows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId])
    const user = userRows[0]
    let baseDate = new Date()
    if (user.is_vip === 1 && user.vip_expires_at) {
      const existingExpiry = new Date(user.vip_expires_at)
      if (existingExpiry > baseDate) {
        baseDate = existingExpiry
      }
    }
    const expiresAt = new Date(baseDate.getTime() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString()

    // 更新订单
    await pool.query(
      "UPDATE orders SET status = 'paid', pay_method = 'mock', paid_at = $1 WHERE id = $2",
      [paidAt, order.id]
    )

    // 更新用户 VIP 状态
    await pool.query(
      'UPDATE users SET is_vip = 1, vip_expires_at = $1, updated_at = NOW() WHERE id = $2',
      [expiresAt, req.userId]
    )

    const { rows: updatedOrder } = await pool.query('SELECT * FROM orders WHERE id = $1', [order.id])
    res.json({ order: updatedOrder[0], vip_expires_at: expiresAt })
  } catch (err) {
    console.error('支付失败:', err)
    res.status(500).json({ error: '支付失败' })
  }
})

// GET /api/orders/my — 我的订单列表（需认证）
router.get('/orders/my', auth, async (req, res) => {
  try {
    const { rows: orders } = await pool.query(`
      SELECT o.*, p.name AS plan_name, p.duration_days
      FROM orders o
      LEFT JOIN plans p ON o.plan_id = p.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [req.userId])

    res.json({ orders })
  } catch (err) {
    console.error('获取订单列表失败:', err)
    res.status(500).json({ error: '获取订单列表失败' })
  }
})

// POST /api/orders/:orderNo/cancel — 取消订单（需认证，仅 pending 可取消）
router.post('/orders/:orderNo/cancel', auth, async (req, res) => {
  try {
    const { rows: orderRows } = await pool.query(
      'SELECT * FROM orders WHERE order_no = $1 AND user_id = $2',
      [req.params.orderNo, req.userId]
    )
    const order = orderRows[0]

    if (!order) {
      return res.status(404).json({ error: '订单不存在' })
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '仅待支付订单可取消' })
    }

    const { rows } = await pool.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *",
      [order.id]
    )

    res.json({ order: rows[0] })
  } catch (err) {
    console.error('取消订单失败:', err)
    res.status(500).json({ error: '取消订单失败' })
  }
})

export default router
