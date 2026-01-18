import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ActivityType } from '@/types/activity'

// GET: 获取活动列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') as ActivityType | null
    const date = searchParams.get('date') // YYYY-MM-DD 格式

    const where: Record<string, unknown> = {}

    if (type) {
      where.type = type
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
      peeAmount,
      burpSuccess,
      duration,
      milkAmount,
      startActivityId,
      notes,
    } = body

    const activity = await prisma.activity.create({
      data: {
        type,
        recordTime: new Date(recordTime),
        hasPoop,
        hasPee,
        poopColor,
        peeAmount,
        burpSuccess,
        duration,
        milkAmount,
        startActivityId,
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

