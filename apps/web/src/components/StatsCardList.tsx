'use client'

import { Moon, Milk, Baby, Target } from 'lucide-react'
import { formatDuration } from '@/lib/dayjs'

export type StatFilter = 'all' | 'sleep' | 'feeding' | 'diaper' | 'activities'

interface DaySummary {
  sleepCount: number
  totalSleepMinutes: number
  totalMilkAmount: number
  totalBreastfeedMinutes: number
  diaperCount: number
  // 活动统计
  totalHeadLiftMinutes?: number
}

interface StatsCardListProps {
  summary: DaySummary
  /** 当前激活的过滤条件 */
  activeFilter?: StatFilter
  /** 点击卡片时触发 */
  onStatCardClick?: (filter: StatFilter) => void
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

  // 计算喂奶总时长（亲喂时长 + 瓶喂按10分钟/次估算）
  const totalFeedingMinutes = summary.totalBreastfeedMinutes

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
          {summary.totalSleepMinutes > 0 ? formatDuration(summary.totalSleepMinutes) : '-'}
        </p>
        <p className="text-xs text-gray-500">{summary.sleepCount}次</p>
      </button>

      {/* 喂奶（亲喂+瓶喂合并） */}
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
        <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
          {summary.totalMilkAmount > 0 || totalFeedingMinutes > 0 
            ? (summary.totalMilkAmount > 0 ? `${summary.totalMilkAmount}ml` : formatDuration(totalFeedingMinutes))
            : '-'}
        </p>
        <p className="text-xs text-gray-500">喂奶</p>
      </button>

      {/* 换尿布 */}
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
        <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
          {summary.diaperCount}
        </p>
        <p className="text-xs text-gray-500">换尿布</p>
      </button>

      {/* 活动（抬头时间） */}
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
        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
          {(summary.totalHeadLiftMinutes ?? 0) > 0 ? formatDuration(summary.totalHeadLiftMinutes!) : '-'}
        </p>
        <p className="text-xs text-gray-500">抬头</p>
      </button>
    </div>
  )
}
