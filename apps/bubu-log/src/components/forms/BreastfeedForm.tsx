'use client'

import { useState } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType, ActivityTypeLabels, BreastFirmness, BreastFirmnessLabels } from '@/types/activity'
import { Check } from 'lucide-react'
import { dayjs, calculateDurationMinutes } from '@/lib/dayjs'

interface BreastfeedFormProps {
  onSubmit: (data: {
    startTime: Date
    endTime?: Date
    burpSuccess?: boolean
    breastFirmness?: BreastFirmness
  }) => void
  onCancel: () => void
  initialValues?: {
    startTime?: Date
    endTime?: Date
    burpSuccess?: boolean
    breastFirmness?: BreastFirmness
  }
  isEditing?: boolean
}

const STORAGE_KEY = 'breastfeed_form_preferences'

interface Preferences {
  rememberSelection: boolean
  defaultDuration: number
  defaultBurpSuccess: boolean
  defaultBreastFirmness: BreastFirmness
}

const DEFAULT_PREFERENCES: Preferences = {
  rememberSelection: false,
  defaultDuration: 20,
  defaultBurpSuccess: true,
  defaultBreastFirmness: 'SOFT',
}

interface BreastfeedFormInitialState {
  preferences: Preferences
  startTime: Date
  endTime: Date
  burpSuccess: boolean | undefined
  breastFirmness: BreastFirmness
}

function loadBreastfeedPreferences(): Preferences {
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

function getBreastfeedInitialState(initialValues?: BreastfeedFormProps['initialValues'], isEditing?: boolean): BreastfeedFormInitialState {
  const preferences = loadBreastfeedPreferences()

  const defaultEndTime = initialValues?.endTime || new Date()
  const defaultStartTime = initialValues?.startTime || dayjs(defaultEndTime).subtract(20, 'minute').toDate()

  if (!isEditing && !initialValues && preferences.rememberSelection) {
    const now = dayjs()
    return {
      preferences,
      startTime: now.subtract(preferences.defaultDuration, 'minute').toDate(),
      endTime: now.toDate(),
      burpSuccess: preferences.defaultBurpSuccess,
      breastFirmness: preferences.defaultBreastFirmness || 'SOFT',
    }
  }

  return {
    preferences,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    burpSuccess: initialValues?.burpSuccess,
    breastFirmness: initialValues?.breastFirmness || 'SOFT',
  }
}

export function BreastfeedForm({ onSubmit, onCancel, initialValues, isEditing }: BreastfeedFormProps) {
  const [initialState] = useState<BreastfeedFormInitialState>(() => getBreastfeedInitialState(initialValues, isEditing))
  const [preferences, setPreferences] = useState<Preferences>(initialState.preferences)
  const [startTime, setStartTime] = useState(initialState.startTime)
  const [endTime, setEndTime] = useState(initialState.endTime)
  const [burpSuccess, setBurpSuccess] = useState<boolean | undefined>(initialState.burpSuccess)
  const [breastFirmness, setBreastFirmness] = useState<BreastFirmness>(initialState.breastFirmness)

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
      defaultBurpSuccess: burpSuccess ?? true,
      defaultBreastFirmness: breastFirmness,
    }
    setPreferences(newPrefs)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs))
  }

  const clearPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES)
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleSubmit = () => {
    if (duration <= 0) return
    onSubmit({
      startTime,
      endTime,
      burpSuccess,
      breastFirmness,
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
        <ActivityIcon type={ActivityType.BREASTFEED} size={48} className="text-rose-500" />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          {ActivityTypeLabels[ActivityType.BREASTFEED]}
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
      <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4 text-center">
        <p className="text-base text-rose-600 dark:text-rose-400 mb-1">喂奶时长</p>
        <p className="text-3xl font-bold text-rose-700 dark:text-rose-300">
          {formatDuration(duration)}
        </p>
      </div>

      {/* 拍嗝是否成功 */}
      <div>
        <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-2">
          拍嗝成功？
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setBurpSuccess(true)}
            className={`p-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              burpSuccess === true
                ? 'bg-green-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Check size={24} />
            成功
          </button>
          <button
            onClick={() => setBurpSuccess(false)}
            className={`p-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              burpSuccess === false
                ? 'bg-red-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            未成功
          </button>
        </div>
      </div>

      {/* 乳房硬度 */}
      <div>
        <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-2">
          喂完后乳房硬度
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(['SOFT', 'ELASTIC', 'HARD'] as BreastFirmness[]).map((firmness) => (
            <button
              key={firmness}
              onClick={() => setBreastFirmness(firmness)}
              className={`p-4 rounded-xl text-base font-semibold transition-all ${
                breastFirmness === firmness
                  ? 'bg-rose-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {BreastFirmnessLabels[firmness]}
            </button>
          ))}
        </div>
      </div>

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
          disabled={duration <= 0}
          className={`p-4 rounded-2xl font-semibold text-lg transition-all ${
            duration > 0
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
