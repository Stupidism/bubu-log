'use client'

import { useMemo } from 'react'
import { dayjs, formatTime, formatDateChinese, formatWeekday, addMinutes, differenceInMinutes } from '@/lib/dayjs'

interface TimeAdjusterProps {
  time: Date
  onTimeChange: (newTime: Date) => void
  showDate?: boolean // 是否显示日期，默认不显示
  label?: string // 显示的标签（如"开始时间"、"结束时间"）
  minTime?: Date // 最小时间限制
  maxTime?: Date // 最大时间限制（默认为当前时间，非当天则为当天结束）
  compact?: boolean // 紧凑模式（隐藏 slider 和相对时间）
}

// 今天模式的调整按钮（限制在当前时间之前）
const todayAdjustments = [
  { label: '-1小时', minutes: -60 },
  { label: '-15分钟', minutes: -15 },
  { label: '-5分钟', minutes: -5 },
  { label: '+1分钟', minutes: 1 },
]

// 全天模式的调整按钮（可以前后调整，两行显示）
const fullDayAdjustmentsRow1 = [
  { label: '-1小时', minutes: -60 },
  { label: '-15分钟', minutes: -15 },
  { label: '+15分钟', minutes: 15 },
  { label: '+1小时', minutes: 60 },
]

const fullDayAdjustmentsRow2 = [
  { label: '-5分钟', minutes: -5 },
  { label: '-1分钟', minutes: -1 },
  { label: '+1分钟', minutes: 1 },
  { label: '+5分钟', minutes: 5 },
]

