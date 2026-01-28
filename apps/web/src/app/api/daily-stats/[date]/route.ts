import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/get-current-baby'

// GET /api/daily-stats/[date] - 获取特定日期的统计数据
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { baby } = await requireAuth()
    const { date: dateStr } = await params
    
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: '无效的日期格式' }, { status: 400 })
    }
    
    const stat = await prisma.dailyStat.findUnique({
      where: { 
        babyId_date: {
          babyId: baby.id,
          date,
        }
      },
    })
    
    if (!stat) {
      return NextResponse.json({ error: '未找到该日期的统计数据' }, { status: 404 })
    }
    
    return NextResponse.json(stat)
  } catch (error) {
    console.error('Failed to fetch daily stat:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily stat' },
      { status: 500 }
    )
  }
}
