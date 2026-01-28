import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ActivityType } from '@prisma/client'
import { requireAuth } from '@/lib/auth/get-current-baby'

// 计算某天在当天范围内的睡眠时长（分钟）
function calculateDurationInDay(startTime: Date, endTime: Date, targetDate: Date): number {
  const dayStart = new Date(targetDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(targetDate)
  dayEnd.setHours(23, 59, 59, 999)
  
  const effectiveStart = startTime < dayStart ? dayStart : startTime
  const effectiveEnd = endTime > dayEnd ? dayEnd : endTime
  
  if (effectiveStart >= effectiveEnd) return 0
  
  return Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60))
}

// 计算两个时间之间的分钟数
function calculateDurationMinutes(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
}

// 计算某天的统计数据
async function computeDailyStats(babyId: string, date: Date) {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  
  // 获取当天的所有活动（开始时间或结束时间在当天范围内）
  const activities = await prisma.activity.findMany({
    where: {
      babyId,
      OR: [
        // 开始时间在当天
        { startTime: { gte: dayStart, lte: dayEnd } },
        // 结束时间在当天（跨天的活动）
        { endTime: { gte: dayStart, lte: dayEnd } },
        // 跨越整天的活动
        { AND: [{ startTime: { lt: dayStart } }, { endTime: { gt: dayEnd } }] },
      ],
    },
  })
  
  const stats = {
    sleepCount: 0,
    totalSleepMinutes: 0,
    breastfeedCount: 0,
    totalBreastfeedMinutes: 0,
    bottleCount: 0,
    totalMilkAmount: 0,
    diaperCount: 0,
    poopCount: 0,
    peeCount: 0,
    exerciseCount: 0,
    totalHeadLiftMinutes: 0,
    supplementADCount: 0,
    supplementD3Count: 0,
  }
  
  for (const activity of activities) {
    switch (activity.type) {
      case ActivityType.SLEEP:
        if (activity.endTime) {
          const duration = calculateDurationInDay(activity.startTime, activity.endTime, date)
          if (duration > 0) {
            stats.sleepCount++
            stats.totalSleepMinutes += duration
          }
        }
        break
        
      case ActivityType.BREASTFEED:
        // 只统计开始时间在当天的亲喂
        if (activity.startTime >= dayStart && activity.startTime <= dayEnd) {
          stats.breastfeedCount++
          if (activity.endTime) {
            stats.totalBreastfeedMinutes += calculateDurationMinutes(activity.startTime, activity.endTime)
          }
        }
        break
        
      case ActivityType.BOTTLE:
        // 只统计开始时间在当天的瓶喂
        if (activity.startTime >= dayStart && activity.startTime <= dayEnd) {
          stats.bottleCount++
          stats.totalMilkAmount += activity.milkAmount || 0
        }
        break
        
      case ActivityType.DIAPER:
        stats.diaperCount++
        if (activity.hasPoop) stats.poopCount++
        if (activity.hasPee) stats.peeCount++
        break
        
      case ActivityType.HEAD_LIFT:
        if (activity.startTime >= dayStart && activity.startTime <= dayEnd) {
          stats.exerciseCount++
          if (activity.endTime) {
            stats.totalHeadLiftMinutes += calculateDurationMinutes(activity.startTime, activity.endTime)
          }
        }
        break
        
      case ActivityType.PASSIVE_EXERCISE:
      case ActivityType.GAS_EXERCISE:
      case ActivityType.BATH:
      case ActivityType.OUTDOOR:
      case ActivityType.EARLY_EDUCATION:
        if (activity.startTime >= dayStart && activity.startTime <= dayEnd) {
          stats.exerciseCount++
        }
        break
        
      case ActivityType.SUPPLEMENT:
        if (activity.startTime >= dayStart && activity.startTime <= dayEnd) {
          if (activity.supplementType === 'AD') {
            stats.supplementADCount++
          } else if (activity.supplementType === 'D3') {
            stats.supplementD3Count++
          }
        }
        break
    }
  }
  
  return stats
}

// GET /api/daily-stats - 获取日期范围内的统计数据
export async function GET(request: NextRequest) {
  try {
    const { baby } = await requireAuth()
    
    const searchParams = request.nextUrl.searchParams
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '30')
    
    const where: { babyId: string; date?: { gte?: Date; lte?: Date } } = {
      babyId: baby.id,
    }
    
    if (startDateStr) {
      const startDate = new Date(startDateStr)
      startDate.setHours(0, 0, 0, 0)
      where.date = { ...where.date, gte: startDate }
    }
    
    if (endDateStr) {
      const endDate = new Date(endDateStr)
      endDate.setHours(0, 0, 0, 0)
      where.date = { ...where.date, lte: endDate }
    }
    
    const stats = await prisma.dailyStat.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    })
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch daily stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily stats' },
      { status: 500 }
    )
  }
}

// POST /api/daily-stats - 计算并保存某天的统计数据
export async function POST(request: NextRequest) {
  try {
    const { baby } = await requireAuth()
    
    const body = await request.json()
    const { date: dateStr } = body
    
    if (!dateStr) {
      return NextResponse.json({ error: '日期是必需的' }, { status: 400 })
    }
    
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    
    // 计算统计数据
    const stats = await computeDailyStats(baby.id, date)
    
    // 使用 upsert 更新或创建
    const dailyStat = await prisma.dailyStat.upsert({
      where: { 
        babyId_date: {
          babyId: baby.id,
          date,
        }
      },
      update: stats,
      create: {
        date,
        babyId: baby.id,
        ...stats,
      },
    })
    
    return NextResponse.json(dailyStat)
  } catch (error) {
    console.error('Failed to compute daily stats:', error)
    return NextResponse.json(
      { error: 'Failed to compute daily stats' },
      { status: 500 }
    )
  }
}