export function TimeAdjuster({ 
  time, 
  onTimeChange, 
  showDate = false, 
  label,
  minTime,
  maxTime,
  compact = false
}: TimeAdjusterProps) {
  const now = useMemo(() => new Date(), [])
  
  // 判断时间是否是今天
  const isToday = useMemo(() => {
    return dayjs(time).isSame(dayjs(), 'day')
  }, [time])
  
  // 全天模式：当日期不是今天时启用
  const isFullDayMode = !isToday
  
  // 计算有效的最大时间
  // - 今天模式：默认为当前时间
  // - 全天模式：默认为当天 23:59
  const effectiveMaxTime = useMemo(() => {
    if (maxTime) return maxTime
    if (isFullDayMode) {
      return dayjs(time).endOf('day').toDate()
    }
    return now
  }, [maxTime, isFullDayMode, time, now])
  
  // 计算有效的最小时间
  // - 全天模式：默认为当天 00:00
  const effectiveMinTime = useMemo(() => {
    if (minTime) return minTime
    if (isFullDayMode) {
      return dayjs(time).startOf('day').toDate()
    }
    return undefined
  }, [minTime, isFullDayMode, time])
  
  // 全天模式 slider: 0-24 小时，每步30分钟
  // 今天模式 slider: 0-12，每步5分钟（1小时范围）
  const sliderConfig = useMemo(() => {
    if (isFullDayMode) {
      const startOfDay = dayjs(time).startOf('day')
      const minutesFromStart = dayjs(time).diff(startOfDay, 'minute')
      // 48 步，每步30分钟 = 24小时
      const value = Math.round(minutesFromStart / 30)
      return { min: 0, max: 48, value: Math.max(0, Math.min(48, value)), step: 30 }
    } else {
      const minutesAgo = differenceInMinutes(effectiveMaxTime, time)
      const value = Math.max(0, Math.min(12, Math.round((60 - minutesAgo) / 5)))
      return { min: 0, max: 12, value, step: 5 }
    }
  }, [isFullDayMode, time, effectiveMaxTime])
  
  const handleAdjust = (minutes: number) => {
    let newTime = addMinutes(time, minutes)
    // 不允许超过最大时间
    if (newTime > effectiveMaxTime) {
      newTime = effectiveMaxTime
    }
    // 不允许早于最小时间
    if (effectiveMinTime && newTime < effectiveMinTime) {
      newTime = effectiveMinTime
    }
    onTimeChange(newTime)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    let newTime: Date
    
    if (isFullDayMode) {
      // 全天模式：从当天 00:00 开始计算
      const startOfDay = dayjs(time).startOf('day')
      newTime = startOfDay.add(value * 30, 'minute').toDate()
    } else {
      // 今天模式：从最大时间向前计算
      const minutesFromMax = (12 - value) * 5
      newTime = addMinutes(effectiveMaxTime, -minutesFromMax)
    }
    
    // 边界检查
    if (effectiveMinTime && newTime < effectiveMinTime) {
      newTime = effectiveMinTime
    }
    if (newTime > effectiveMaxTime) {
      newTime = effectiveMaxTime
    }
    
    onTimeChange(newTime)
  }

  const resetToNow = () => {
    if (isFullDayMode) {
      // 全天模式：重置到中午12点
      const noon = dayjs(time).hour(12).minute(0).second(0).toDate()
      onTimeChange(noon)
    } else {
      // 今天模式：重置到当前时间
      const newTime = new Date()
      if (effectiveMinTime && newTime < effectiveMinTime) {
        onTimeChange(effectiveMinTime)
      } else if (newTime > effectiveMaxTime) {
        onTimeChange(effectiveMaxTime)
      } else {
        onTimeChange(newTime)
      }
    }
  }

  // 格式化 slider 显示的时间差
  const formatTimeDiff = () => {
    if (isFullDayMode) {
      // 全天模式：显示日期
      return formatDateChinese(time)
    }
    const diff = differenceInMinutes(now, time)
    if (diff <= 0) return '现在'
    if (diff < 60) return `${diff}分钟前`
    const hours = Math.floor(diff / 60)
    const mins = diff % 60
    if (mins === 0) return `${hours}小时前`
    return `${hours}小时${mins}分钟前`
  }

  // 检查是否可以增加时间
  const canIncrease = differenceInMinutes(effectiveMaxTime, time) > 0
  // 检查是否可以减少时间
  const canDecrease = !effectiveMinTime || differenceInMinutes(time, effectiveMinTime) > 0

  // 根据模式选择调整按钮
  const adjustments = isFullDayMode ? fullDayAdjustmentsRow1 : todayAdjustments
  const adjustmentsRow2 = isFullDayMode ? fullDayAdjustmentsRow2 : null

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {/* 标签 */}
      {label && (
        <p className="text-base font-medium text-gray-600 dark:text-gray-400 text-center">
          {label}
        </p>
      )}
      
      {/* 当前时间显示 */}
      <div className="text-center">
        <button
          onClick={resetToNow}
          className={`font-bold text-gray-800 dark:text-gray-100 hover:text-primary transition-colors tracking-wider ${
            compact ? 'text-3xl' : 'text-5xl'
          }`}
        >
          {formatTime(time)}
        </button>
        {showDate && (
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            {formatDateChinese(time)} {formatWeekday(time)}
          </p>
        )}
        {!compact && (
          <>
            <p className="text-base text-primary font-medium mt-1">
              {formatTimeDiff()}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {isFullDayMode ? '点击时间重置为中午' : '点击时间重置为现在'}
            </p>
          </>
        )}
      </div>

      {/* 时间滑块（紧凑模式下隐藏） */}
      {!compact && (
        <div className="px-2">
          <input
            type="range"
            min={sliderConfig.min}
            max={sliderConfig.max}
            step="1"
            value={sliderConfig.value}
            onChange={handleSliderChange}
            className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-8
              [&::-webkit-slider-thumb]:h-8
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-8
              [&::-moz-range-thumb]:h-8
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-primary
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1 px-1">
            {isFullDayMode ? (
              <>
                <span>00:00</span>
                <span>12:00</span>
                <span>24:00</span>
              </>
            ) : (
              <>
                <span>1小时前</span>
                <span>现在</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 时间微调按钮 */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2">
          {adjustments.map(({ label: btnLabel, minutes }) => {
            // 根据方向判断是否禁用
            const isDisabled = minutes > 0 ? !canIncrease : !canDecrease
            
            return (
              <button
                key={btnLabel}
                onClick={() => handleAdjust(minutes)}
                disabled={isDisabled}
                className={`p-3 rounded-xl text-base font-semibold transition-all ${
                  isDisabled
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : minutes < 0
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 active:scale-95'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 active:scale-95'
                }`}
              >
                {btnLabel}
              </button>
            )
          })}
        </div>
        {/* 第二行精确调整按钮（全天模式专用） */}
        {adjustmentsRow2 && (
          <div className="grid grid-cols-4 gap-2">
            {adjustmentsRow2.map(({ label: btnLabel, minutes }) => {
              const isDisabled = minutes > 0 ? !canIncrease : !canDecrease
              
              return (
                <button
                  key={btnLabel}
                  onClick={() => handleAdjust(minutes)}
                  disabled={isDisabled}
                  className={`p-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isDisabled
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : minutes < 0
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 active:scale-95'
                        : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 active:scale-95'
                  }`}
                >
                  {btnLabel}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
