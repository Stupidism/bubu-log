'use client'

import { useState, useMemo } from 'react'
import { TimeRangeInput } from '../TimeRangeInput'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType } from '@/types/activity'
import { differenceInMinutes, subMinutes } from 'date-fns'

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

export function SleepEndForm({ startTime: propStartTime, onSubmit, onCancel, initialValues, isEditing }: SleepEndFormProps) {
  // 如果有传入的开始时间（从入睡状态过来），使用它
  // 否则根据 initialValues 或默认60分钟来计算
  const defaultDuration = initialValues?.duration || 60
  const initialStart = propStartTime || initialValues?.recordTime || subMinutes(new Date(), defaultDuration)
  const initialEnd = propStartTime 
    ? new Date() 
    : (initialValues?.recordTime 
        ? new Date(initialValues.recordTime.getTime() + defaultDuration * 60 * 1000)
        : new Date())

  const [sleepStartTime, setSleepStartTime] = useState(initialStart)
  const [sleepEndTime, setSleepEndTime] = useState(initialEnd)

  // 计算时长
  const duration = useMemo(() => {
    const mins = differenceInMinutes(sleepEndTime, sleepStartTime)
    return Math.max(0, mins)
  }, [sleepStartTime, sleepEndTime])

  const handleSubmit = () => {
    if (duration <= 0) return
    onSubmit({
      recordTime: sleepStartTime, // 开始时间作为记录时间
      duration,
    })
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
        <ActivityIcon type={ActivityType.SLEEP} size={48} className="text-indigo-500" />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          睡醒
        </h3>
      </div>

      {/* 时间范围输入 */}
      <TimeRangeInput
        startTime={sleepStartTime}
        endTime={sleepEndTime}
        onStartTimeChange={setSleepStartTime}
        onEndTimeChange={setSleepEndTime}
        startLabel="入睡时间"
        endLabel="睡醒时间"
        color="amber"
      />

      {/* 睡眠时长显示 */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 text-center">
        <p className="text-lg text-indigo-600 dark:text-indigo-400 mb-2">睡眠时长</p>
        <p className="text-5xl font-bold text-indigo-700 dark:text-indigo-300">
          {formatDuration(duration)}
        </p>
      </div>

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
          disabled={duration <= 0}
          className={`p-4 rounded-2xl font-semibold text-lg transition-all ${
            duration > 0
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
