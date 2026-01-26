'use client'

import { useMemo, useRef, useImperativeHandle, forwardRef, useEffect, useState, useCallback } from 'react'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { ActivityIcon } from './ActivityIcon'
import type { Activity } from '@/lib/api/hooks'
import { dayjs, calculateDurationMinutes, formatTime } from '@/lib/dayjs'

interface DayTimelineProps {
  activities: Activity[]
  date: Date
  onActivityClick?: (activity: Activity) => void
  showCurrentTime?: boolean
  /** 长按空白处时触发，传入选中的时间 */
  onLongPressBlank?: (time: Date) => void
}

export interface DayTimelineRef {
  scrollToCurrentTime: () => void
}

// 活动类型对应的颜色
const activityColors: Record<string, { bg: string; border: string; text: string; divider?: string }> = {
  SLEEP: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', border: 'border-indigo-400', text: 'text-indigo-700 dark:text-indigo-300' },
  BREASTFEED: { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-400', text: 'text-pink-700 dark:text-pink-300' },
  BOTTLE: { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300' },
  DIAPER: { bg: 'bg-teal-100 dark:bg-teal-900/40', border: 'border-teal-400', text: 'text-teal-700 dark:text-teal-300', divider: 'bg-yellow-400' },
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
// 有时长活动的最小高度（确保能显示内容）
const MIN_DURATION_BLOCK_HEIGHT = 15
// 线条类型活动（换尿布）不需要时长

export const DayTimeline = forwardRef<DayTimelineRef, DayTimelineProps>(
  function DayTimeline({ activities, date, onActivityClick, showCurrentTime = false, onLongPressBlank }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const currentTimeRef = useRef<HTMLDivElement>(null)
    const [currentMinutes, setCurrentMinutes] = useState(() => {
      const now = new Date()
      return now.getHours() * 60 + now.getMinutes()
    })
    
    // 长按检测状态
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const longPressTriggered = useRef(false)
    const touchStartPos = useRef<{ x: number; y: number; offsetY: number } | null>(null)

    // 更新当前时间（每分钟）
    useEffect(() => {
      if (!showCurrentTime) return
      
      const updateTime = () => {
        const now = new Date()
        setCurrentMinutes(now.getHours() * 60 + now.getMinutes())
      }
      
      const interval = setInterval(updateTime, 60000)
      return () => clearInterval(interval)
    }, [showCurrentTime])

    // 暴露滚动方法
    useImperativeHandle(ref, () => ({
      scrollToCurrentTime: () => {
        if (currentTimeRef.current) {
          currentTimeRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }
    }))

    // 根据 Y 偏移计算时间
    const calculateTimeFromY = useCallback((offsetY: number) => {
      const minutes = (offsetY / HOUR_HEIGHT) * 60
      const dayStart = dayjs(date).startOf('day')
      return dayStart.add(Math.round(minutes / 5) * 5, 'minute').toDate() // 四舍五入到 5 分钟
    }, [date])

    // 长按开始（在空白处）
    const handleBlankLongPressStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
      if (!onLongPressBlank) return
      
      longPressTriggered.current = false
      
      // 获取点击位置
      const target = e.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      let clientX: number, clientY: number
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }
      
      const offsetY = clientY - rect.top
      touchStartPos.current = { x: clientX, y: clientY, offsetY }
      
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true
        const selectedTime = calculateTimeFromY(offsetY)
        onLongPressBlank(selectedTime)
      }, 500)
    }, [onLongPressBlank, calculateTimeFromY])

    // 长按移动检测
    const handleBlankLongPressMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
      if (!touchStartPos.current) return
      
      let currentX: number, currentY: number
      if ('touches' in e) {
        currentX = e.touches[0].clientX
        currentY = e.touches[0].clientY
      } else {
        currentX = e.clientX
        currentY = e.clientY
      }
      
      const deltaX = Math.abs(currentX - touchStartPos.current.x)
      const deltaY = Math.abs(currentY - touchStartPos.current.y)
      
      // 滑动超过 10px，取消长按
      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
      }
    }, [])

    // 长按结束
    const handleBlankLongPressEnd = useCallback(() => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      touchStartPos.current = null
    }, [])

    // 生成小时标记 (0-23)
    const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), [])

    // 计算活动在时间线上的位置
    const positionedActivities = useMemo(() => {
      const dayStart = dayjs(date).startOf('day')
      
      return activities.map(activity => {
        const startTime = dayjs(activity.startTime)
        const minutesFromStart = startTime.diff(dayStart, 'minute')
        const top = (minutesFromStart / 60) * HOUR_HEIGHT
        
        // 换尿布是瞬时事件，显示为线条
        const isLineType = activity.type === 'DIAPER'
        
        // 计算时长：有 endTime 则计算差值，否则默认 5 分钟（非线条类型）
        const duration = activity.endTime 
          ? calculateDurationMinutes(activity.startTime, activity.endTime) 
          : (isLineType ? 0 : 5)
        
        // 线条类型固定高度为 2px，其他按时长计算（有最小高度确保可点击）
        const height = isLineType 
          ? 2 
          : Math.max((duration / 60) * HOUR_HEIGHT, MIN_DURATION_BLOCK_HEIGHT)
        
        return {
          ...activity,
          top,
          height,
          startTimeDate: startTime.toDate(),
          endTimeDate: activity.endTime ? dayjs(activity.endTime).toDate() : startTime.toDate(),
          duration,
          isLineType,
        }
      }).sort((a, b) => a.top - b.top)
    }, [activities, date])

    // 处理重叠的活动（简单实现：按顺序排列）
    const layoutActivities = useMemo(() => {
      const result: Array<typeof positionedActivities[0] & { left: number; width: number }> = []
      
      for (const activity of positionedActivities) {
        // 线条类型不参与重叠计算，始终全宽
        if (activity.isLineType) {
          result.push({ ...activity, left: 0, width: 100 })
          continue
        }
        
        // 户外活动总是在右边（因为户外时可以睡觉、换尿布等）
        if (activity.type === 'OUTDOOR') {
          result.push({ ...activity, left: 50, width: 48 })
          continue
        }
        
        // 检查是否与已有的非线条、非户外活动重叠
        const overlapping = result.filter(
          a => !a.isLineType && a.type !== 'OUTDOOR' && !(activity.top >= a.top + a.height || activity.top + activity.height <= a.top)
        )
        
        // 简单处理：如果重叠，缩小宽度并偏移
        const left = overlapping.length > 0 ? 50 : 0
        const width = overlapping.length > 0 ? 48 : 100
        
        result.push({ ...activity, left, width })
      }
      
      return result
    }, [positionedActivities])

    const getActivityLabel = (activity: typeof positionedActivities[0]) => {
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
      } else if (activity.duration && activity.duration > 0) {
        label += ` ${activity.duration}分钟`
      }
      
      return label
    }

    // 当前时间位置
    const currentTimeTop = (currentMinutes / 60) * HOUR_HEIGHT

    return (
      <div ref={containerRef} className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
        {/* 时间刻度 */}
        <div 
          className="relative" 
          style={{ height: 24 * HOUR_HEIGHT }}
          onTouchStart={handleBlankLongPressStart}
          onTouchMove={handleBlankLongPressMove}
          onTouchEnd={handleBlankLongPressEnd}
          onTouchCancel={handleBlankLongPressEnd}
          onMouseDown={handleBlankLongPressStart}
          onMouseMove={handleBlankLongPressMove}
          onMouseUp={handleBlankLongPressEnd}
          onMouseLeave={handleBlankLongPressEnd}
        >
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

          {/* 当前时间指示器 */}
          {showCurrentTime && (
            <div
              ref={currentTimeRef}
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: currentTimeTop }}
            >
              {/* 红色圆点 */}
              <div className="absolute left-1 -top-1.5 w-3 h-3 rounded-full bg-red-500 shadow-sm" />
              {/* 红色线条 */}
              <div className="absolute left-4 right-0 h-0.5 bg-red-500 shadow-sm" />
              {/* 当前时间标签 */}
              <div className="absolute right-2 -top-2.5 px-1.5 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                {formatTime(new Date())}
              </div>
            </div>
          )}

          {/* 活动块 */}
          <div className="absolute left-14 right-2 top-0 bottom-0">
            {layoutActivities.map(activity => {
              const colors = activityColors[activity.type] || defaultColor
              // 创建一个可以传递给 onActivityClick 的对象（保持原始 API 类型）
              const originalActivity: Activity = {
                id: activity.id,
                type: activity.type,
                startTime: activity.startTime,
                endTime: activity.endTime,
                createdAt: activity.createdAt,
                updatedAt: activity.updatedAt,
                milkAmount: activity.milkAmount,
                hasPoop: activity.hasPoop,
                hasPee: activity.hasPee,
                poopColor: activity.poopColor,
                peeAmount: activity.peeAmount,
                notes: activity.notes,
              }
              
              // 线条类型（换尿布）：显示为水平线 + 标签
              if (activity.isLineType) {
                return (
                  <button
                    key={activity.id}
                    onClick={() => onActivityClick?.(originalActivity)}
                    className="absolute left-0 right-0 group z-10 hover:z-20"
                    style={{ top: activity.top }}
                  >
                    {/* 水平线 - 绝对定位在顶部，确保线条对准时间点 */}
                    <div className={`absolute left-0 right-0 top-0 h-0.5 ${colors.divider} group-hover:h-1 transition-all -translate-y-1/2`} />
                    {/* 标签 - 在线条右侧，垂直居中于线条 */}
                    <div className={`absolute right-0 top-0 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full ${colors.bg} ${colors.border} border shadow-sm group-hover:shadow-md transition-all`}>
                      <ActivityIcon
                        type={activity.type as ActivityType}
                        size={12}
                        className={colors.text}
                      />
                      <span className={`text-xs font-medium whitespace-nowrap ${colors.text}`}>
                        {getActivityLabel(activity)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatTime(activity.startTimeDate)}
                      </span>
                    </div>
                  </button>
                )
              }
              
              // 块类型（睡眠、喂奶等）：严格按时长显示高度
              // 户外活动：虚线边框、半透明、悬浮在其他色块之上但在换尿布线下面
              const isOutdoor = activity.type === 'OUTDOOR'
              return (
                <button
                  key={activity.id}
                  onClick={() => onActivityClick?.(originalActivity)}
                  className={`absolute rounded-lg px-2 py-1 overflow-hidden transition-all hover:shadow-md ${colors.bg} ${
                    isOutdoor 
                      ? `border-2 border-dashed ${colors.border} z-[5] hover:z-[6]` 
                      : `border-l-4 ${colors.border} hover:z-10`
                  }`}
                  style={{
                    top: activity.top,
                    height: activity.height,
                    left: `${activity.left}%`,
                    width: `${activity.width}%`,
                    ...(isOutdoor ? { opacity: 0.7 } : {}),
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
                          {formatTime(activity.startTimeDate)}
                          {activity.duration > 0 ? ` - ${formatTime(activity.endTimeDate)}` : ''}
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
)
