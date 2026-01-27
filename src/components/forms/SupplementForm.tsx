'use client'

import { useState, useEffect } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { Pill, Check } from 'lucide-react'
import type { SupplementType } from '@/types/activity'

const STORAGE_KEY = 'supplement_form_preferences'

interface SupplementFormPreferences {
  rememberSelection: boolean
  defaultSupplementType: SupplementType
}

const DEFAULT_PREFERENCES: SupplementFormPreferences = {
  rememberSelection: false,
  defaultSupplementType: 'AD',
}

interface SupplementFormProps {
  onSubmit: (data: {
    startTime: Date
    supplementType: SupplementType
  }) => void
  onCancel: () => void
  initialValues?: {
    startTime?: Date
    supplementType?: SupplementType
  }
  isEditing?: boolean
}

export function SupplementForm({ onSubmit, onCancel, initialValues, isEditing }: SupplementFormProps) {
  const [preferences, setPreferences] = useState<SupplementFormPreferences>(DEFAULT_PREFERENCES)
  const [startTime, setStartTime] = useState(initialValues?.startTime || new Date())
  const [supplementType, setSupplementType] = useState<SupplementType>(initialValues?.supplementType || 'AD')

  // 加载保存的偏好设置（仅在新建时）
  useEffect(() => {
    if (isEditing) return // 编辑模式不加载偏好
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedPrefs = JSON.parse(saved) as SupplementFormPreferences
        setPreferences(savedPrefs)
        if (savedPrefs.rememberSelection && !initialValues) {
          setSupplementType(savedPrefs.defaultSupplementType)
        }
      }
    } catch (e) {
      console.error('Failed to load preferences:', e)
    }
  }, [isEditing, initialValues])

  // 保存偏好设置
  const savePreferences = () => {
    const newPrefs: SupplementFormPreferences = {
      rememberSelection: true,
      defaultSupplementType: supplementType,
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
      supplementType,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <TimeAdjuster time={startTime} onTimeChange={setStartTime} />

      {/* 补剂类型选择 */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">补剂类型</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSupplementType('AD')}
            className={`p-4 rounded-2xl text-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              supplementType === 'AD'
                ? 'bg-orange-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Pill size={20} />
            AD
          </button>
          <button
            onClick={() => setSupplementType('D3')}
            className={`p-4 rounded-2xl text-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              supplementType === 'D3'
                ? 'bg-yellow-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Pill size={20} />
            D3
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
          className="p-4 rounded-2xl font-semibold text-lg transition-all bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg"
        >
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
