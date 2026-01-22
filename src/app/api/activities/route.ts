import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ActivityType } from '@/types/activity'

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
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      // 前一天晚上 18:00（用于包含前一天晚上的活动）
      const previousEvening = new Date(startOfDay)
      previousEvening.setDate(previousEvening.getDate() - 1)
      previousEvening.setHours(18, 0, 0, 0)

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
      notes,
    } = body

    const activity = await prisma.activity.create({
      data: {
        type,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        hasPoop,
        hasPee,
        poopColor,
        poopPhotoUrl,
        peeAmount,
        burpSuccess,
        milkAmount,
        breastFirmness,
        notes,
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

    const result = await prisma.activity.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error('Failed to batch delete activities:', error)
    return NextResponse.json(
      { error: 'Failed to batch delete activities' },
      { status: 500 }
    )
  }
}
