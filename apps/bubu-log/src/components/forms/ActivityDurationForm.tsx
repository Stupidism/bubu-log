'use client'

import { useState } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { Check } from 'lucide-react'
import { dayjs, calculateDurationMinutes } from '@/lib/dayjs'

interface ActivityDurationFormProps {
  type: ActivityType
  onSubmit: (data: {
    startTime: Date
    endTime?: Date
  }) => void
  onCancel: () => void
  initialValues?: {
    startTime?: Date
    endTime?: Date
  }
  isEditing?: boolean
}

// 各活动类型的配置：默认时长
interface ActivityConfig {
  defaultDuration: number
  color: string
}

const ACTIVITY_CONFIGS: Partial<Record<ActivityType, ActivityConfig>> = {
  [ActivityType.HEAD_LIFT]: {
    defaultDuration: 5,
    color: 'amber',
  },
  [ActivityType.PASSIVE_EXERCISE]: {
    defaultDuration: 10,
    color: 'orange',
  },
  [ActivityType.GAS_EXERCISE]: {
    defaultDuration: 10,
    color: 'amber',
  },
  [ActivityType.BATH]: {
    defaultDuration: 15,
    color: 'yellow',
  },
  [ActivityType.OUTDOOR]: {
    defaultDuration: 30,
    color: 'amber',
  },
  [ActivityType.EARLY_EDUCATION]: {
    defaultDuration: 20,
    color: 'orange',
  },
}

const DEFAULT_CONFIG: ActivityConfig = {
  defaultDuration: 10,
  color: 'amber',
}

const STORAGE_KEY_PREFIX = 'activity_duration_'

interface DurationPreferences {
  rememberSelection: boolean
  duration: number
}

interface ActivityDurationInitialState {
  rememberSelection: boolean
  startTime: Date
  endTime: Date
}

function loadDurationPreferences(type: ActivityType): DurationPreferences {
  if (typeof window === 'undefined') {
    return { rememberSelection: false, duration: 0 }
  }

  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${type}`)
    if (!saved) return { rememberSelection: false, duration: 0 }
    const parsed = JSON.parse(saved) as Partial<DurationPreferences>
    return {
      rememberSelection: Boolean(parsed.rememberSelection),
      duration: typeof parsed.duration === 'number' ? parsed.duration : 0,
    }
  } catch (e) {
    console.error('Failed to load preferences:', e)
    return { rememberSelection: false, duration: 0 }
  }
}

function getActivityDurationInitialState(
  type: ActivityType,
  defaultDuration: number,
  initialValues?: ActivityDurationFormProps['initialValues'],
  isEditing?: boolean
): ActivityDurationInitialState {
  const fallbackEndTime = initialValues?.endTime || new Date()
  const fallbackStartTime = initialValues?.startTime || dayjs(fallbackEndTime).subtract(defaultDuration, 'minute').toDate()

  if (initialValues || isEditing) {
    return {
      rememberSelection: false,
      startTime: fallbackStartTime,
      endTime: fallbackEndTime,
    }
  }

  const preferences = loadDurationPreferences(type)
  const now = dayjs()
  const duration = preferences.rememberSelection && preferences.duration > 0 ? preferences.duration : defaultDuration

  return {
    rememberSelection: preferences.rememberSelection && preferences.duration > 0,
    startTime: now.subtract(duration, 'minute').toDate(),
    endTime: now.toDate(),
  }
}

export function ActivityDurationForm({ type, onSubmit, onCancel, initialValues, isEditing }: ActivityDurationFormProps) {
  const config = ACTIVITY_CONFIGS[type] || DEFAULT_CONFIG
  const [initialState] = useState<ActivityDurationInitialState>(() =>
    getActivityDurationInitialState(type, config.defaultDuration, initialValues, isEditing)
  )
  const [rememberSelection, setRememberSelection] = useState(initialState.rememberSelection)
  const [startTime, setStartTime] = useState(initialState.startTime)
  const [endTime, setEndTime] = useState(initialState.endTime)

  // 计算时长
  const duration = calculateDurationMinutes(startTime, endTime)

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
      startTime: startTime,
      endTime: endTime,
    })
  }

  // 当开始时间改变时，确保结束时间不早于开始时间
  const handleStartTimeChange = (newStartTime: Date) => {
    setStartTime(newStartTime)
    if (newStartTime > endTime) {
      setEndTime(newStartTime)
    }
  }

  // 当结束时间改变时，确保不早于开始时间
  const handleEndTimeChange = (newEndTime: Date) => {
    if (newEndTime >= startTime) {
      setEndTime(newEndTime)
    }
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

  // 获取颜色样式
  const getColorStyles = () => {
    const colorMap: Record<string, { bg: string; text: string; textDark: string }> = {
      amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', textDark: 'text-amber-700 dark:text-amber-300' },
      yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', textDark: 'text-yellow-800 dark:text-yellow-300' },
      orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', textDark: 'text-orange-700 dark:text-orange-300' },
    }
    return colorMap[config.color] || colorMap.amber
  }

  const colorStyles = getColorStyles()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 活动图标和名称 */}
      <div className="text-center flex flex-col items-center">
        <ActivityIcon type={type} size={48} className={colorStyles.textDark} />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          {ActivityTypeLabels[type]}
        </h3>
      </div>

      {needsDuration ? (
        <>
          {/* 开始时间 */}
          <TimeAdjuster 
            time={startTime} 
            onTimeChange={handleStartTimeChange}
            label="开始时间"
            maxTime={endTime}
          />

          {/* 结束时间 */}
          <TimeAdjuster 
            time={endTime} 
            onTimeChange={handleEndTimeChange}
            label="结束时间"
            minTime={startTime}
          />

          {/* 时长显示 */}
          <div className={`${colorStyles.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-base ${colorStyles.text} mb-1`}>持续时长</p>
            <p className={`text-3xl font-bold ${colorStyles.textDark}`}>
              {formatDuration(duration)}
            </p>
          </div>

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
        </>
      ) : (
        <TimeAdjuster time={startTime} onTimeChange={setStartTime} />
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
