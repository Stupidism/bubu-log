/**
 * 修复脚本：恢复被批量修改日期错误修改的换尿布活动
 *
 * 查询所有“批量修改日期”的换尿布活动审计日志，
 * 根据 beforeData 中记录的原始时间，将活动恢复到正确日期
 */

import type { ActivityDoc, AuditLogDoc } from '@/lib/payload/models'
import { loadScriptEnv } from './utils/load-env'
import { getPayloadForScript } from './utils/payload-script'

loadScriptEnv({ preferPayloadDatabase: true })

interface ActivityData {
  id: string
  type: string
  startTime: string
  endTime: string | null
}

function isActivityData(value: unknown): value is ActivityData {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<ActivityData>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.startTime === 'string'
  )
}

async function main() {
  const payload = await getPayloadForScript()
  try {
    console.log('🔍 查询批量修改日期的换尿布活动审计日志...\n')

    const auditLogs = await payload.find({
      collection: 'audit-logs',
      where: {
        and: [
          {
            action: {
              equals: 'UPDATE',
            },
          },
          {
            resourceType: {
              equals: 'ACTIVITY',
            },
          },
        ],
      },
      sort: '-createdAt',
      limit: 10000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    const batchDateLogs = (auditLogs.docs as AuditLogDoc[]).filter(
      (log) => typeof log.description === 'string' && log.description.startsWith('批量修改日期')
    )
    console.log(`找到 ${batchDateLogs.length} 条批量修改日期的审计日志\n`)

    const diaperLogs = batchDateLogs.filter((log) => {
      if (!isActivityData(log.beforeData)) {
        return false
      }
      return log.beforeData.type === 'DIAPER'
    })
    console.log(`其中 ${diaperLogs.length} 条是换尿布活动\n`)

    if (diaperLogs.length === 0) {
      console.log('没有需要恢复的换尿布活动')
      return
    }

    const activityOriginalData = new Map<string, ActivityData>()

    for (const log of [...diaperLogs].reverse()) {
      if (!isActivityData(log.beforeData)) {
        continue
      }
      if (!activityOriginalData.has(log.beforeData.id)) {
        activityOriginalData.set(log.beforeData.id, log.beforeData)
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
        const activity = await payload
          .findByID({
            collection: 'activities',
            id: activityId,
            depth: 0,
            overrideAccess: true,
          })
          .catch(() => null)

        if (!activity) {
          console.log(`⚠️  活动 ${activityId} 已被删除，跳过`)
          skippedCount += 1
          continue
        }

        const current = activity as ActivityDoc
        const originalStartTime = new Date(originalData.startTime)
        const currentStartTime = new Date(current.startTime)

        if (Number.isNaN(originalStartTime.getTime())) {
          console.log(`⚠️  活动 ${activityId} 原始时间无效，跳过`)
          skippedCount += 1
          continue
        }

        if (originalStartTime.getTime() === currentStartTime.getTime()) {
          console.log(`✓  活动 ${activityId} 时间未变，跳过`)
          skippedCount += 1
          continue
        }

        console.log(`🔄 恢复活动 ${activityId}:`)
        console.log(`   当前时间: ${currentStartTime.toLocaleString('zh-CN')}`)
        console.log(`   原始时间: ${originalStartTime.toLocaleString('zh-CN')}`)

        await payload.update({
          collection: 'activities',
          id: activityId,
          data: {
            startTime: originalStartTime.toISOString(),
            endTime: originalStartTime.toISOString(),
          },
          depth: 0,
          overrideAccess: true,
        })

        console.log('   ✅ 已恢复')
        restoredCount += 1
      } catch (error) {
        console.error(`❌ 恢复活动 ${activityId} 失败:`, error)
        errorCount += 1
      }
    }

    console.log('\n---')
    console.log('\n📊 恢复结果:')
    console.log(`   ✅ 成功恢复: ${restoredCount}`)
    console.log(`   ⏭️  跳过: ${skippedCount}`)
    console.log(`   ❌ 失败: ${errorCount}`)
  } finally {
    await payload.destroy()
  }
}

main()
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exitCode = 1
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0)
  })
