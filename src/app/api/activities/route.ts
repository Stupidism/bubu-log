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

      where.recordTime = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { recordTime: 'desc' },
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
      recordTime,
      hasPoop,
      hasPee,
      poopColor,
      poopPhotoUrl,
      peeAmount,
      burpSuccess,
      duration,
      milkAmount,
      notes,
    } = body

    const activity = await prisma.activity.create({
      data: {
        type,
        recordTime: new Date(recordTime),
        hasPoop,
        hasPee,
        poopColor,
        poopPhotoUrl,
        peeAmount,
        burpSuccess,
        duration,
        milkAmount,
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
