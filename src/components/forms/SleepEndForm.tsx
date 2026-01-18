'use client'

import { useState } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { SliderInput } from '../SliderInput'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { differenceInMinutes } from 'date-fns'

interface SleepEndFormProps {
  startTime?: Date
  onSubmit: (data: {
    recordTime: Date
    duration: number
  }) => void
  onCancel: () => void
  initialValues?: {
    recordTime?: Date
    duration?: number
  }
  isEditing?: boolean
}

// 时长调整按钮配置（只保留四种间隔）
const durationAdjustments = [
  { label: '-1小时', minutes: -60 },
  { label: '-15分钟', minutes: -15 },
  { label: '-5分钟', minutes: -5 },
  { label: '+1分钟', minutes: 1 },
]

export function SleepEndForm({ startTime, onSubmit, onCancel, initialValues, isEditing }: SleepEndFormProps) {
  const [recordTime, setRecordTime] = useState(initialValues?.recordTime || new Date())
  const [manualDuration, setManualDuration] = useState<number>(initialValues?.duration || 60) // 默认1小时
  const [durationAdjustment, setDurationAdjustment] = useState(0)

  // 是否有开始时间（是否从入睡状态过来）
  const hasStartTime = !!startTime

  // 计算时长
  const baseDuration = startTime ? differenceInMinutes(recordTime, startTime) : 0
  const actualDuration = hasStartTime 
    ? Math.max(0, baseDuration + durationAdjustment) 
    : manualDuration

  const handleSubmit = () => {
    onSubmit({
      recordTime,
      duration: actualDuration,
    })
  }

  const handleDurationAdjust = (minutes: number) => {
    if (hasStartTime) {
      setDurationAdjustment((d) => d + minutes)
    }
  }

  // 格式化时长显示
  const formatDuration = (mins: number) => {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 活动图标和名称 */}
      <div className="text-center flex flex-col items-center">
        <ActivityIcon type={ActivityType.SLEEP_END} size={48} className="text-amber-500" />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          {ActivityTypeLabels[ActivityType.SLEEP_END]}
        </h3>
      </div>

      <TimeAdjuster time={recordTime} onTimeChange={setRecordTime} />

      {hasStartTime ? (
        <>
          {/* 睡眠时长显示（有开始时间时）- 放大字体 */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 text-center">
            <p className="text-lg text-amber-600 dark:text-amber-400 mb-2">睡眠时长</p>
            <p className="text-5xl font-bold text-amber-700 dark:text-amber-300">
              {formatDuration(actualDuration)}
            </p>
          </div>

          {/* 时长调整 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-medium text-gray-600 dark:text-gray-400">
                调整睡眠时长
              </p>
              <button
                onClick={() => setDurationAdjustment(0)}
                className="text-sm px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                重置
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {durationAdjustments.map(({ label, minutes }) => (
                <button
                  key={label}
                  onClick={() => handleDurationAdjust(minutes)}
                  className={`p-3 rounded-xl text-base font-semibold transition-all ${
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
        </>
      ) : (
        <>
          {/* 手动输入睡眠时长（没有开始时间时）- 使用滑块 */}
          <SliderInput
            value={manualDuration}
            onChange={setManualDuration}
            min={15}
            max={240}
            step={15}
            unit="分钟"
            label="宝宝睡了多久"
            color="amber"
          />
        </>
      )}

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-3 pt-4">
        <button
          onClick={onCancel}
          className="p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-lg"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-lg shadow-lg"
        >
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
