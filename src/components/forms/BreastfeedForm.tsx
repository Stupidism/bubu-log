'use client'

import { useState, useEffect, useMemo } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { Check } from 'lucide-react'
import { differenceInMinutes, addMinutes } from 'date-fns'

interface BreastfeedFormProps {
  onSubmit: (data: {
    recordTime: Date
    duration: number
    burpSuccess?: boolean
  }) => void
  onCancel: () => void
  initialValues?: {
    recordTime?: Date
    duration?: number
    burpSuccess?: boolean
  }
  isEditing?: boolean
}

const STORAGE_KEY = 'breastfeed_form_preferences'

interface Preferences {
  rememberSelection: boolean
  defaultDuration: number
  defaultBurpSuccess: boolean
}

const DEFAULT_PREFERENCES: Preferences = {
  rememberSelection: false,
  defaultDuration: 20,
  defaultBurpSuccess: true,
}

export function BreastfeedForm({ onSubmit, onCancel, initialValues, isEditing }: BreastfeedFormProps) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES)
  
  // 计算初始的开始时间和结束时间
  const initialEndTime = useMemo(() => initialValues?.recordTime || new Date(), [initialValues?.recordTime])
  const initialStartTime = useMemo(() => {
    const duration = initialValues?.duration || 20
    return addMinutes(initialEndTime, -duration)
  }, [initialEndTime, initialValues?.duration])
  
  const [startTime, setStartTime] = useState(initialStartTime)
  const [endTime, setEndTime] = useState(initialEndTime)
  const [burpSuccess, setBurpSuccess] = useState<boolean | undefined>(initialValues?.burpSuccess)

  // 计算时长
  const duration = Math.max(0, differenceInMinutes(endTime, startTime))

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

  // 加载偏好设置（仅在新建时）
  useEffect(() => {
    if (isEditing) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedPrefs = JSON.parse(saved) as Preferences
        setPreferences(savedPrefs)
        if (savedPrefs.rememberSelection && !initialValues) {
          // 设置默认时长对应的开始时间
          const now = new Date()
          setEndTime(now)
          setStartTime(addMinutes(now, -savedPrefs.defaultDuration))
          setBurpSuccess(savedPrefs.defaultBurpSuccess)
        }
      }
    } catch (e) {
      console.error('Failed to load preferences:', e)
    }
  }, [isEditing, initialValues])

  const savePreferences = () => {
    const newPrefs: Preferences = {
      rememberSelection: true,
      defaultDuration: duration,
      defaultBurpSuccess: burpSuccess ?? true,
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
      recordTime: startTime,
      duration,
      burpSuccess,
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
        <ActivityIcon type={ActivityType.BREASTFEED} size={48} className="text-pink-500" />
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
      <div className="bg-pink-50 dark:bg-pink-900/20 rounded-2xl p-4 text-center">
        <p className="text-base text-pink-600 dark:text-pink-400 mb-1">喂奶时长</p>
        <p className="text-3xl font-bold text-pink-700 dark:text-pink-300">
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
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
