import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ActivityType } from '@/types/activity'

// GET: 获取某类活动的最新记录（用于判断交替状态）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const types = searchParams.get('types')?.split(',') as ActivityType[] | undefined

    if (!types || types.length === 0) {
      return NextResponse.json(
        { error: 'Types parameter is required' },
        { status: 400 }
      )
    }

    const activity = await prisma.activity.findFirst({
      where: {
        type: { in: types },
      },
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Failed to fetch latest activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest activity' },
      { status: 500 }
    )
  }
}

