# 宝宝日记 Baby Care Tracker

一个简单易用的婴儿护理记录应用，专为育儿嫂和家长设计。支持单手操作，界面简洁直观。

## 功能特点

### 📝 录入功能
- **睡眠记录**: 入睡/睡醒交替记录
- **喂奶记录**: 
  - 亲喂：记录时长，支持调整，拍嗝状态
  - 瓶喂：记录奶量(50/100/150ml基准，±10ml微调)，拍嗝状态
- **换尿布**: 大小便记录，大便颜色，小便量
- **日常活动**: 被动操、排气操、洗澡、户外晒太阳、早教

### ⏰ 时间调整
- 默认当前时间
- 快捷调整按钮：±5分钟、±10分钟、±15分钟、±1小时
- 点击时间可重置为当前

### 📊 数据展示
- 每日统计概览
- 详细时间线记录
- 日期切换查看历史

## 技术栈

- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS 4
- **数据库**: PostgreSQL + Prisma ORM
- **部署**: Vercel

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd mom-helper
npm install
```

### 2. 配置数据库

参考 [Vercel 官方指南](https://vercel.com/kb/guide/nextjs-prisma-postgres) 创建 Vercel Postgres 数据库。

创建 `.env` 文件：

```env
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://username:password@host:5432/database?sslmode=require"
```

### 3. 初始化数据库

```bash
npx prisma db push
npx prisma generate
```

### 4. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 部署到 Vercel

### 1. 创建 Vercel 项目

将代码推送到 GitHub，然后在 Vercel 中导入项目。

### 2. 配置 Postgres 数据库

在 Vercel Dashboard > Storage 中创建 Postgres 数据库，环境变量会自动配置。

### 3. 部署

Vercel 会自动部署，每次推送代码都会触发新的部署。

## 自定义域名配置 (bubu.sunmer.xyz)

### DNS 记录配置 (阿里云)

在阿里云 DNS 管理中添加以下 CNAME 记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| **CNAME** | `bubu` | `cname.vercel-dns.com` |

> **注意**: Vercel 推荐使用 `1ea994bd9984f7f2.vercel-dns-017.com`，但 `cname.vercel-dns.com` 同样有效。

### 访问地址

- 🌐 **主域名**: https://bubu.sunmer.xyz
- 🔗 **备用**: https://bubu-log.vercel.app

### Vercel 配置

域名配置在 `vercel.json` 中管理：
- 区域: `sin1` (新加坡，适合亚洲访问)
- 安全头: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── activities/       # API 路由
│   ├── stats/                # 数据展示页面
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主录入页面
├── components/
│   ├── forms/                # 各类表单组件
│   ├── ActivityButton.tsx    # 活动按钮
│   ├── BottomSheet.tsx       # 底部弹出面板
│   ├── TimeAdjuster.tsx      # 时间调整器
│   └── Toast.tsx             # 提示组件
├── lib/
│   └── prisma.ts             # Prisma 客户端
└── types/
    └── activity.ts           # 类型定义
```

## 使用说明

### 对于育儿嫂

1. **单手操作**: 所有按钮都设计得足够大，方便单手点击
2. **时间调整**: 如果忘记及时记录，可以通过时间调整按钮修改时间
3. **配对活动**: 入睡/睡醒、开始喂奶/结束喂奶会自动交替显示

### 录入流程

1. 点击主页面的大按钮选择活动类型
2. 在弹出的表单中确认或调整时间
3. 填写必要信息（如有）
4. 点击确认记录

## License

MIT
