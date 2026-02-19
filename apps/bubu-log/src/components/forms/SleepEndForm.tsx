'use client'

import { useState, useMemo } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType } from '@/types/activity'
import { dayjs, calculateDurationMinutes } from '@/lib/dayjs'

interface SleepEndFormProps {
  sleepStartTime?: Date
  onSubmit: (data: {
    startTime: Date
    endTime: Date
  }) => void
  onCancel: () => void
  initialValues?: {
    startTime?: Date
    endTime?: Date
  }
  isEditing?: boolean
}

export function SleepEndForm({ sleepStartTime: propStartTime, onSubmit, onCancel, initialValues, isEditing }: SleepEndFormProps) {
  // 计算初始的开始时间和结束时间
  const initialEndTime = useMemo(() => {
    // 如果有 initialValues.endTime，使用它
    if (initialValues?.endTime) return initialValues.endTime
    return new Date()
  }, [initialValues])
  
  const initialStartTime = useMemo(() => {
    // 优先使用 propStartTime（从入睡状态过来）
    if (propStartTime) return propStartTime
    // 其次使用 initialValues 的 startTime
    if (initialValues?.startTime) return initialValues.startTime
    // 否则默认1小时前
    return dayjs().subtract(60, 'minute').toDate()
  }, [propStartTime, initialValues])
  
  const [sleepStartTime, setSleepStartTime] = useState(initialStartTime)
  const [sleepEndTime, setSleepEndTime] = useState(initialEndTime)

  // 是否有开始时间（是否从入睡状态过来）- 此时开始时间不可编辑
  const hasFixedStartTime = !!propStartTime

  // 计算时长
  const duration = calculateDurationMinutes(sleepStartTime, sleepEndTime)

  const handleSubmit = () => {
    if (duration <= 0) return
    onSubmit({
      startTime: sleepStartTime,
      endTime: sleepEndTime,
    })
  }

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

  // 当开始时间改变时，确保结束时间不早于开始时间
  const handleStartTimeChange = (newStartTime: Date) => {
    setSleepStartTime(newStartTime)
    if (newStartTime > sleepEndTime) {
      setSleepEndTime(newStartTime)
    }
  }

  // 当结束时间改变时，确保不早于开始时间
  const handleEndTimeChange = (newEndTime: Date) => {
    if (newEndTime >= sleepStartTime) {
      setSleepEndTime(newEndTime)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 活动图标和名称 */}
      <div className="text-center flex flex-col items-center">
        <ActivityIcon type={ActivityType.SLEEP} size={48} className="text-sky-500" />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          睡醒
        </h3>
      </div>

      {/* 开始时间（入睡时间） */}
      {hasFixedStartTime ? (
        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-4 text-center">
          <p className="text-base text-sky-600 dark:text-sky-400 mb-1">入睡时间</p>
          <p className="text-3xl font-bold text-sky-700 dark:text-sky-300">
            {sleepStartTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-sm text-sky-500 dark:text-sky-400 mt-1">
            （已记录，不可修改）
          </p>
        </div>
      ) : (
        <TimeAdjuster 
          time={sleepStartTime} 
          onTimeChange={handleStartTimeChange}
          label="入睡时间"
          maxTime={sleepEndTime}
        />
      )}

      {/* 结束时间（睡醒时间） */}
      <TimeAdjuster 
        time={sleepEndTime} 
        onTimeChange={handleEndTimeChange}
        label="睡醒时间"
        minTime={sleepStartTime}
      />

      {/* 睡眠时长显示 */}
      <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-6 text-center">
        <p className="text-lg text-sky-600 dark:text-sky-400 mb-2">睡眠时长</p>
        <p className="text-5xl font-bold text-sky-700 dark:text-sky-300">
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
              ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
