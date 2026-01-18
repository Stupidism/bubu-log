'use client'

import { useMemo } from 'react'
import { format, addMinutes, differenceInMinutes } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface TimeAdjusterProps {
  time: Date
  onTimeChange: (newTime: Date) => void
  showDate?: boolean // 是否显示日期，默认不显示
}

// 只保留向前调整的按钮和+1分钟
const adjustments = [
  { label: '-1小时', minutes: -60 },
  { label: '-15分钟', minutes: -15 },
  { label: '-5分钟', minutes: -5 },
  { label: '+1分钟', minutes: 1 },
]

export function TimeAdjuster({ time, onTimeChange, showDate = false }: TimeAdjusterProps) {
  const now = useMemo(() => new Date(), [])
  
  // 计算 slider 的值（0-12，每步5分钟，0=1小时前，12=现在）
  const minutesAgo = differenceInMinutes(now, time)
  const sliderValue = Math.max(0, Math.min(12, Math.round((60 - minutesAgo) / 5)))
  
  const handleAdjust = (minutes: number) => {
    const newTime = addMinutes(time, minutes)
    // 不允许超过当前时间
    if (newTime > now) {
      onTimeChange(now)
    } else {
      onTimeChange(newTime)
    }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    // value: 0 = 1小时前, 12 = 现在（每步5分钟）
    const minutesFromNow = (12 - value) * 5
    const newTime = addMinutes(now, -minutesFromNow)
    onTimeChange(newTime)
  }

  const resetToNow = () => {
    onTimeChange(new Date())
  }

  // 格式化 slider 显示的时间差
  const formatTimeDiff = () => {
    const diff = differenceInMinutes(now, time)
    if (diff <= 0) return '现在'
    if (diff < 60) return `${diff}分钟前`
    const hours = Math.floor(diff / 60)
    const mins = diff % 60
    if (mins === 0) return `${hours}小时前`
    return `${hours}小时${mins}分钟前`
  }

  return (
    <div className="space-y-4">
      {/* 当前时间显示 - 不显示日期 */}
      <div className="text-center">
        <button
          onClick={resetToNow}
          className="text-5xl font-bold text-gray-800 dark:text-gray-100 hover:text-primary transition-colors tracking-wider"
        >
          {format(time, 'HH:mm', { locale: zhCN })}
        </button>
        {showDate && (
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            {format(time, 'M月d日 EEEE', { locale: zhCN })}
          </p>
        )}
        <p className="text-base text-primary font-medium mt-1">
          {formatTimeDiff()}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          点击时间重置为现在
        </p>
      </div>

      {/* 时间滑块 - 5分钟间隔 */}
      <div className="px-2">
        <input
          type="range"
          min="0"
          max="12"
          step="1"
          value={sliderValue}
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
          <span>1小时前</span>
          <span>现在</span>
        </div>
      </div>

      {/* 时间微调按钮 - 放大字体 */}
      <div className="grid grid-cols-4 gap-2">
        {adjustments.map(({ label, minutes }) => {
          // +1分钟按钮在时间已是现在时禁用
          const isDisabled = minutes > 0 && minutesAgo <= 0
          
          return (
            <button
              key={label}
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
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
