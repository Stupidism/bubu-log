/**
 * Backfill 脚本：为所有点事件活动设置 endTime = startTime
 *
 * 点事件（没有时长的活动）的 endTime 应该与 startTime 相同
 * 这样可以避免被跨夜活动查询逻辑误匹配
 *
 * 点事件类型: DIAPER, SUPPLEMENT, SPIT_UP, ROLL_OVER, PULL_TO_SIT
 */

import type { ActivityDoc } from '@/lib/payload/models'
import { loadScriptEnv } from './utils/load-env'
import { getPayloadForScript } from './utils/payload-script'

loadScriptEnv({ preferPayloadDatabase: true })

const POINT_EVENT_TYPES = ['DIAPER', 'SUPPLEMENT', 'SPIT_UP', 'ROLL_OVER', 'PULL_TO_SIT'] as const

async function main() {
  const payload = await getPayloadForScript()
  try {
    console.log('🔍 查询所有 endTime 为 null 的点事件活动...\n')
    console.log(`点事件类型: ${POINT_EVENT_TYPES.join(', ')}\n`)

    const activities = await payload.find({
      collection: 'activities',
      where: {
        and: [
          {
            type: {
              in: [...POINT_EVENT_TYPES],
            },
          },
          {
            endTime: {
              exists: false,
            },
          },
        ],
      },
      limit: 10000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    console.log(`找到 ${activities.docs.length} 个需要更新的点事件活动\n`)

    if (activities.docs.length === 0) {
      console.log('✅ 所有点事件活动的 endTime 已设置，无需更新')
      return
    }

    const typeCounts: Record<string, number> = {}
    for (const activity of activities.docs as ActivityDoc[]) {
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1
    }
    console.log('按类型统计:')
    for (const [type, count] of Object.entries(typeCounts)) {
      console.log(`  - ${type}: ${count}`)
    }
    console.log('')

    let updatedCount = 0
    let errorCount = 0

    for (const activity of activities.docs as ActivityDoc[]) {
      try {
        await payload.update({
          collection: 'activities',
          id: String(activity.id),
          data: {
            endTime: activity.startTime,
          },
          depth: 0,
          overrideAccess: true,
        })
        updatedCount += 1

        if (updatedCount % 100 === 0) {
          console.log(`✓ 已更新 ${updatedCount} 个活动...`)
        }
      } catch (error) {
        console.error(`❌ 更新活动 ${activity.id} 失败:`, error)
        errorCount += 1
      }
    }

    console.log('\n---')
    console.log('\n📊 Backfill 结果:')
    console.log(`   ✅ 成功更新: ${updatedCount}`)
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
