'use client'

import { format, addMinutes } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface TimeAdjusterProps {
  time: Date
  onTimeChange: (newTime: Date) => void
}

const adjustments = [
  { label: '-1小时', minutes: -60 },
  { label: '-15分', minutes: -15 },
  { label: '-5分', minutes: -5 },
  { label: '-1分', minutes: -1 },
  { label: '+1分', minutes: 1 },
  { label: '+5分', minutes: 5 },
  { label: '+15分', minutes: 15 },
  { label: '+1小时', minutes: 60 },
]

export function TimeAdjuster({ time, onTimeChange }: TimeAdjusterProps) {
  const handleAdjust = (minutes: number) => {
    const newTime = addMinutes(time, minutes)
    onTimeChange(newTime)
  }

  const resetToNow = () => {
    onTimeChange(new Date())
  }

  return (
    <div className="space-y-3">
      {/* 当前时间显示 */}
      <div className="text-center">
        <button
          onClick={resetToNow}
          className="text-2xl font-bold text-gray-800 dark:text-gray-100 hover:text-primary transition-colors"
        >
          {format(time, 'HH:mm', { locale: zhCN })}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {format(time, 'M月d日 EEEE', { locale: zhCN })}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          点击时间重置为现在
        </p>
      </div>

      {/* 时间调整按钮 */}
      <div className="grid grid-cols-4 gap-2">
        {adjustments.map(({ label, minutes }) => (
          <button
            key={label}
            onClick={() => handleAdjust(minutes)}
            className={`time-adjust-btn text-sm ${
              minutes < 0
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
