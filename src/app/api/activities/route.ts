import { NextRequest, NextResponse } from 'next/server'
import { Prisma, ActivityType as PrismaActivityType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { startOfDayChina, endOfDayChina, previousDayTimeChina } from '@/lib/dayjs'

// GET: 获取活动列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') as ActivityType | null
    const types = searchParams.get('types') // 逗号分隔的多类型
    const date = searchParams.get('date') // YYYY-MM-DD 格式

    const where: Record<string, unknown> = {}

    if (type) {
      where.type = type
    } else if (types) {
      const typeList = types.split(',').map(t => t.trim()) as ActivityType[]
      where.type = { in: typeList }
    }

    if (date) {
      // 使用中国时区计算当天的开始和结束时间
      const startOfDay = startOfDayChina(date)
      const endOfDay = endOfDayChina(date)
      
      // 前一天晚上 18:00（中国时区，用于包含前一天晚上的活动）
      const previousEvening = previousDayTimeChina(date, 18)

      // 查询条件：活动与指定日期有交集，或前一天晚上18:00之后的活动
      // 1. startTime 在指定日期内，或者
      // 2. startTime 在指定日期之前，但 endTime 在指定日期内或之后（跨夜活动），或者
      // 3. startTime 在指定日期之前，且 endTime 为 null（进行中的跨夜活动），或者
      // 4. startTime 在前一天晚上18:00之后（用于显示"昨晚摘要"）
      where.OR = [
        {
          // 活动开始时间在指定日期内
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        {
          // 跨夜活动：开始时间在指定日期之前，结束时间在指定日期内或之后
          AND: [
            {
              startTime: {
                lt: startOfDay,
              },
            },
            {
              OR: [
                {
                  endTime: {
                    gte: startOfDay,
                  },
                },
                {
                  // 进行中的跨夜活动（endTime 为 null）
                  endTime: null,
                },
              ],
            },
          ],
        },
        {
          // 前一天晚上18:00之后开始的活动（用于"昨晚摘要"）
          // 这些活动可能完全在前一天，也可能跨到当天
          startTime: {
            gte: previousEvening,
            lt: startOfDay,
          },
        },
      ]
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: limit,
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

// 点事件类型（没有时长的活动）
const POINT_EVENT_TYPES = ['DIAPER', 'SUPPLEMENT']
// 喂奶类型（互斥的活动）
const FEEDING_TYPES = ['BREASTFEED', 'BOTTLE']
// 时间容差（毫秒）- 1分钟内视为相同时间
const TIME_TOLERANCE_MS = 60 * 1000

// 检查时间重叠
async function checkTimeOverlap(
  type: string,
  startTime: Date,
  endTime: Date | null,
  excludeId?: string
): Promise<{ code: string; message: string; conflictingActivity?: unknown } | null> {
  const isPointEvent = POINT_EVENT_TYPES.includes(type)
  const isFeeding = FEEDING_TYPES.includes(type)
  
  // 1. 点事件：检查同类型同时间（1分钟容差）
  if (isPointEvent) {
    const startMin = new Date(startTime.getTime() - TIME_TOLERANCE_MS)
    const startMax = new Date(startTime.getTime() + TIME_TOLERANCE_MS)
    
    const duplicate = await prisma.activity.findFirst({
      where: {
        type: type as PrismaActivityType,
        startTime: {
          gte: startMin,
          lte: startMax,
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    })
    
    if (duplicate) {
      return {
        code: 'DUPLICATE_ACTIVITY',
        message: `该时间点已存在相同类型的记录`,
        conflictingActivity: duplicate,
      }
    }
  }
  
  // 2. 喂奶类型：检查与其他喂奶活动的时间重叠
  if (isFeeding) {
    const activityEnd = endTime || new Date(startTime.getTime() + 30 * 60 * 1000) // 默认30分钟
    
    // 查找重叠的喂奶活动
    // 重叠条件：新活动的开始时间 < 现有活动的结束时间 AND 新活动的结束时间 > 现有活动的开始时间
    const overlapping = await prisma.activity.findFirst({
      where: {
        type: { in: FEEDING_TYPES as PrismaActivityType[] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
          {
            // 现有活动有结束时间
            AND: [
              { startTime: { lt: activityEnd } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            // 现有活动没有结束时间（进行中）
            AND: [
              { endTime: null },
              { startTime: { lt: activityEnd } },
            ],
          },
        ],
      },
    })
    
    if (overlapping) {
      const overlappingType = overlapping.type === 'BREASTFEED' ? '亲喂' : '瓶喂'
      return {
        code: 'OVERLAP_ACTIVITY',
        message: `该时间段与已有的${overlappingType}记录重叠`,
        conflictingActivity: overlapping,
      }
    }
  }
  
  return null
}

// POST: 创建新活动
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      startTime,
      endTime,
      hasPoop,
      hasPee,
      poopColor,
      poopPhotoUrl,
      peeAmount,
      burpSuccess,
      milkAmount,
      breastFirmness,
      supplementType,
      notes,
      force, // 强制创建（忽略重叠警告）
    } = body

    const startTimeDate = new Date(startTime)
    const endTimeDate = endTime ? new Date(endTime) : null

    // 检查时间重叠
    const overlap = await checkTimeOverlap(type, startTimeDate, endTimeDate)
    if (overlap) {
      // DUPLICATE_ACTIVITY 始终阻止，OVERLAP_ACTIVITY 可以通过 force 绕过
      if (overlap.code === 'DUPLICATE_ACTIVITY' || !force) {
        return NextResponse.json(
          {
            error: overlap.message,
            code: overlap.code,
            conflictingActivity: overlap.conflictingActivity,
          },
          { status: 409 }
        )
      }
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        startTime: startTimeDate,
        endTime: endTimeDate,
        hasPoop,
        hasPee,
        poopColor,
        poopPhotoUrl,
        peeAmount,
        burpSuccess,
        milkAmount,
        breastFirmness,
        supplementType,
        notes,
      },
    })

    // Generate description for audit log
    const typeLabel = ActivityTypeLabels[type as ActivityType] || type
    let description = `创建${typeLabel}`
    if (milkAmount) {
      description += ` ${milkAmount}ml`
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resourceType: 'ACTIVITY',
        resourceId: activity.id,
        inputMethod: 'TEXT',
        inputText: null,
        description,
        success: true,
        beforeData: Prisma.JsonNull,
        afterData: activity as Prisma.InputJsonValue,
        activityId: activity.id,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Failed to create activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}

// DELETE: 批量删除活动
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required' },
        { status: 400 }
      )
    }

    // 获取要删除的活动完整信息
    const activities = await prisma.activity.findMany({
      where: { id: { in: ids } },
    })

    const result = await prisma.activity.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    // 统计删除的活动类型
    const typeCounts: Record<string, number> = {}
    activities.forEach(a => {
      const label = ActivityTypeLabels[a.type as ActivityType] || a.type
      typeCounts[label] = (typeCounts[label] || 0) + 1
    })
    const typeDesc = Object.entries(typeCounts)
      .map(([type, count]) => `${type}${count}条`)
      .join('、')

    // 为每个删除的活动记录审计日志
    for (const activity of activities) {
      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          resourceType: 'ACTIVITY',
          resourceId: activity.id,
          inputMethod: 'TEXT',
          inputText: null,
          description: `批量删除${ActivityTypeLabels[activity.type as ActivityType] || activity.type}`,
          success: true,
          beforeData: activity as Prisma.InputJsonValue,
          afterData: Prisma.JsonNull,
          activityId: null,
        },
      })
    }

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error('Failed to batch delete activities:', error)
    return NextResponse.json(
      { error: 'Failed to batch delete activities' },
      { status: 500 }
    )
  }
}
