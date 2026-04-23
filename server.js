import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import config from './config.js'
import { initDatabase } from './database.js'

// 导入路由
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import materialRoutes from './routes/materials.js'
import draftRoutes from './routes/drafts.js'
import adminRoutes from './routes/admin.js'
import paymentRoutes from './routes/payment.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function start() {
  // 初始化数据库
  await initDatabase()

  // 确保目录存在
  fs.mkdirSync(config.materialsDir, { recursive: true })
  fs.mkdirSync(config.draftsDir, { recursive: true })

  const app = express()

  // 中间件
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? true
      : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    credentials: true,
  }))
  app.use(express.json({ limit: '20mb' }))
  app.use(express.urlencoded({ extended: true }))

  // 静态文件服务 — 上传文件
  app.use('/uploads', express.static(config.uploadDir))

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

  // 用户前端静态文件
  app.use(express.static(path.join(__dirname, 'public/client')))

  // 管理后台静态文件
  app.use('/admin', express.static(path.join(__dirname, 'public/admin')))

  // SPA fallback — 管理后台
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'))
  })

  // SPA fallback — 用户前端（放最后）
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(__dirname, 'public/client/index.html'))
    }
  })

  // 全局错误处理
  app.use((err, req, res, next) => {
    console.error('服务器错误:', err)
    res.status(500).json({ error: '服务器内部错误' })
  })

  app.listen(config.port, () => {
    console.log(`🎨 Bitté 后端服务已启动: http://localhost:${config.port}`)
    console.log(`📁 上传目录: ${config.uploadDir}`)
    console.log(`🗄️  数据库: PostgreSQL`)
  })
}

start().catch((err) => {
  console.error('启动失败:', err)
  process.exit(1)
})
