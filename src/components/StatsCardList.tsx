'use client'

import { Moon, Milk, Baby } from 'lucide-react'
import { formatDuration } from '@/lib/dayjs'

export type StatFilter = 'all' | 'sleep' | 'feeding' | 'diaper'

interface DaySummary {
  sleepCount: number
  totalSleepMinutes: number
  feedingCount: number
  totalMilkAmount: number
  totalBreastfeedMinutes: number
  diaperCount: number
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
  onStatCardClick 
}: StatsCardListProps) {
  const handleClick = (filter: StatFilter) => {
    if (onStatCardClick) {
      // 如果点击已激活的过滤器，切换回 'all'
      onStatCardClick(activeFilter === filter ? 'all' : filter)
    }
  }

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
      >
        <Moon size={18} className="mx-auto text-indigo-500 mb-1" />
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {summary.totalSleepMinutes > 0 ? formatDuration(summary.totalSleepMinutes) : '-'}
        </p>
        <p className="text-xs text-gray-500">{summary.sleepCount}次</p>
      </button>

      {/* 瓶喂 */}
      <button
        onClick={() => handleClick('feeding')}
        className={`bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm transition-all ${
          activeFilter === 'feeding' 
            ? 'ring-2 ring-pink-500 ring-offset-1' 
            : 'hover:shadow-md active:scale-95'
        }`}
      >
        <Milk size={18} className="mx-auto text-blue-500 mb-1" />
        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {summary.totalMilkAmount > 0 ? `${summary.totalMilkAmount}ml` : '-'}
        </p>
        <p className="text-xs text-gray-500">瓶喂</p>
      </button>

      {/* 亲喂 */}
      <button
        onClick={() => handleClick('feeding')}
        className={`bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm transition-all ${
          activeFilter === 'feeding' 
            ? 'ring-2 ring-pink-500 ring-offset-1' 
            : 'hover:shadow-md active:scale-95'
        }`}
      >
        <Milk size={18} className="mx-auto text-pink-500 mb-1" />
        <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
          {summary.totalBreastfeedMinutes > 0 ? formatDuration(summary.totalBreastfeedMinutes) : '-'}
        </p>
        <p className="text-xs text-gray-500">亲喂</p>
      </button>

      {/* 换尿布 */}
      <button
        onClick={() => handleClick('diaper')}
        className={`bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm transition-all ${
          activeFilter === 'diaper' 
            ? 'ring-2 ring-teal-500 ring-offset-1' 
            : 'hover:shadow-md active:scale-95'
        }`}
      >
        <Baby size={18} className="mx-auto text-teal-500 mb-1" />
        <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
          {summary.diaperCount}
        </p>
        <p className="text-xs text-gray-500">换尿布</p>
      </button>
    </div>
  )
}

