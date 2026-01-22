'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, differenceInMinutes, addMinutes, subMinutes, setHours, setMinutes } from 'date-fns'
import { ChevronUp, ChevronDown, Clock } from 'lucide-react'

interface TimeRangeInputProps {
  startTime: Date
  endTime: Date
  onStartTimeChange: (time: Date) => void
  onEndTimeChange: (time: Date) => void
  startLabel?: string
  endLabel?: string
  color?: 'pink' | 'blue' | 'amber' | 'green' | 'gray'
}

// 快速调整按钮配置
const quickAdjustments = [
  { label: '-30分', minutes: -30 },
  { label: '-5分', minutes: -5 },
  { label: '+5分', minutes: 5 },
  { label: '+30分', minutes: 30 },
]

const colorStyles = {
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800',
    accent: 'bg-pink-500',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    accent: 'bg-blue-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    accent: 'bg-amber-500',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    accent: 'bg-green-500',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
    accent: 'bg-gray-500',
  },
}

export function TimeRangeInput({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startLabel = '开始时间',
  endLabel = '结束时间',
  color = 'gray',
}: TimeRangeInputProps) {
  const [editingField, setEditingField] = useState<'start' | 'end' | null>(null)
  
  const styles = colorStyles[color]

  // 计算时长
  const duration = useMemo(() => {
    const mins = differenceInMinutes(endTime, startTime)
    return Math.max(0, mins)
  }, [startTime, endTime])

  // 格式化时长显示
  const formatDuration = (mins: number) => {
    if (mins <= 0) return '0分钟'
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    if (hours > 0 && minutes > 0) {
      return `${hours}小时${minutes}分钟`
    } else if (hours > 0) {
      return `${hours}小时`
    } else {
      return `${minutes}分钟`
    }
  }

  // 调整开始时间
  const adjustStartTime = (minutes: number) => {
    const newStart = addMinutes(startTime, minutes)
    // 确保开始时间不晚于结束时间
    if (newStart <= endTime) {
      onStartTimeChange(newStart)
    }
  }

  // 调整结束时间
  const adjustEndTime = (minutes: number) => {
    const newEnd = addMinutes(endTime, minutes)
    // 确保结束时间不早于开始时间
    if (newEnd >= startTime) {
      onEndTimeChange(newEnd)
    }
  }

  // 处理时间选择器变化
  const handleTimeChange = (field: 'start' | 'end', timeString: string) => {
    const [hours, mins] = timeString.split(':').map(Number)
    const baseDate = field === 'start' ? startTime : endTime
    let newTime = setMinutes(setHours(baseDate, hours), mins)
    
    if (field === 'start') {
      // 如果新的开始时间晚于结束时间，调整结束时间
      if (newTime > endTime) {
        onEndTimeChange(addMinutes(newTime, 30))
      }
      onStartTimeChange(newTime)
    } else {
      // 如果新的结束时间早于开始时间，调整开始时间
      if (newTime < startTime) {
        onStartTimeChange(subMinutes(newTime, 30))
      }
      onEndTimeChange(newTime)
    }
    setEditingField(null)
  }

  return (
    <div className="space-y-4">
      {/* 时间范围显示 */}
      <div className={`rounded-2xl p-4 ${styles.bg} border ${styles.border}`}>
        <div className="flex items-center justify-between">
          {/* 开始时间 */}
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{startLabel}</p>
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => adjustStartTime(-5)}
                className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
              >
                <ChevronDown size={20} className="text-gray-400" />
              </button>
              <button
                onClick={() => setEditingField('start')}
                className={`text-3xl font-bold ${styles.text} hover:opacity-80 transition-opacity`}
              >
                {format(startTime, 'HH:mm')}
              </button>
              <button
                onClick={() => adjustStartTime(5)}
                className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
              >
                <ChevronUp size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* 箭头和时长 */}
          <div className="flex flex-col items-center px-4">
            <div className="text-2xl text-gray-400">→</div>
            <p className={`text-sm font-medium ${styles.text} mt-1`}>
              {formatDuration(duration)}
            </p>
          </div>

          {/* 结束时间 */}
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{endLabel}</p>
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => adjustEndTime(-5)}
                className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
              >
                <ChevronDown size={20} className="text-gray-400" />
              </button>
              <button
                onClick={() => setEditingField('end')}
                className={`text-3xl font-bold ${styles.text} hover:opacity-80 transition-opacity`}
              >
                {format(endTime, 'HH:mm')}
              </button>
              <button
                onClick={() => adjustEndTime(5)}
                className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
              >
                <ChevronUp size={20} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 快速调整按钮 - 开始时间 */}
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{startLabel}快速调整</p>
        <div className="grid grid-cols-4 gap-2">
          {quickAdjustments.map(({ label, minutes }) => (
            <button
              key={`start-${label}`}
              onClick={() => adjustStartTime(minutes)}
              className={`p-2 rounded-xl text-sm font-medium transition-all ${
                minutes < 0
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 快速调整按钮 - 结束时间 */}
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{endLabel}快速调整</p>
        <div className="grid grid-cols-4 gap-2">
          {quickAdjustments.map(({ label, minutes }) => (
            <button
              key={`end-${label}`}
              onClick={() => adjustEndTime(minutes)}
              className={`p-2 rounded-xl text-sm font-medium transition-all ${
                minutes < 0
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 时间选择器弹窗 */}
      {editingField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingField(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className={styles.text} />
              <p className={`text-lg font-medium ${styles.text}`}>
                选择{editingField === 'start' ? startLabel : endLabel}
              </p>
            </div>
            <input
              type="time"
              defaultValue={format(editingField === 'start' ? startTime : endTime, 'HH:mm')}
              onChange={(e) => handleTimeChange(editingField, e.target.value)}
              className="w-full p-4 text-2xl text-center rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={() => setEditingField(null)}
              className="w-full mt-4 p-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

