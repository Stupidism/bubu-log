'use client'

import { useState, useEffect } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { Check } from 'lucide-react'

interface ActivityDurationFormProps {
  type: ActivityType
  onSubmit: (data: {
    recordTime: Date
    duration?: number
  }) => void
  onCancel: () => void
}

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60]

// 各活动类型的默认时长
const DEFAULT_DURATIONS: Partial<Record<ActivityType, number>> = {
  [ActivityType.HEAD_LIFT]: 5,
  [ActivityType.PASSIVE_EXERCISE]: 10,
  [ActivityType.GAS_EXERCISE]: 10,
  [ActivityType.BATH]: 15,
  [ActivityType.OUTDOOR]: 30,
  [ActivityType.EARLY_EDUCATION]: 20,
}

const STORAGE_KEY_PREFIX = 'activity_duration_'

export function ActivityDurationForm({ type, onSubmit, onCancel }: ActivityDurationFormProps) {
  const [recordTime, setRecordTime] = useState(new Date())
  const [duration, setDuration] = useState<number | undefined>(undefined)
  const [rememberSelection, setRememberSelection] = useState(false)

  // 加载保存的偏好设置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${type}`)
      if (saved) {
        const savedData = JSON.parse(saved)
        if (savedData.rememberSelection) {
          setDuration(savedData.duration)
          setRememberSelection(true)
        } else {
          // 使用默认值
          setDuration(DEFAULT_DURATIONS[type])
        }
      } else {
        // 使用默认值
        setDuration(DEFAULT_DURATIONS[type])
      }
    } catch (e) {
      console.error('Failed to load preferences:', e)
      setDuration(DEFAULT_DURATIONS[type])
    }
  }, [type])

  // 保存偏好设置
  const savePreferences = () => {
    const newPrefs = {
      rememberSelection: true,
      duration,
    }
    setRememberSelection(true)
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, JSON.stringify(newPrefs))
  }

  // 清除偏好设置
  const clearPreferences = () => {
    setRememberSelection(false)
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${type}`)
  }

  const handleSubmit = () => {
    onSubmit({
      recordTime,
      duration,
    })
  }

  // 根据活动类型决定是否需要选择时长
  const needsDuration = [
    ActivityType.HEAD_LIFT,
    ActivityType.PASSIVE_EXERCISE,
    ActivityType.GAS_EXERCISE,
    ActivityType.BATH,
    ActivityType.OUTDOOR,
    ActivityType.EARLY_EDUCATION,
  ].includes(type)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 活动图标和名称 */}
      <div className="text-center flex flex-col items-center">
        <ActivityIcon type={type} size={48} className="text-gray-700 dark:text-gray-200" />
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

          {/* 记住选择 */}
          <div className="flex items-center justify-between py-2 px-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">记住当前选择</span>
            <button
              onClick={() => rememberSelection ? clearPreferences() : savePreferences()}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                rememberSelection
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {rememberSelection && <Check size={14} />}
              {rememberSelection ? '已保存' : '保存'}
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
