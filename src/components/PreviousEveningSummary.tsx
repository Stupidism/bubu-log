'use client'

import { Activity } from '@/lib/api/hooks'
import { ActivityIcon } from './ActivityIcon'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { dayjs, calculateDurationMinutes, formatTime, formatDuration } from '@/lib/dayjs'
import { Moon, Milk } from 'lucide-react'

interface PreviousEveningSummaryProps {
  activities: Activity[]
  date: Date // 当前查看的日期
  onActivityClick?: (activity: Activity) => void
}

/**
 * 前一天晚上的摘要组件
 * 显示：
 * 1. 前一天晚上最后一次喂奶（18:00 之后）
 * 2. 前一天晚上的睡眠（可能跨越到当天）
 */
export function PreviousEveningSummary({ 
  activities, 
  date, 
  onActivityClick 
}: PreviousEveningSummaryProps) {
  const currentDayStart = dayjs(date).startOf('day')
  const previousDay = currentDayStart.subtract(1, 'day')
  const eveningStart = previousDay.hour(18).minute(0).second(0) // 前一天 18:00
  
  // 筛选前一天晚间的喂奶（18:00 - 23:59）
  const eveningFeedings = activities.filter(activity => {
    if (activity.type !== 'BREASTFEED' && activity.type !== 'BOTTLE') return false
    const activityTime = dayjs(activity.startTime)
    return activityTime.isAfter(eveningStart) && activityTime.isBefore(currentDayStart)
  })
  
  // 获取最后一次喂奶
  const lastFeeding = eveningFeedings.length > 0 
    ? eveningFeedings.reduce((latest, current) => 
        dayjs(current.startTime).isAfter(dayjs(latest.startTime)) ? current : latest
      )
    : null
  
  // 筛选前一天晚间开始的睡眠（18:00 之后开始）
  const eveningSleeps = activities.filter(activity => {
    if (activity.type !== 'SLEEP') return false
    const activityTime = dayjs(activity.startTime)
    return activityTime.isAfter(eveningStart) && activityTime.isBefore(currentDayStart)
  })
  
  // 获取最后一次睡眠（可能跨夜）
  const lastSleep = eveningSleeps.length > 0
    ? eveningSleeps.reduce((latest, current) => 
        dayjs(current.startTime).isAfter(dayjs(latest.startTime)) ? current : latest
      )
    : null

  // 如果没有晚间活动，不显示
  if (!lastFeeding && !lastSleep) {
    return null
  }

  const formatActivityTime = (activity: Activity) => {
    const startTime = dayjs(activity.startTime)
    const isYesterday = startTime.isBefore(currentDayStart)
    const prefix = isYesterday ? '昨晚 ' : ''
    
    if (activity.endTime) {
      const endTime = dayjs(activity.endTime)
      const endPrefix = endTime.isBefore(currentDayStart) ? '昨晚 ' : '今天 '
      return `${prefix}${formatTime(activity.startTime)} - ${endPrefix}${formatTime(activity.endTime)}`
    }
    return `${prefix}${formatTime(activity.startTime)}`
  }

  const getFeedingLabel = (activity: Activity) => {
    const typeLabel = activity.type === 'BOTTLE' ? '瓶喂' : '亲喂'
    if (activity.type === 'BOTTLE' && activity.milkAmount) {
      return `${typeLabel} ${activity.milkAmount}ml`
    }
    if (activity.endTime) {
      const duration = calculateDurationMinutes(activity.startTime, activity.endTime)
      if (duration > 0) {
        return `${typeLabel} ${formatDuration(duration)}`
      }
    }
    return typeLabel
  }

  const getSleepLabel = (activity: Activity) => {
    if (activity.endTime) {
      const duration = calculateDurationMinutes(activity.startTime, activity.endTime)
      return `睡眠 ${formatDuration(duration)}`
    }
    return '睡眠（进行中）'
  }

  return (
    <div className="mb-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/50">
      <div className="flex items-center gap-1.5 mb-2">
        <Moon className="w-4 h-4 text-indigo-500" />
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">昨晚</span>
      </div>
      
      <div className="space-y-2">
        {/* 最后一次喂奶 */}
        {lastFeeding && (
          <button
            onClick={() => onActivityClick?.(lastFeeding)}
            className="w-full flex items-center gap-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <div className={`p-1.5 rounded-full ${lastFeeding.type === 'BOTTLE' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-pink-100 dark:bg-pink-900/40'}`}>
              <ActivityIcon 
                type={lastFeeding.type as ActivityType} 
                size={16} 
                className={lastFeeding.type === 'BOTTLE' ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'}
              />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {getFeedingLabel(lastFeeding)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatActivityTime(lastFeeding)}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">睡前最后一顿</span>
          </button>
        )}
        
        {/* 最后一次睡眠 */}
        {lastSleep && (
          <button
            onClick={() => onActivityClick?.(lastSleep)}
            className="w-full flex items-center gap-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40">
              <ActivityIcon 
                type="SLEEP" 
                size={16} 
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {getSleepLabel(lastSleep)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatActivityTime(lastSleep)}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">夜间睡眠</span>
          </button>
        )}
      </div>
    </div>
  )
}

