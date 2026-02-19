'use client'

export type StatFilter =
  | 'sleep'
  | 'bottle'
  | 'breastfeed'
  | 'pump'
  | 'diaper'
  | 'outdoor'
  | 'headLift'
  | 'rollOver'

export interface DaySummary {
  sleepCount: number
  totalSleepMinutes: number
  totalBottleMilkAmount: number
  totalBreastfeedMinutes: number
  totalPumpMilkAmount: number
  diaperCount: number
  largePeeDiaperCount: number
  smallMediumPeeDiaperCount: number
  totalOutdoorMinutes: number
  totalHeadLiftMinutes: number
  totalRollOverCount: number
  totalPullToSitCount: number
}

interface StatsCardListProps {
  summary: DaySummary
  activeFilters?: StatFilter[]
  onStatCardClick?: (filter: StatFilter) => void
}

function formatSleepDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const minutePart = String(minutes % 60).padStart(2, '0')
  return `${hours}:${minutePart}`
}

export function StatsCardList({
  summary,
  activeFilters = [],
  onStatCardClick,
}: StatsCardListProps) {
  const activeFilterSet = new Set(activeFilters)
  const normalizedPeeCount = summary.largePeeDiaperCount + Math.ceil(summary.smallMediumPeeDiaperCount / 2)

  const cards: Array<{ key: StatFilter; label: string; value: string; testId: string }> = [
    { key: 'sleep', label: '睡', value: formatSleepDuration(summary.totalSleepMinutes), testId: 'stat-card-sleep' },
    { key: 'bottle', label: '瓶', value: `${summary.totalBottleMilkAmount} ml`, testId: 'stat-card-bottle' },
    { key: 'breastfeed', label: '亲', value: `${summary.totalBreastfeedMinutes} min`, testId: 'stat-card-breastfeed' },
    { key: 'pump', label: '吸', value: `${summary.totalPumpMilkAmount} ml`, testId: 'stat-card-pump' },
    { key: 'diaper', label: '尿', value: `${normalizedPeeCount} 次`, testId: 'stat-card-diaper' },
    { key: 'outdoor', label: '阳', value: `${summary.totalOutdoorMinutes} min`, testId: 'stat-card-outdoor' },
    { key: 'headLift', label: '趴', value: `${summary.totalHeadLiftMinutes} min`, testId: 'stat-card-head-lift' },
    { key: 'rollOver', label: '翻', value: `${summary.totalRollOverCount} 次`, testId: 'stat-card-roll-over' },
  ]

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {cards.map((card) => {
        const isActive = activeFilterSet.has(card.key)
        return (
          <button
            key={card.key}
            onClick={() => onStatCardClick?.(card.key)}
            className={`rounded-lg border px-2 py-1.5 text-left transition-colors ${
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
            data-testid={card.testId}
          >
            <p className="text-[11px] font-medium leading-none">{card.label}</p>
            <p className="mt-1 text-sm font-semibold leading-tight">{card.value}</p>
          </button>
        )
      })}
    </div>
  )
}
