'use client'

import { Moon, Milk, Baby, Target, Droplet } from 'lucide-react'
import { formatDuration } from '@/lib/dayjs'

export type StatFilter = 'all' | 'sleep' | 'feeding' | 'diaper' | 'activities'

interface DaySummary {
  sleepCount: number
  totalSleepMinutes: number
  feedingCount?: number
  totalMilkAmount: number
  totalBreastfeedMinutes: number
  diaperCount: number
  // 详细模式额外字段
  breastfeedCount?: number
  bottleCount?: number
  poopCount?: number
  peeCount?: number
  exerciseCount?: number
}

interface StatsCardListProps {
  summary: DaySummary
  /** 当前激活的过滤条件 */
  activeFilter?: StatFilter
  /** 点击卡片时触发 */
  onStatCardClick?: (filter: StatFilter) => void
  /** 布局模式：compact 首页精简版，detailed stats 页面详细版 */
  variant?: 'compact' | 'detailed'
}

export function StatsCardList({ 
  summary, 
  activeFilter = 'all',
  onStatCardClick,
  variant = 'compact',
}: StatsCardListProps) {
  const handleClick = (filter: StatFilter) => {
    if (onStatCardClick) {
      // 如果点击已激活的过滤器，切换回 'all'
      onStatCardClick(activeFilter === filter ? 'all' : filter)
    }
  }

  // 精简版布局（首页使用）
  if (variant === 'compact') {
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

  // 详细版布局（stats 页面使用）
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 睡眠卡片 */}
      <button
        onClick={() => handleClick('sleep')}
        className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left transition-all ${
          activeFilter === 'sleep' ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Moon size={28} className="text-indigo-500" />
          <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">睡眠</span>
        </div>
        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {formatDuration(summary.totalSleepMinutes)}
        </p>
        <p className="text-base text-gray-500 dark:text-gray-400">
          {summary.sleepCount} 次
        </p>
      </button>

      {/* 喂奶卡片 */}
      <button
        onClick={() => handleClick('feeding')}
        className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left transition-all ${
          activeFilter === 'feeding' ? 'ring-2 ring-pink-500 ring-offset-2' : 'hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Milk size={28} className="text-pink-500" />
          <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">喂奶</span>
        </div>
        <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
          {summary.totalMilkAmount > 0 ? `${summary.totalMilkAmount}ml` : '-'}
        </p>
        <p className="text-base text-gray-500 dark:text-gray-400">
          亲喂 {summary.breastfeedCount ?? 0}次 · 瓶喂 {summary.bottleCount ?? 0}次
        </p>
      </button>

      {/* 尿布卡片 */}
      <button
        onClick={() => handleClick('diaper')}
        className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left transition-all ${
          activeFilter === 'diaper' ? 'ring-2 ring-teal-500 ring-offset-2' : 'hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Baby size={28} className="text-teal-500" />
          <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">尿布</span>
        </div>
        <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
          {summary.diaperCount} 次
        </p>
        <p className="text-base text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span className="text-amber-600">{summary.poopCount ?? 0}💩</span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Droplet size={14} className="text-blue-400" />
            {summary.peeCount ?? 0}
          </span>
        </p>
      </button>

      {/* 活动卡片 */}
      <button
        onClick={() => handleClick('activities')}
        className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left transition-all ${
          activeFilter === 'activities' ? 'ring-2 ring-amber-500 ring-offset-2' : 'hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target size={28} className="text-amber-500" />
          <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">活动</span>
        </div>
        <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
          {summary.exerciseCount ?? 0} 次
        </p>
        <p className="text-base text-gray-500 dark:text-gray-400">各类活动</p>
      </button>
    </div>
  )
}
