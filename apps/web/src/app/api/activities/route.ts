import { NextRequest, NextResponse } from 'next/server'
import { Prisma, ActivityType as PrismaActivityType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { startOfDayChina, endOfDayChina, previousDayTimeChina } from '@/lib/dayjs'
import { requireAuth } from '@/lib/auth/get-current-baby'

// GET: 获取活动列表
export async function GET(request: NextRequest) {
  try {
    const { baby } = await requireAuth()
    
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') as ActivityType | null
    const types = searchParams.get('types') // 逗号分隔的多类型
    const date = searchParams.get('date') // YYYY-MM-DD 格式
    const startTimeGte = searchParams.get('startTimeGte') // ISO 格式，活动开始时间下限
    const startTimeLt = searchParams.get('startTimeLt') // ISO 格式，活动开始时间上限

    const where: Record<string, unknown> = {
      babyId: baby.id,
    }

    if (type) {
      where.type = type
    } else if (types) {
      const typeList = types.split(',').map(t => t.trim()) as ActivityType[]
      where.type = { in: typeList }
    }

    // 支持两种查询模式：
    // 1. date 参数：查询某一天的活动（包括跨夜活动）
    // 2. startTimeGte/startTimeLt 参数：查询指定时间范围内开始的活动
    if (startTimeGte || startTimeLt) {
      // 时间范围查询模式
      const startTimeCondition: Record<string, Date> = {}
      if (startTimeGte) {
        startTimeCondition.gte = new Date(startTimeGte)
      }
      if (startTimeLt) {
        startTimeCondition.lt = new Date(startTimeLt)
      }
      where.startTime = startTimeCondition
    } else if (date) {
      // 日期查询模式：使用中国时区计算当天的开始和结束时间
      const startOfDay = startOfDayChina(date)
      const endOfDay = endOfDayChina(date)
      
      // 前一天晚上 18:00（中国时区，用于跨夜活动下限）
      const previousEvening = previousDayTimeChina(date, 18)

      // 查询条件：活动与指定日期有交集
      where.OR = [
        {
          // 活动开始时间在指定日期内
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        {
          // 跨夜活动：开始时间在前一天晚上18:00之后且在当天之前，结束时间在当天或之后
          AND: [
            {
              startTime: {
                gte: previousEvening,
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
      ]
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: limit,
    })

    return NextResponse.json(activities)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
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
// 有时长的活动类型（同类型不允许重叠）
const DURATION_ACTIVITY_TYPES = ['SLEEP', 'HEAD_LIFT', 'PASSIVE_EXERCISE', 'GAS_EXERCISE', 'BATH', 'OUTDOOR', 'EARLY_EDUCATION']
// 时间容差（毫秒）- 1分钟内视为相同时间
const TIME_TOLERANCE_MS = 60 * 1000

// 活动类型标签（用于错误提示）
const TYPE_LABELS: Record<string, string> = {
  SLEEP: '睡眠',
  BREASTFEED: '亲喂',
  BOTTLE: '瓶喂',
  DIAPER: '换尿布',
  SUPPLEMENT: '补剂',
  HEAD_LIFT: '抬头',
  PASSIVE_EXERCISE: '被动操',
  GAS_EXERCISE: '排气操',
  BATH: '洗澡',
  OUTDOOR: '户外',
  EARLY_EDUCATION: '早教',
}

// 检查是否是未来时间
function isFutureTime(time: Date): boolean {
  const now = new Date()
  // 允许2分钟的误差（考虑到网络延迟等）
  const tolerance = 2 * 60 * 1000
  return time.getTime() > now.getTime() + tolerance
}

// 检查时间重叠
async function checkTimeOverlap(
  babyId: string,
  type: string,
  startTime: Date,
  endTime: Date | null,
  excludeId?: string
): Promise<{ code: string; message: string; conflictingActivity?: unknown } | null> {
  const isPointEvent = POINT_EVENT_TYPES.includes(type)
  const isFeeding = FEEDING_TYPES.includes(type)
  const isDurationActivity = DURATION_ACTIVITY_TYPES.includes(type)
  
  // 0. 检查是否是未来时间
  if (isFutureTime(startTime)) {
    return {
      code: 'FUTURE_TIME',
      message: '不能录入未来的活动',
    }
  }
  if (endTime && isFutureTime(endTime)) {
    return {
      code: 'FUTURE_TIME',
      message: '活动结束时间不能在未来',
    }
  }
  
  // 1. 点事件：检查同类型同时间（1分钟容差）
  if (isPointEvent) {
    const startMin = new Date(startTime.getTime() - TIME_TOLERANCE_MS)
    const startMax = new Date(startTime.getTime() + TIME_TOLERANCE_MS)
    
    const duplicate = await prisma.activity.findFirst({
      where: {
        babyId,
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
        babyId,
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
      const overlappingType = TYPE_LABELS[overlapping.type] || overlapping.type
      return {
        code: 'OVERLAP_ACTIVITY',
        message: `该时间段与已有的${overlappingType}记录重叠`,
        conflictingActivity: overlapping,
      }
    }
  }
  
  // 3. 有时长的活动：检查同类型时间重叠（如睡眠）
  if (isDurationActivity) {
    // 对于进行中的活动（没有结束时间），我们检查是否与同类型的其他活动重叠
    // 默认假设活动持续时间为合理范围
    const activityEnd = endTime || new Date(startTime.getTime() + 4 * 60 * 60 * 1000) // 默认4小时
    
    // 查找同类型重叠的活动
    const overlapping = await prisma.activity.findFirst({
      where: {
        babyId,
        type: type as PrismaActivityType,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
          {
            // 现有活动有结束时间：检查时间段重叠
            AND: [
              { startTime: { lt: activityEnd } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            // 现有活动没有结束时间（进行中）：新活动开始时间在现有活动开始时间之后
            AND: [
              { endTime: null },
              { startTime: { lt: activityEnd } },
            ],
          },
        ],
      },
    })
    
    if (overlapping) {
      const typeLabel = TYPE_LABELS[type] || type
      return {
        code: 'DUPLICATE_ACTIVITY', // 同类型重叠不允许绕过
        message: `该时间段与已有的${typeLabel}记录重叠，请检查`,
        conflictingActivity: overlapping,
      }
    }
  }
  
  return null
}

// POST: 创建新活动
export async function POST(request: NextRequest) {
  try {
    const { baby, user } = await requireAuth()
    
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
    // 点事件（换尿布、补剂）的 endTime 应该与 startTime 相同
    const isPointEvent = POINT_EVENT_TYPES.includes(type)
    const endTimeDate = isPointEvent ? startTimeDate : (endTime ? new Date(endTime) : null)

    // 检查时间重叠
    const overlap = await checkTimeOverlap(baby.id, type, startTimeDate, endTimeDate)
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
        babyId: baby.id,
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
        babyId: baby.id,
        userId: user.id,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Failed to create activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}

// PUT: 批量修改活动日期
export async function PUT(request: NextRequest) {
  try {
    const { baby, user } = await requireAuth()
    
    const body = await request.json()
    const { ids, targetDate } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required' },
        { status: 400 }
      )
    }

    if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return NextResponse.json(
        { error: 'targetDate is required in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    // 解析目标日期
    const targetDateObj = new Date(targetDate + 'T00:00:00')
    
    // 检查目标日期是否是未来
    const today = new Date()
    today.setHours(23, 59, 59, 999) // 允许修改到今天
    if (targetDateObj > today) {
      return NextResponse.json(
        { error: '不能将活动移动到未来日期' },
        { status: 400 }
      )
    }

    // 获取要修改的活动（只能修改属于当前宝宝的活动）
    const activities = await prisma.activity.findMany({
      where: { id: { in: ids }, babyId: baby.id },
    })

    if (activities.length === 0) {
      return NextResponse.json(
        { error: '未找到可修改的活动' },
        { status: 404 }
      )
    }

    // 批量更新活动日期
    // 保持原来的时间（小时分钟秒），只修改日期部分
    let updatedCount = 0
    for (const activity of activities) {
      const originalStart = new Date(activity.startTime)
      const newStartTime = new Date(targetDateObj)
      newStartTime.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds(), originalStart.getMilliseconds())
      
      let newEndTime: Date | null = null
      if (activity.endTime) {
        const originalEnd = new Date(activity.endTime)
        newEndTime = new Date(targetDateObj)
        newEndTime.setHours(originalEnd.getHours(), originalEnd.getMinutes(), originalEnd.getSeconds(), originalEnd.getMilliseconds())
        
        // 如果原活动跨天（结束时间小于开始时间的时钟时间），保持跨天
        if (originalEnd.getHours() < originalStart.getHours() || 
            (originalEnd.getHours() === originalStart.getHours() && originalEnd.getMinutes() < originalStart.getMinutes())) {
          newEndTime.setDate(newEndTime.getDate() + 1)
        }
      }

      await prisma.activity.update({
        where: { id: activity.id },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
        },
      })

      // 记录审计日志
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          resourceType: 'ACTIVITY',
          resourceId: activity.id,
          inputMethod: 'TEXT',
          inputText: null,
          description: `批量修改日期至 ${targetDate}`,
          success: true,
          beforeData: activity as Prisma.InputJsonValue,
          afterData: { ...activity, startTime: newStartTime, endTime: newEndTime } as Prisma.InputJsonValue,
          activityId: activity.id,
          babyId: baby.id,
          userId: user.id,
        },
      })

      updatedCount++
    }

    return NextResponse.json({ success: true, count: updatedCount })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Failed to batch update activity dates:', error)
    return NextResponse.json(
      { error: 'Failed to batch update activity dates' },
      { status: 500 }
    )
  }
}

// DELETE: 批量删除活动
export async function DELETE(request: NextRequest) {
  try {
    const { baby, user } = await requireAuth()
    
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required' },
        { status: 400 }
      )
    }

    // 获取要删除的活动完整信息（只能删除属于当前宝宝的活动）
    const activities = await prisma.activity.findMany({
      where: { id: { in: ids }, babyId: baby.id },
    })

    const result = await prisma.activity.deleteMany({
      where: {
        id: { in: ids },
        babyId: baby.id,
      },
    })

    // 统计删除的活动类型
    const typeCounts: Record<string, number> = {}
    activities.forEach(a => {
      const label = ActivityTypeLabels[a.type as ActivityType] || a.type
      typeCounts[label] = (typeCounts[label] || 0) + 1
    })

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
          babyId: baby.id,
          userId: user.id,
        },
      })
    }

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Failed to batch delete activities:', error)
    return NextResponse.json(
      { error: 'Failed to batch delete activities' },
      { status: 500 }
    )
  }
}
