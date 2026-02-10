/**
 * 修复脚本：恢复被批量修改日期错误修改的换尿布活动
 * 
 * 查询所有"批量修改日期"的换尿布活动审计日志，
 * 根据 beforeData 中记录的原始时间，将活动恢复到正确的日期
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ActivityData {
  id: string
  type: string
  startTime: string
  endTime: string | null
}

async function main() {
  console.log('🔍 查询批量修改日期的换尿布活动审计日志...\n')

  // 查询所有批量修改日期的审计日志
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: 'UPDATE',
      resourceType: 'ACTIVITY',
      description: {
        startsWith: '批量修改日期',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  console.log(`找到 ${auditLogs.length} 条批量修改日期的审计日志\n`)

  // 过滤出换尿布活动
  const diaperLogs = auditLogs.filter(log => {
    const beforeData = log.beforeData as ActivityData | null
    return beforeData?.type === 'DIAPER'
  })

  console.log(`其中 ${diaperLogs.length} 条是换尿布活动\n`)

  if (diaperLogs.length === 0) {
    console.log('没有需要恢复的换尿布活动')
    return
  }

  // 按活动ID分组，只保留每个活动的第一条（最早的）修改记录
  // 这样可以恢复到最原始的状态
  const activityOriginalData = new Map<string, ActivityData>()
  
  // 从最旧到最新遍历，保留最早的 beforeData
  for (const log of [...diaperLogs].reverse()) {
    const beforeData = log.beforeData as ActivityData | null
    if (beforeData && !activityOriginalData.has(beforeData.id)) {
      activityOriginalData.set(beforeData.id, beforeData)
    }
  }

  console.log(`需要恢复 ${activityOriginalData.size} 个换尿布活动\n`)
  console.log('准备恢复的活动：')
  console.log('---')

  let restoredCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const [activityId, originalData] of activityOriginalData) {
    try {
      // 检查活动是否还存在
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
      })

      if (!activity) {
        console.log(`⚠️  活动 ${activityId} 已被删除，跳过`)
        skippedCount++
        continue
      }

      const originalStartTime = new Date(originalData.startTime)
      const currentStartTime = new Date(activity.startTime)

      // 检查是否需要恢复（日期是否不同）
      if (originalStartTime.getTime() === currentStartTime.getTime()) {
        console.log(`✓  活动 ${activityId} 时间未变，跳过`)
        skippedCount++
        continue
      }

      console.log(`🔄 恢复活动 ${activityId}:`)
      console.log(`   当前时间: ${currentStartTime.toLocaleString('zh-CN')}`)
      console.log(`   原始时间: ${originalStartTime.toLocaleString('zh-CN')}`)

      // 恢复原始时间
      await prisma.activity.update({
        where: { id: activityId },
        data: {
          startTime: originalStartTime,
          endTime: originalStartTime, // 同时设置 endTime
        },
      })

      console.log(`   ✅ 已恢复`)
      restoredCount++
    } catch (error) {
      console.error(`❌ 恢复活动 ${activityId} 失败:`, error)
      errorCount++
    }
  }

  console.log('\n---')
  console.log(`\n📊 恢复结果:`)
  console.log(`   ✅ 成功恢复: ${restoredCount}`)
  console.log(`   ⏭️  跳过: ${skippedCount}`)
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
