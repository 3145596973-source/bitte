import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Vercel Serverless 环境使用 /tmp 目录（可写但不持久化）
const isVercel = !!process.env.VERCEL
const uploadBase = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads')

export default {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'bitte-secret-key-change-in-production',
  jwtExpiresIn: '7d',
  uploadDir: uploadBase,
  materialsDir: path.join(uploadBase, 'materials'),
  draftsDir: path.join(uploadBase, 'drafts'),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/bitte',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}
