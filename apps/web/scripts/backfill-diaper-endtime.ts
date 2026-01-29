/**
 * Backfill 脚本：为所有换尿布活动设置 endTime = startTime
 * 
 * 换尿布是点事件，没有时长，endTime 应该与 startTime 相同
 * 这样可以避免被跨夜活动查询逻辑误匹配
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 查询所有 endTime 为 null 的换尿布活动...\n')

  // 查询所有 endTime 为 null 的换尿布活动
  const diaperActivities = await prisma.activity.findMany({
    where: {
      type: 'DIAPER',
      endTime: null,
    },
  })

  console.log(`找到 ${diaperActivities.length} 个需要更新的换尿布活动\n`)

  if (diaperActivities.length === 0) {
    console.log('✅ 所有换尿布活动的 endTime 已设置，无需更新')
    return
  }

  // 批量更新
  let updatedCount = 0
  let errorCount = 0

  for (const activity of diaperActivities) {
    try {
      await prisma.activity.update({
        where: { id: activity.id },
        data: {
          endTime: activity.startTime, // 设置 endTime = startTime
        },
      })
      updatedCount++
      
      if (updatedCount % 100 === 0) {
        console.log(`✓ 已更新 ${updatedCount} 个活动...`)
      }
    } catch (error) {
      console.error(`❌ 更新活动 ${activity.id} 失败:`, error)
      errorCount++
    }
  }

  console.log('\n---')
  console.log(`\n📊 Backfill 结果:`)
  console.log(`   ✅ 成功更新: ${updatedCount}`)
  console.log(`   ❌ 失败: ${errorCount}`)
}

main()
  .catch((e) => {
    console.error('❌ 脚本执行失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
