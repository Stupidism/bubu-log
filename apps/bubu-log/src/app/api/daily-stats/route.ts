import { NextRequest, NextResponse } from 'next/server'
import { type Where } from 'payload'
import { requireAuth } from '@/lib/auth/get-current-baby'
import { getPayloadClient } from '@/lib/payload/client'
import { parseDailyStatDate, upsertDailyStatsForBaby } from '@/lib/daily-stats/compute'
import { endOfDayChina, startOfDayChina } from '@/lib/dayjs'

export async function GET(request: NextRequest) {
  try {
    const { baby } = await requireAuth()
    const payload = await getPayloadClient()

    const searchParams = request.nextUrl.searchParams
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    const conditions: Where[] = [
      {
        babyId: {
          equals: baby.id,
        },
      },
    ]

    if (startDateStr) {
      const parsedStartDate = parseDailyStatDate(startDateStr)
      if (parsedStartDate) {
        const startDate = startOfDayChina(parsedStartDate)
        conditions.push({
          date: {
            greater_than_equal: startDate.toISOString(),
          },
        })
      }
    }

    if (endDateStr) {
      const parsedEndDate = parseDailyStatDate(endDateStr)
      if (parsedEndDate) {
        const endDate = endOfDayChina(parsedEndDate)
        conditions.push({
          date: {
            less_than_equal: endDate.toISOString(),
          },
        })
      }
    }

    const stats = await payload.find({
      collection: 'daily-stats',
      where: {
        and: conditions,
      },
      sort: 'date',
      limit: 500,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json(stats.docs)
  } catch (error) {
    console.error('Failed to fetch daily stats:', error)
    return NextResponse.json({ error: 'Failed to fetch daily stats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { baby } = await requireAuth()
    const payload = await getPayloadClient()

    const body = await request.json()
    const dateStr = body.date as string | undefined

    if (!dateStr) {
      return NextResponse.json({ error: '日期是必需的' }, { status: 400 })
    }

    const parsedDate = parseDailyStatDate(dateStr)
    if (!parsedDate) {
      return NextResponse.json({ error: '日期格式无效' }, { status: 400 })
    }

    const dailyStat = await upsertDailyStatsForBaby(payload, baby.id, parsedDate)

    return NextResponse.json(dailyStat)
  } catch (error) {
    console.error('Failed to compute daily stats:', error)
    return NextResponse.json({ error: 'Failed to compute daily stats' }, { status: 500 })
  }
}
