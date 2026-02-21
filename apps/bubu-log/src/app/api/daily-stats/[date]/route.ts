import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/get-current-baby'
import { getPayloadClient } from '@/lib/payload/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { baby } = await requireAuth()
    const payload = await getPayloadClient()
    const { date: dateStr } = await params

    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: '无效的日期格式' }, { status: 400 })
    }

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const stat = await payload.find({
      collection: 'daily-stats',
      where: {
        and: [
          {
            babyId: {
              equals: baby.id,
            },
          },
          {
            date: {
              greater_than_equal: date.toISOString(),
            },
          },
          {
            date: {
              less_than: nextDate.toISOString(),
            },
          },
        ],
      },
      limit: 1,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    if (stat.totalDocs === 0) {
      return NextResponse.json({ error: '未找到该日期的统计数据' }, { status: 404 })
    }

    return NextResponse.json(stat.docs[0])
  } catch (error) {
    console.error('Failed to fetch daily stat:', error)
    return NextResponse.json({ error: 'Failed to fetch daily stat' }, { status: 500 })
  }
}
