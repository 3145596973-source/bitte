import express from 'express'
import cors from 'cors'
import { initDatabase } from '../database.js'

// 导入路由
import authRoutes from '../routes/auth.js'
import userRoutes from '../routes/users.js'
import materialRoutes from '../routes/materials.js'
import draftRoutes from '../routes/drafts.js'
import adminRoutes from '../routes/admin.js'
import paymentRoutes from '../routes/payment.js'

const app = express()

// 中间件
app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true }))

// 懒初始化数据库（Serverless 冷启动时只执行一次）
let dbInitialized = false
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDatabase()
      dbInitialized = true
    } catch (err) {
      console.error('数据库初始化失败:', err)
      return res.status(500).json({ error: '服务启动中，请稍后重试' })
    }
  }
  next()
})

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/drafts', draftRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', paymentRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

export default app
