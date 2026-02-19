'use client'

import { useState } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { Droplets, Check } from 'lucide-react'
import type { SpitUpType } from '@/types/activity'

const STORAGE_KEY = 'spit_up_form_preferences'

interface SpitUpFormPreferences {
  rememberSelection: boolean
  defaultSpitUpType: SpitUpType
}

const DEFAULT_PREFERENCES: SpitUpFormPreferences = {
  rememberSelection: false,
  defaultSpitUpType: 'PROJECTILE', // 默认喷射性吐奶，因为普通吐奶一般不需要记录
}

function loadSpitUpPreferences(): SpitUpFormPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as SpitUpFormPreferences
    }
  } catch (error) {
    console.error('Failed to load preferences:', error)
  }

  return DEFAULT_PREFERENCES
}

function getSpitUpInitialState(
  initialValues: SpitUpFormProps['initialValues'],
  isEditing?: boolean
) {
  const preferences = isEditing ? DEFAULT_PREFERENCES : loadSpitUpPreferences()
  const startTime = initialValues?.startTime || new Date()

  if (initialValues?.spitUpType) {
    return {
      preferences,
      startTime,
      spitUpType: initialValues.spitUpType,
    }
  }

  if (!isEditing && !initialValues && preferences.rememberSelection) {
    return {
      preferences,
      startTime,
      spitUpType: preferences.defaultSpitUpType,
    }
  }

  return {
    preferences,
    startTime,
    spitUpType: 'PROJECTILE' as SpitUpType,
  }
}

interface SpitUpFormProps {
  onSubmit: (data: {
    startTime: Date
    spitUpType: SpitUpType
  }) => void
  onCancel: () => void
  initialValues?: {
    startTime?: Date
    spitUpType?: SpitUpType
  }
  isEditing?: boolean
}

export function SpitUpForm({ onSubmit, onCancel, initialValues, isEditing }: SpitUpFormProps) {
  const [initialState] = useState(() => getSpitUpInitialState(initialValues, isEditing))
  const [preferences, setPreferences] = useState<SpitUpFormPreferences>(initialState.preferences)
  const [startTime, setStartTime] = useState(initialState.startTime)
  const [spitUpType, setSpitUpType] = useState<SpitUpType>(initialState.spitUpType)

  // 保存偏好设置
  const savePreferences = () => {
    const newPrefs: SpitUpFormPreferences = {
      rememberSelection: true,
      defaultSpitUpType: spitUpType,
    }
    setPreferences(newPrefs)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs))
  }

  // 清除偏好设置
  const clearPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES)
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleSubmit = () => {
    onSubmit({
      startTime,
      spitUpType,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <TimeAdjuster time={startTime} onTimeChange={setStartTime} />

      {/* 吐奶类型选择 */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">吐奶类型</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSpitUpType('PROJECTILE')}
            className={`p-4 rounded-2xl text-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              spitUpType === 'PROJECTILE'
                ? 'bg-red-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Droplets size={20} />
            喷射性
          </button>
          <button
            onClick={() => setSpitUpType('NORMAL')}
            className={`p-4 rounded-2xl text-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              spitUpType === 'NORMAL'
                ? 'bg-amber-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Droplets size={20} />
            普通
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
          className="p-4 rounded-2xl font-semibold text-lg transition-all bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-lg"
        >
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
