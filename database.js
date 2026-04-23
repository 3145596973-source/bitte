import pg from 'pg'
import bcrypt from 'bcryptjs'
import config from './config.js'

const { Pool } = pg

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function initDatabase() {
  // 建表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      nickname TEXT DEFAULT '新用户',
      avatar TEXT DEFAULT '',
      is_vip INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      is_banned INTEGER DEFAULT 0,
      vip_expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      mime_type TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS recommended_materials (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      tags TEXT DEFAULT '',
      is_free INTEGER DEFAULT 1,
      color TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS drafts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT DEFAULT '未命名草稿',
      canvas_json TEXT NOT NULL,
      thumbnail TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS plans (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price INTEGER NOT NULL,
      duration_days INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      plan_id INTEGER NOT NULL REFERENCES plans(id),
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_method TEXT DEFAULT '',
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)

  // 初始化管理员账号（仅在不存在时创建）
  const hashedPassword = bcrypt.hashSync('admin123', 10)
  await pool.query(
    `INSERT INTO users (email, password, nickname, is_admin)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ['admin@bitte.com', hashedPassword, '管理员', 1]
  )
  console.log('✅ 管理员账号就绪: admin@bitte.com / admin123')

  // 初始化推荐素材（仅在表为空时插入）
  const materialCount = (await pool.query('SELECT COUNT(*) AS cnt FROM recommended_materials')).rows[0].cnt
  if (parseInt(materialCount, 10) === 0) {
    const seedData = [
      { name: '粉色卡片', filename: 'pink-card.png', file_path: '', tags: '粉色,卡片,浪漫,pink', is_free: 1, color: '#ffd6e0', sort_order: 1 },
      { name: '天蓝方块', filename: 'sky-blue.png', file_path: '', tags: '蓝色,天空,清新,blue', is_free: 1, color: '#d0f0fd', sort_order: 2 },
      { name: '橙色暖光', filename: 'orange-warm.png', file_path: '', tags: '橙色,温暖,暖色,orange', is_free: 1, color: '#ffe8cc', sort_order: 3 },
      { name: '紫色梦幻', filename: 'purple-dream.png', file_path: '', tags: '紫色,梦幻,神秘,purple', is_free: 1, color: '#e8dff5', sort_order: 4 },
      { name: '浅粉甜心', filename: 'sweet-pink.png', file_path: '', tags: '粉色,甜心,可爱,sweet', is_free: 1, color: '#fce4ec', sort_order: 5 },
      { name: '薄荷绿叶', filename: 'mint-green.png', file_path: '', tags: '绿色,自然,清新,green', is_free: 1, color: '#c8e6c9', sort_order: 6 },
      { name: '柠檬黄', filename: 'lemon-yellow.png', file_path: '', tags: '黄色,明亮,活力,yellow', is_free: 1, color: '#fff9c4', sort_order: 7 },
      { name: '玫瑰粉', filename: 'rose-pink.png', file_path: '', tags: '玫瑰,粉红,花,rose', is_free: 1, color: '#f8bbd0', sort_order: 8 },
      { name: '冰蓝水晶', filename: 'ice-blue.png', file_path: '', tags: '蓝色,冰,水晶,ice', is_free: 1, color: '#b3e5fc', sort_order: 9 },
      { name: '草地绿', filename: 'grass-green.png', file_path: '', tags: '绿色,草地,春天,grass', is_free: 1, color: '#dcedc8', sort_order: 10 },
      { name: '珊瑚橘', filename: 'coral-orange.png', file_path: '', tags: '珊瑚,橘色,暖,coral', is_free: 1, color: '#ffccbc', sort_order: 11 },
      { name: '薰衣草紫', filename: 'lavender.png', file_path: '', tags: '薰衣草,紫色,优雅,lavender', is_free: 1, color: '#d1c4e9', sort_order: 12 },
    ]

    for (const item of seedData) {
      await pool.query(
        `INSERT INTO recommended_materials (name, filename, file_path, tags, is_free, color, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [item.name, item.filename, item.file_path, item.tags, item.is_free, item.color, item.sort_order]
      )
    }
    console.log('✅ 已插入 12 条推荐素材初始数据')
  }

  // 初始化会员套餐（仅在表为空时插入）
  const planCount = (await pool.query('SELECT COUNT(*) AS cnt FROM plans')).rows[0].cnt
  if (parseInt(planCount, 10) === 0) {
    const planSeed = [
      { name: '月度会员', description: '按月订阅，灵活方便', price: 990, duration_days: 30 },
      { name: '季度会员', description: '季度订阅，更加实惠', price: 2490, duration_days: 90 },
      { name: '年度会员', description: '年度订阅，最划算的选择', price: 7990, duration_days: 365 },
    ]

    for (const plan of planSeed) {
      await pool.query(
        `INSERT INTO plans (name, description, price, duration_days)
         VALUES ($1, $2, $3, $4)`,
        [plan.name, plan.description, plan.price, plan.duration_days]
      )
    }
    console.log('✅ 已插入 3 个会员套餐')
  }
}

export { pool, initDatabase }
export default pool
