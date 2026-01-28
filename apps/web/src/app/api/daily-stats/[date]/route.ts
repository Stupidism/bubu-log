import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/daily-stats/[date] - 获取特定日期的统计数据
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date: dateStr } = await params
  
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: '无效的日期格式' }, { status: 400 })
  }
  
  const stat = await prisma.dailyStat.findUnique({
    where: { date },
  })
  
  if (!stat) {
    return NextResponse.json({ error: '未找到该日期的统计数据' }, { status: 404 })
  }
  
  return NextResponse.json(stat)
}
