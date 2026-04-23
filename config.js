import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'bitte-secret-key-change-in-production',
  jwtExpiresIn: '7d',
  uploadDir: path.join(__dirname, 'uploads'),
  materialsDir: path.join(__dirname, 'uploads', 'materials'),
  draftsDir: path.join(__dirname, 'uploads', 'drafts'),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/bitte',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}
