'use client'

import { useState } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { SliderInput } from '../SliderInput'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { Check } from 'lucide-react'
import { dayjs, calculateDurationMinutes } from '@/lib/dayjs'

interface PumpFormProps {
  onSubmit: (data: {
    startTime: Date
    endTime?: Date
    milkAmount: number
  }) => void
  onCancel: () => void
  initialValues?: {
    startTime?: Date
    endTime?: Date
    milkAmount?: number
  }
  isEditing?: boolean
}

const STORAGE_KEY = 'pump_form_preferences'

interface Preferences {
  rememberSelection: boolean
  defaultDuration: number
  defaultMilkAmount: number
}

const DEFAULT_PREFERENCES: Preferences = {
  rememberSelection: false,
  defaultDuration: 20,
  defaultMilkAmount: 100,
}

interface PumpFormInitialState {
  preferences: Preferences
  startTime: Date
  endTime: Date
  milkAmount: number
}

function loadPumpPreferences(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_PREFERENCES
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(saved) as Partial<Preferences>) }
  } catch (e) {
    console.error('Failed to load preferences:', e)
    return DEFAULT_PREFERENCES
  }
}

function getPumpInitialState(initialValues?: PumpFormProps['initialValues'], isEditing?: boolean): PumpFormInitialState {
  const preferences = loadPumpPreferences()

  const defaultEndTime = initialValues?.endTime || new Date()
  const defaultStartTime = initialValues?.startTime || dayjs(defaultEndTime).subtract(20, 'minute').toDate()

  if (!isEditing && !initialValues && preferences.rememberSelection) {
    const now = dayjs()
    return {
      preferences,
      startTime: now.subtract(preferences.defaultDuration, 'minute').toDate(),
      endTime: now.toDate(),
      milkAmount: preferences.defaultMilkAmount,
    }
  }

  return {
    preferences,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    milkAmount: initialValues?.milkAmount || 100,
  }
}

export function PumpForm({ onSubmit, onCancel, initialValues, isEditing }: PumpFormProps) {
  const [initialState] = useState<PumpFormInitialState>(() => getPumpInitialState(initialValues, isEditing))
  const [preferences, setPreferences] = useState<Preferences>(initialState.preferences)
  const [startTime, setStartTime] = useState(initialState.startTime)
  const [endTime, setEndTime] = useState(initialState.endTime)
  const [milkAmount, setMilkAmount] = useState<number>(initialState.milkAmount)

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

  const savePreferences = () => {
    const newPrefs: Preferences = {
      rememberSelection: true,
      defaultDuration: duration,
      defaultMilkAmount: milkAmount,
    }
    setPreferences(newPrefs)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs))
  }

  const clearPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES)
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleSubmit = () => {
    if (duration <= 0 || milkAmount <= 0) return
    onSubmit({
      startTime,
      endTime,
      milkAmount,
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 活动图标和名称 */}
      <div className="text-center flex flex-col items-center">
        <ActivityIcon type={ActivityType.PUMP} size={48} className="text-fuchsia-500" />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          {ActivityTypeLabels[ActivityType.PUMP]}
        </h3>
      </div>

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
      <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-2xl p-4 text-center">
        <p className="text-base text-fuchsia-600 dark:text-fuchsia-400 mb-1">吸奶时长</p>
        <p className="text-3xl font-bold text-fuchsia-700 dark:text-fuchsia-300">
          {formatDuration(duration)}
        </p>
      </div>

      {/* 奶量 - 滑块输入，10ml 间隔 */}
      <SliderInput
        value={milkAmount}
        onChange={setMilkAmount}
        min={10}
        max={300}
        step={10}
        unit="ml"
        label="吸奶量"
        color="pink"
      />

      {/* 记住选择 */}
      <button
        onClick={() => preferences.rememberSelection ? clearPreferences() : savePreferences()}
        className="flex items-center gap-2 py-2 px-1 text-base transition-all"
      >
        {preferences.rememberSelection ? (
          <Check size={20} className="text-green-500" />
        ) : (
          <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600" />
        )}
        <span className={preferences.rememberSelection ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
          记住当前选择
        </span>
      </button>

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
          disabled={duration <= 0 || milkAmount <= 0}
          className={`p-4 rounded-2xl font-semibold text-lg transition-all ${
            duration > 0 && milkAmount > 0
              ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
