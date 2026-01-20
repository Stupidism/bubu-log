'use client'

import { useMemo } from 'react'
import { format, addMinutes, startOfDay, differenceInMinutes } from 'date-fns'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { ActivityIcon } from './ActivityIcon'

interface TimelineActivity {
  id: string
  type: string
  recordTime: string
  duration?: number | null
  milkAmount?: number | null
  hasPoop?: boolean | null
  hasPee?: boolean | null
  [key: string]: unknown // 允许其他属性
}

interface DayTimelineProps {
  activities: TimelineActivity[]
  date: Date
  onActivityClick?: (activity: TimelineActivity) => void
}

// 活动类型对应的颜色
const activityColors: Record<string, { bg: string; border: string; text: string }> = {
  SLEEP: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', border: 'border-indigo-400', text: 'text-indigo-700 dark:text-indigo-300' },
  BREASTFEED: { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-400', text: 'text-pink-700 dark:text-pink-300' },
  BOTTLE: { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300' },
  DIAPER: { bg: 'bg-teal-100 dark:bg-teal-900/40', border: 'border-teal-400', text: 'text-teal-700 dark:text-teal-300' },
  HEAD_LIFT: { bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  PASSIVE_EXERCISE: { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-400', text: 'text-green-700 dark:text-green-300' },
  GAS_EXERCISE: { bg: 'bg-lime-100 dark:bg-lime-900/40', border: 'border-lime-400', text: 'text-lime-700 dark:text-lime-300' },
  BATH: { bg: 'bg-cyan-100 dark:bg-cyan-900/40', border: 'border-cyan-400', text: 'text-cyan-700 dark:text-cyan-300' },
  OUTDOOR: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
  EARLY_EDUCATION: { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300' },
}

const defaultColor = { bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-400', text: 'text-gray-700 dark:text-gray-300' }

// 每小时的高度（像素）
const HOUR_HEIGHT = 60
// 最小活动块高度
const MIN_BLOCK_HEIGHT = 28

export function DayTimeline({ activities, date, onActivityClick }: DayTimelineProps) {
  // 生成小时标记 (0-23)
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), [])

  // 计算活动在时间线上的位置
  const positionedActivities = useMemo(() => {
    const dayStart = startOfDay(date)
    
    return activities.map(activity => {
      const activityTime = new Date(activity.recordTime)
      const minutesFromStart = differenceInMinutes(activityTime, dayStart)
      const top = (minutesFromStart / 60) * HOUR_HEIGHT
      
      // 计算高度：有 duration 的活动按时长显示，没有的显示最小高度
      const duration = activity.duration || 5 // 没有 duration 的默认显示 5 分钟
      const height = Math.max((duration / 60) * HOUR_HEIGHT, MIN_BLOCK_HEIGHT)
      
      return {
        ...activity,
        top,
        height,
        startTime: activityTime,
        endTime: activity.duration ? addMinutes(activityTime, activity.duration) : activityTime,
      }
    }).sort((a, b) => a.top - b.top)
  }, [activities, date])

  // 处理重叠的活动（简单实现：按顺序排列）
  const layoutActivities = useMemo(() => {
    const result: Array<typeof positionedActivities[0] & { left: number; width: number }> = []
    
    for (const activity of positionedActivities) {
      // 检查是否与已有活动重叠
      const overlapping = result.filter(
        a => !(activity.top >= a.top + a.height || activity.top + activity.height <= a.top)
      )
      
      // 简单处理：如果重叠，缩小宽度并偏移
      const left = overlapping.length > 0 ? 50 : 0
      const width = overlapping.length > 0 ? 48 : 100
      
      result.push({ ...activity, left, width })
    }
    
    return result
  }, [positionedActivities])

  const getActivityLabel = (activity: TimelineActivity) => {
    const type = activity.type as ActivityType
    let label = ActivityTypeLabels[type] || activity.type
    
    if (activity.type === 'BOTTLE' && activity.milkAmount) {
      label += ` ${activity.milkAmount}ml`
    } else if (activity.type === 'DIAPER') {
      if (activity.hasPoop && activity.hasPee) {
        label = '大小便'
      } else if (activity.hasPoop) {
        label = '大便'
      } else if (activity.hasPee) {
        label = '小便'
      }
    } else if (activity.duration) {
      label += ` ${activity.duration}分钟`
    }
    
    return label
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
      {/* 时间刻度 */}
      <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
        {/* 小时线和标签 */}
        {hours.map(hour => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700"
            style={{ top: hour * HOUR_HEIGHT }}
          >
            <span className="absolute -top-2.5 left-2 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 px-1">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}
        
        {/* 半小时虚线 */}
        {hours.map(hour => (
          <div
            key={`${hour}-half`}
            className="absolute left-12 right-0 border-t border-dashed border-gray-50 dark:border-gray-700/50"
            style={{ top: hour * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
          />
        ))}

        {/* 活动块 */}
        <div className="absolute left-14 right-2 top-0 bottom-0">
          {layoutActivities.map(activity => {
            const colors = activityColors[activity.type] || defaultColor
            
            return (
              <button
                key={activity.id}
                onClick={() => onActivityClick?.(activity)}
                className={`absolute rounded-lg border-l-4 px-2 py-1 overflow-hidden transition-all hover:shadow-md hover:z-10 ${colors.bg} ${colors.border}`}
                style={{
                  top: activity.top,
                  height: activity.height,
                  left: `${activity.left}%`,
                  width: `${activity.width}%`,
                }}
              >
                <div className="flex items-center gap-1 h-full">
                  <ActivityIcon
                    type={activity.type as ActivityType}
                    size={activity.height > 40 ? 18 : 14}
                    className={colors.text}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-xs font-medium truncate ${colors.text}`}>
                      {getActivityLabel(activity)}
                    </p>
                    {activity.height > 40 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(activity.startTime, 'HH:mm')}
                        {activity.duration ? ` - ${format(activity.endTime, 'HH:mm')}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

