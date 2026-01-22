#!/bin/bash

# 生产环境数据库迁移脚本
# 使用方法：
# 1. 确保已安装 Vercel CLI: pnpm add -g vercel
# 2. 运行: bash scripts/migrate-production.sh

echo "🚀 开始生产环境数据库迁移..."

# 检查 Vercel CLI 是否已安装
if ! command -v vercel &> /dev/null; then
    echo "❌ 错误: 未找到 Vercel CLI"
    echo "请先安装: pnpm add -g vercel"
    exit 1
fi

# 从 Vercel 拉取生产环境变量
echo "📥 从 Vercel 拉取环境变量..."
vercel env pull .env.production

# 检查是否成功拉取环境变量
if [ ! -f .env.production ]; then
    echo "❌ 错误: 无法拉取环境变量"
    echo "请确保已登录 Vercel: vercel login"
    exit 1
fi

# 使用生产环境变量运行迁移
echo "🔄 运行数据库迁移..."
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-)
DATABASE_URL_UNPOOLED=$(grep DATABASE_URL_UNPOOLED .env.production | cut -d '=' -f2-)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: 未找到 DATABASE_URL"
    exit 1
fi

# 设置环境变量并运行迁移
export DATABASE_URL
export DATABASE_URL_UNPOOLED
pnpm prisma db push --skip-generate

echo "✅ 数据库迁移完成！"
echo "🧹 清理临时文件..."
rm -f .env.production

echo "✨ 完成！"

