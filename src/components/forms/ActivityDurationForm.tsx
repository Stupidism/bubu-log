'use client'

import { useState } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { ActivityType, ActivityTypeLabels, ActivityIcons } from '@/types/activity'

interface ActivityDurationFormProps {
  type: ActivityType
  onSubmit: (data: {
    recordTime: Date
    duration?: number
  }) => void
  onCancel: () => void
}

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60]

export function ActivityDurationForm({ type, onSubmit, onCancel }: ActivityDurationFormProps) {
  const [recordTime, setRecordTime] = useState(new Date())
  const [duration, setDuration] = useState<number | undefined>(undefined)

  const handleSubmit = () => {
    onSubmit({
      recordTime,
      duration,
    })
  }

  // 根据活动类型决定是否需要选择时长
  const needsDuration = [
    ActivityType.PASSIVE_EXERCISE,
    ActivityType.GAS_EXERCISE,
    ActivityType.BATH,
    ActivityType.OUTDOOR,
    ActivityType.EARLY_EDUCATION,
  ].includes(type)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 活动图标和名称 */}
      <div className="text-center">
        <span className="text-5xl">{ActivityIcons[type]}</span>
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          {ActivityTypeLabels[type]}
        </h3>
      </div>

      <TimeAdjuster time={recordTime} onTimeChange={setRecordTime} />

      {/* 时长选择（可选） */}
      {needsDuration && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            持续时长（可选）
          </p>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(duration === d ? undefined : d)}
                className={`p-3 rounded-xl text-sm font-semibold transition-all ${
                  duration === d
                    ? 'bg-amber-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {d}分钟
              </button>
            ))}
            <button
              onClick={() => setDuration(undefined)}
              className={`p-3 rounded-xl text-sm font-semibold transition-all ${
                duration === undefined
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              不记录
            </button>
          </div>
        </div>
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
          确认记录
        </button>
      </div>
    </div>
  )
}

