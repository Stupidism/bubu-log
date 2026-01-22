'use client'

import { useState, useEffect } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { SliderInput } from '../SliderInput'
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
  initialValues?: {
    recordTime?: Date
    duration?: number
  }
  isEditing?: boolean
}

// 各活动类型的配置：默认时长、最小间隔、范围
interface ActivityConfig {
  defaultDuration: number
  step: number
  min: number
  max: number
}

const ACTIVITY_CONFIGS: Partial<Record<ActivityType, ActivityConfig>> = {
  [ActivityType.HEAD_LIFT]: {
    defaultDuration: 5,
    step: 1,    // 抬头：1分钟间隔
    min: 1,
    max: 30,
  },
  [ActivityType.PASSIVE_EXERCISE]: {
    defaultDuration: 10,
    step: 2,    // 被动操：2分钟间隔
    min: 2,
    max: 30,
  },
  [ActivityType.GAS_EXERCISE]: {
    defaultDuration: 10,
    step: 2,    // 排气操：2分钟间隔
    min: 2,
    max: 30,
  },
  [ActivityType.BATH]: {
    defaultDuration: 15,
    step: 5,    // 洗澡：5分钟间隔
    min: 5,
    max: 60,
  },
  [ActivityType.OUTDOOR]: {
    defaultDuration: 30,
    step: 5,    // 晒太阳：5分钟间隔
    min: 5,
    max: 120,
  },
  [ActivityType.EARLY_EDUCATION]: {
    defaultDuration: 20,
    step: 5,    // 早教：5分钟间隔
    min: 5,
    max: 60,
  },
}

const DEFAULT_CONFIG: ActivityConfig = {
  defaultDuration: 10,
  step: 5,
  min: 5,
  max: 60,
}

const STORAGE_KEY_PREFIX = 'activity_duration_'

export function ActivityDurationForm({ type, onSubmit, onCancel, initialValues, isEditing }: ActivityDurationFormProps) {
  const config = ACTIVITY_CONFIGS[type] || DEFAULT_CONFIG
  
  const [recordTime, setRecordTime] = useState(initialValues?.recordTime || new Date())
  const [duration, setDuration] = useState<number>(initialValues?.duration || config.defaultDuration)
  const [rememberSelection, setRememberSelection] = useState(false)

  // 加载保存的偏好设置（仅在新建时）
  useEffect(() => {
    if (isEditing) return
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${type}`)
      if (saved) {
        const savedData = JSON.parse(saved)
        if (savedData.rememberSelection && !initialValues) {
          setDuration(savedData.duration)
          setRememberSelection(true)
        } else if (!initialValues) {
          setDuration(config.defaultDuration)
        }
      } else if (!initialValues) {
        setDuration(config.defaultDuration)
      }
    } catch (e) {
      console.error('Failed to load preferences:', e)
      if (!initialValues) {
        setDuration(config.defaultDuration)
      }
    }
  }, [type, config.defaultDuration, isEditing, initialValues])

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
        <ActivityIcon type={type} size={48} className="text-amber-500" />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          {ActivityTypeLabels[type]}
        </h3>
      </div>

      <TimeAdjuster time={recordTime} onTimeChange={setRecordTime} />

      {/* 时长选择 - 使用滑块 */}
      {needsDuration && (
        <div className="space-y-3">
          <SliderInput
            value={duration}
            onChange={setDuration}
            min={config.min}
            max={config.max}
            step={config.step}
            unit="分钟"
            label="持续时长"
            color="amber"
          />

          {/* 记住选择 */}
          <button
            onClick={() => rememberSelection ? clearPreferences() : savePreferences()}
            className="flex items-center gap-2 py-2 px-1 text-base transition-all"
          >
            {rememberSelection ? (
              <Check size={20} className="text-green-500" />
            ) : (
              <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600" />
            )}
            <span className={rememberSelection ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
              记住当前选择
            </span>
          </button>
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
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
