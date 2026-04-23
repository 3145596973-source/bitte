# Bitté 拼贴编辑器

一个在线拼贴画编辑器，支持素材管理、草稿保存、会员系统和管理后台。

## 技术栈

- **前端**：Vue 3 + Vite + Fabric.js
- **管理后台**：Vue 3 + Vite
- **后端**：Node.js + Express
- **数据库**：PostgreSQL
- **部署**：Render.com

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

## 部署到 Render

### 方式一：Blueprint（推荐）

1. 将代码推到 GitHub
2. 在 Render Dashboard 点击 **New** → **Blueprint**
3. 选择仓库，Render 会自动读取 `render.yaml` 创建服务和数据库

### 方式二：手动创建

1. 创建 PostgreSQL 数据库（Free plan）
2. 创建 Web Service，连接 GitHub 仓库
3. 设置：
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = 自定义密钥
     - `DATABASE_URL` = PostgreSQL 连接字符串（从数据库面板复制 Internal URL）

## 管理员账号

首次启动时自动创建：

- **邮箱**：admin@bitte.com
- **密码**：admin123
- **管理后台地址**：`/admin/`

> ⚠️ 请在部署后立即修改管理员密码

## 注意事项

- Render 免费版磁盘不持久化，重启后上传的文件会丢失。生产环境建议接入 Cloudflare R2 或 AWS S3 存储。
- 支付功能当前为模拟支付，接入真实支付需对接微信/支付宝 SDK。
