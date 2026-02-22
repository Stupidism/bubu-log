import { ActivityType } from '@/types/activity'
import type { ActivityDoc, DailyStatDoc } from '@/lib/payload/models'
import { getPayloadClient } from '@/lib/payload/client'

type PayloadClient = Awaited<ReturnType<typeof getPayloadClient>>

type DailyStatMetrics = Omit<
  DailyStatDoc,
  'id' | 'date' | 'babyId' | 'createdAt' | 'updatedAt'
>

function calculateDurationInDay(startTime: Date, endTime: Date, targetDate: Date): number {
  const dayStart = new Date(targetDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(targetDate)
  dayEnd.setHours(23, 59, 59, 999)

  const effectiveStart = startTime < dayStart ? dayStart : startTime
  const effectiveEnd = endTime > dayEnd ? dayEnd : endTime

  if (effectiveStart >= effectiveEnd) {
    return 0
  }

  return Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60))
}

function calculateDurationMinutes(startTime: Date, endTime: Date): number {
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
  return Number.isFinite(duration) && duration > 0 ? duration : 0
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function parseDailyStatDate(dateStr: string): Date | null {
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function computeDailyStatsForBaby(
  payload: PayloadClient,
  babyId: string,
  date: Date,
): Promise<DailyStatMetrics> {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const activitiesResult = await payload.find({
    collection: 'activities',
    where: {
      and: [
        {
          babyId: {
            equals: babyId,
          },
        },
        {
          or: [
            {
              and: [
                {
                  startTime: {
                    greater_than_equal: dayStart.toISOString(),
                  },
                },
                {
                  startTime: {
                    less_than_equal: dayEnd.toISOString(),
                  },
                },
              ],
            },
            {
              and: [
                {
                  endTime: {
                    greater_than_equal: dayStart.toISOString(),
                  },
                },
                {
                  endTime: {
                    less_than_equal: dayEnd.toISOString(),
                  },
                },
              ],
            },
            {
              and: [
                {
                  startTime: {
                    less_than: dayStart.toISOString(),
                  },
                },
                {
                  endTime: {
                    greater_than: dayEnd.toISOString(),
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    limit: 1000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  const activities = activitiesResult.docs as ActivityDoc[]

  const stats: DailyStatMetrics = {
    sleepCount: 0,
    totalSleepMinutes: 0,
    breastfeedCount: 0,
    totalBreastfeedMinutes: 0,
    bottleCount: 0,
    totalMilkAmount: 0,
    pumpCount: 0,
    totalPumpMilkAmount: 0,
    diaperCount: 0,
    poopCount: 0,
    peeCount: 0,
    exerciseCount: 0,
    totalHeadLiftMinutes: 0,
    supplementADCount: 0,
    supplementD3Count: 0,
    spitUpCount: 0,
    projectileSpitUpCount: 0,
  }

  for (const activity of activities) {
    const startTime = toDate(activity.startTime)
    const endTime = toDate(activity.endTime || null)

    if (!startTime) {
      continue
    }

    const isStartInDay = startTime >= dayStart && startTime <= dayEnd

    switch (activity.type) {
      case ActivityType.SLEEP:
        if (endTime) {
          const duration = calculateDurationInDay(startTime, endTime, date)
          if (duration > 0) {
            stats.sleepCount += 1
            stats.totalSleepMinutes += duration
          }
        }
        break

      case ActivityType.BREASTFEED:
        if (isStartInDay) {
          stats.breastfeedCount += 1
          if (endTime) {
            stats.totalBreastfeedMinutes += calculateDurationMinutes(startTime, endTime)
          }
        }
        break

      case ActivityType.BOTTLE:
        if (isStartInDay) {
          stats.bottleCount += 1
          stats.totalMilkAmount += typeof activity.milkAmount === 'number' ? activity.milkAmount : 0
        }
        break

      case ActivityType.PUMP:
        if (isStartInDay) {
          stats.pumpCount += 1
          stats.totalPumpMilkAmount += typeof activity.milkAmount === 'number' ? activity.milkAmount : 0
        }
        break

      case ActivityType.DIAPER:
        stats.diaperCount += 1
        if (activity.hasPoop) stats.poopCount += 1
        if (activity.hasPee) stats.peeCount += 1
        break

      case ActivityType.HEAD_LIFT:
        if (isStartInDay) {
          stats.exerciseCount += 1
          if (endTime) {
            stats.totalHeadLiftMinutes += calculateDurationMinutes(startTime, endTime)
          }
        }
        break

      case ActivityType.PASSIVE_EXERCISE:
      case ActivityType.GAS_EXERCISE:
      case ActivityType.BATH:
      case ActivityType.OUTDOOR:
      case ActivityType.EARLY_EDUCATION:
        if (isStartInDay) {
          stats.exerciseCount += 1
        }
        break

      case ActivityType.SUPPLEMENT:
        if (isStartInDay) {
          if (activity.supplementType === 'AD') {
            stats.supplementADCount += 1
          } else if (activity.supplementType === 'D3') {
            stats.supplementD3Count += 1
          }
        }
        break

      case ActivityType.SPIT_UP:
        if (isStartInDay) {
          stats.spitUpCount += 1
          if (activity.spitUpType === 'PROJECTILE') {
            stats.projectileSpitUpCount += 1
          }
        }
        break

      default:
        break
    }
  }

  return stats
}

export async function upsertDailyStatsForBaby(
  payload: PayloadClient,
  babyId: string,
  date: Date,
): Promise<DailyStatDoc> {
  const stats = await computeDailyStatsForBaby(payload, babyId, date)

  const existing = await payload.find({
    collection: 'daily-stats',
    where: {
      and: [
        {
          babyId: {
            equals: babyId,
          },
        },
        {
          date: {
            equals: date.toISOString(),
          },
        },
      ],
    },
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.totalDocs > 0) {
    const updated = await payload.update({
      collection: 'daily-stats',
      id: String(existing.docs[0].id),
      data: stats,
      depth: 0,
      overrideAccess: true,
    })

    return updated as DailyStatDoc
  }

  const created = await payload.create({
    collection: 'daily-stats',
    data: {
      date: date.toISOString(),
      babyId,
      ...stats,
    },
    depth: 0,
    overrideAccess: true,
  })

  return created as DailyStatDoc
}
