'use client'

import { Moon, Milk, Baby, Target } from 'lucide-react'

export type StatFilter = 'all' | 'sleep' | 'feeding' | 'diaper' | 'activities'

export interface DaySummary {
  sleepCount: number
  totalSleepMinutes: number
  // 喂养统计
  totalBottleMilkAmount: number
  totalBreastfeedMinutes: number
  totalPumpMilkAmount: number
  // 尿布统计
  diaperCount: number
  largePeeDiaperCount: number
  smallMediumPeeDiaperCount: number
  // 运动统计
  totalHeadLiftMinutes: number
  totalRollOverCount: number
  totalPullToSitCount: number
}

interface StatsCardListProps {
  summary: DaySummary
  /** 当前激活的过滤条件 */
  activeFilter?: StatFilter
  /** 点击卡片时触发 */
  onStatCardClick?: (filter: StatFilter) => void
}

// 格式化时长为简短形式
function formatDurationShort(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}时`
  }
  return `${hours}时${remainingMinutes}分`
}

export function StatsCardList({ 
  summary, 
  activeFilter = 'all',
  onStatCardClick,
}: StatsCardListProps) {
  const handleClick = (filter: StatFilter) => {
    if (onStatCardClick) {
      // 如果点击已激活的过滤器，切换回 'all'
      onStatCardClick(activeFilter === filter ? 'all' : filter)
    }
  }

  // 计算尿布统计：中+少量算一个
  const normalizedPeeCount = summary.largePeeDiaperCount + Math.ceil(summary.smallMediumPeeDiaperCount / 2)

  return (
    <div className="grid grid-cols-4 gap-2">
      {/* 睡眠 */}
      <button
        onClick={() => handleClick('sleep')}
        className={`bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm transition-all ${
          activeFilter === 'sleep' 
            ? 'ring-2 ring-indigo-500 ring-offset-1' 
            : 'hover:shadow-md active:scale-95'
        }`}
        data-testid="stat-card-sleep"
      >
        <Moon size={18} className="mx-auto text-indigo-500 mb-1" />
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {summary.totalSleepMinutes > 0 ? formatDurationShort(summary.totalSleepMinutes) : '-'}
        </p>
        <p className="text-xs text-gray-500">{summary.sleepCount}次</p>
      </button>

      {/* 喂奶：瓶喂ml / 亲喂分钟 */}
      <button
        onClick={() => handleClick('feeding')}
        className={`bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm transition-all ${
          activeFilter === 'feeding'
            ? 'ring-2 ring-pink-500 ring-offset-1'
            : 'hover:shadow-md active:scale-95'
        }`}
        data-testid="stat-card-feeding"
      >
        <Milk size={18} className="mx-auto text-pink-500 mb-1" />
        <div className="text-sm text-pink-600 dark:text-pink-400 font-medium space-y-1">
          <p className="text-base font-bold">瓶{summary.totalBottleMilkAmount || '-'}</p>
          <p className="text-xs">喂{summary.totalBreastfeedMinutes || '-'}</p>
        </div>
      </button>

      {/* 换尿布：多量尿 / 总数 */}
      <button
        onClick={() => handleClick('diaper')}
        className={`bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm transition-all ${
          activeFilter === 'diaper' 
            ? 'ring-2 ring-teal-500 ring-offset-1' 
            : 'hover:shadow-md active:scale-95'
        }`}
        data-testid="stat-card-diaper"
      >
        <Baby size={18} className="mx-auto text-teal-500 mb-1" />
        <div className="text-xs text-teal-600 dark:text-teal-400 font-medium space-y-0.5">
          <p className="text-base font-bold">{normalizedPeeCount}</p>
          <p>共{summary.diaperCount}次</p>
        </div>
      </button>

      {/* 运动：抬头分钟 / 翻身次 / 拉坐次 */}
      <button
        onClick={() => handleClick('activities')}
        className={`bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm transition-all ${
          activeFilter === 'activities' 
            ? 'ring-2 ring-amber-500 ring-offset-1' 
            : 'hover:shadow-md active:scale-95'
        }`}
        data-testid="stat-card-activities"
      >
        <Target size={18} className="mx-auto text-amber-500 mb-1" />
        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium space-y-0.5">
          <p>头{summary.totalHeadLiftMinutes || '-'}</p>
          <p>翻{summary.totalRollOverCount || '-'}</p>
          <p>坐{summary.totalPullToSitCount || '-'}</p>
        </div>
      </button>
    </div>
  )
}
