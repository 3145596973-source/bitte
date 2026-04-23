# Bitté 拼贴编辑器

一个在线拼贴画编辑器，支持素材管理、草稿保存、会员系统和管理后台。

## 技术栈

- **前端**：Vue 3 + Vite + Fabric.js
- **管理后台**：Vue 3 + Vite
- **后端**：Node.js + Express（Vercel Serverless Functions）
- **数据库**：PostgreSQL（推荐 Neon 或 Supabase 免费方案）
- **部署**：Vercel

## 本地开发

### 1. 准备 PostgreSQL

确保本地已安装 PostgreSQL，创建数据库：

```bash
createdb bitte
```

### 2. 启动后端

```bash
npm install
npm run dev
```

后端运行在 `http://localhost:3001`

### 3. 启动用户前端

```bash
cd client
npm install
npm run dev
```

前端运行在 `http://localhost:5173`

### 4. 启动管理后台

```bash
cd admin
npm install
npm run dev
```

管理后台运行在 `http://localhost:5174`

## 部署到 Vercel

### 1. 准备 PostgreSQL 数据库

推荐使用以下免费方案之一：

- **Neon**（https://neon.tech）— 免费 0.5GB，Vercel 原生集成
- **Supabase**（https://supabase.com）— 免费 500MB
- **ElephantSQL**（https://www.elephantsql.com）— 免费 20MB

创建数据库后，复制连接字符串（格式如 `postgresql://user:pass@host/dbname?sslmode=require`）。

### 2. 部署步骤

1. 将代码推到 GitHub 仓库
2. 登录 [Vercel](https://vercel.com)，点击 **New Project**
3. 导入 GitHub 仓库
4. Vercel 会自动检测 `vercel.json` 配置，无需手动设置 Build/Output
5. 在 **Environment Variables** 中添加：
   - `DATABASE_URL` = 你的 PostgreSQL 连接字符串
   - `JWT_SECRET` = 自定义密钥（如 `my-super-secret-key-123`）
   - `NODE_ENV` = `production`
6. 点击 **Deploy**

### 3. 部署后验证

- 访问 `https://你的域名.vercel.app/` — 用户前端
- 访问 `https://你的域名.vercel.app/admin/` — 管理后台
- 访问 `https://你的域名.vercel.app/api/health` — API 健康检查

## 项目结构

```
bitte-deploy/
├── api/                    # Vercel Serverless Functions 入口
│   └── index.js            # Express app 导出为 serverless function
├── client/                 # 用户前端 Vue 源码
├── admin/                  # 管理后台 Vue 源码
├── routes/                 # API 路由模块
│   ├── auth.js
│   ├── materials.js
│   ├── drafts.js
│   ├── users.js
│   ├── admin.js
│   └── payment.js
├── middleware/
│   └── auth.js             # JWT 认证中间件
├── database.js             # PostgreSQL 连接与初始化
├── config.js               # 配置项
├── server.js               # 本地开发入口
├── vercel.json             # Vercel 部署配置
└── package.json
```

## 管理员账号

首次启动时自动创建：

- **邮箱**：admin@bitte.com
- **密码**：admin123
- **管理后台地址**：`/admin/`

> ⚠️ 请在部署后立即修改管理员密码

## 注意事项

- **文件上传**：Vercel Serverless 环境使用 `/tmp` 临时目录，函数冷启动后上传文件会丢失。生产环境建议接入 Vercel Blob、Cloudflare R2 或 AWS S3 云存储。
- **数据库**：务必在 Vercel 环境变量中配置 `DATABASE_URL`，推荐使用带 SSL 的连接字符串。
- **支付功能**：当前为模拟支付，接入真实支付需对接微信/支付宝 SDK。
- **冷启动**：首次请求可能需要几秒钟初始化数据库连接，后续请求会复用连接。
