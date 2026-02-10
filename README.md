# 宝宝日记 Monorepo

一个使用 Turborepo 管理的 monorepo，包含宝宝护理记录应用及共享 UI 组件库。

## 📦 项目结构

```
├── apps/
│   └── web/          # 宝宝日记 Next.js 应用
├── packages/
│   ├── ui/           # 共享 UI 组件库 (基于 shadcn/ui)
│   └── typescript-config/  # 共享 TypeScript 配置
```

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 运行所有应用的开发服务器
pnpm dev

# 只运行 web 应用
pnpm dev:web

# 构建所有项目
pnpm build

# 代码检查
pnpm lint
```

## 📱 宝宝日记 (apps/bubu-log)

一个简单易用的婴儿护理记录应用，专为月嫂阿姨和家长设计。

### 功能

- 🌙 **睡眠** - 入睡/睡醒记录
- 🍼 **喂奶** - 亲喂/瓶喂，时长和奶量
- 🧒 **换尿布** - 大小便记录
- 🎯 **活动** - 被动操、排气操、洗澡、户外、早教

> 详细功能规格见 `.cursor/rules/features/`

### 技术栈

- Next.js 16 + Tailwind CSS 4
- PostgreSQL + Prisma ORM
- Vercel (Blob Storage + 部署)
- Turborepo (monorepo 管理)

### 配置

```bash
# 配置环境变量
cp apps/bubu-log/.env.example apps/bubu-log/.env.local
# 编辑 .env.local 添加数据库连接

# 初始化数据库
cd apps/bubu-log && pnpm db:push
```

## 🎨 UI 组件库 (packages/ui)

基于 shadcn/ui 的共享 React 组件库，可在多个应用间复用。

### 使用方式

```tsx
import { Button, cn } from '@bubu-log/ui'
import { Drawer, DrawerContent } from '@bubu-log/ui'
```

## 部署到 Vercel

### 数据库迁移

当修改了 Prisma schema 后，需要在生产环境运行迁移：

```bash
# 方法 1: 使用脚本（推荐）
cd apps/bubu-log && pnpm db:migrate:prod

# 方法 2: 手动操作
# 1. 从 Vercel 拉取环境变量
vercel env pull .env.production

# 2. 设置环境变量并运行迁移
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-)
export DATABASE_URL_UNPOOLED=$(grep DATABASE_URL_UNPOOLED .env.production | cut -d '=' -f2-)
cd apps/bubu-log && pnpm prisma db push

# 3. 清理临时文件
rm .env.production
```

**注意**: 确保已安装并登录 Vercel CLI: `pnpm add -g vercel && vercel login`

## 访问地址

- 🌐 https://bubu.sunmer.xyz
- 🔗 https://bubu-log.vercel.app

## License

MIT
