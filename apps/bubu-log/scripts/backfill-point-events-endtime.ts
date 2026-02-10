/**
 * Backfill 脚本：为所有点事件活动设置 endTime = startTime
 * 
 * 点事件（没有时长的活动）的 endTime 应该与 startTime 相同
 * 这样可以避免被跨夜活动查询逻辑误匹配
 * 
 * 点事件类型: DIAPER, SUPPLEMENT, SPIT_UP, ROLL_OVER, PULL_TO_SIT
 */

import { PrismaClient, ActivityType } from '@prisma/client'

const prisma = new PrismaClient()

// 点事件类型（没有时长的活动）
const POINT_EVENT_TYPES: ActivityType[] = [
  'DIAPER',
  'SUPPLEMENT',
  'SPIT_UP',
  'ROLL_OVER',
  'PULL_TO_SIT',
]

async function main() {
  console.log('🔍 查询所有 endTime 为 null 的点事件活动...\n')
  console.log(`点事件类型: ${POINT_EVENT_TYPES.join(', ')}\n`)

  // 查询所有 endTime 为 null 的点事件活动
  const activities = await prisma.activity.findMany({
    where: {
      type: { in: POINT_EVENT_TYPES },
      endTime: null,
    },
  })

  console.log(`找到 ${activities.length} 个需要更新的点事件活动\n`)

  if (activities.length === 0) {
    console.log('✅ 所有点事件活动的 endTime 已设置，无需更新')
    return
  }

  // 按类型统计
  const typeCounts: Record<string, number> = {}
  activities.forEach(a => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1
  })
  console.log('按类型统计:')
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`)
  })
  console.log('')

  // 批量更新
  let updatedCount = 0
  let errorCount = 0

  for (const activity of activities) {
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
