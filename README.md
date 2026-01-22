# 宝宝日记 Baby Care Tracker

一个简单易用的婴儿护理记录应用，专为月嫂阿姨和家长设计。

## 📱 设计理念

**Mobile-First** - 主要用户使用手机记录，PC 端限制宽度保持手机比例。

## 功能

- 🌙 **睡眠** - 入睡/睡醒记录
- 🍼 **喂奶** - 亲喂/瓶喂，时长和奶量
- 🧒 **换尿布** - 大小便记录
- 🎯 **活动** - 被动操、排气操、洗澡、户外、早教

> 详细功能规格见 `.cursor/rules/features/`

## 技术栈

- Next.js 16 + Tailwind CSS 4
- PostgreSQL + Prisma ORM
- Vercel (Blob Storage + 部署)

## 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 添加数据库连接

# 初始化数据库
pnpm db:push

# 运行开发服务器
pnpm dev
```

## 部署到 Vercel

### 数据库迁移

当修改了 Prisma schema 后，需要在生产环境运行迁移：

```bash
# 方法 1: 使用脚本（推荐）
pnpm db:migrate:prod

# 方法 2: 手动操作
# 1. 从 Vercel 拉取环境变量
vercel env pull .env.production

# 2. 设置环境变量并运行迁移
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-)
export DATABASE_URL_UNPOOLED=$(grep DATABASE_URL_UNPOOLED .env.production | cut -d '=' -f2-)
pnpm prisma db push

# 3. 清理临时文件
rm .env.production
```

**注意**: 确保已安装并登录 Vercel CLI: `pnpm add -g vercel && vercel login`

## 访问地址

- 🌐 https://bubu.sunmer.xyz
- 🔗 https://bubu-log.vercel.app

## License

MIT
