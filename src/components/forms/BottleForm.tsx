'use client'

import { useState, useEffect } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { SliderInput } from '../SliderInput'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { Check } from 'lucide-react'

interface BottleFormProps {
  onSubmit: (data: {
    recordTime: Date
    duration: number
    milkAmount: number
    burpSuccess?: boolean
  }) => void
  onCancel: () => void
  initialValues?: {
    recordTime?: Date
    duration?: number
    milkAmount?: number
    burpSuccess?: boolean
  }
  isEditing?: boolean
}

const STORAGE_KEY = 'bottle_form_preferences'

interface Preferences {
  rememberSelection: boolean
  defaultDuration: number
  defaultMilkAmount: number
  defaultBurpSuccess: boolean
}

const DEFAULT_PREFERENCES: Preferences = {
  rememberSelection: false,
  defaultDuration: 90,
  defaultMilkAmount: 90,
  defaultBurpSuccess: true,
}

export function BottleForm({ onSubmit, onCancel, initialValues, isEditing }: BottleFormProps) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES)
  const [recordTime, setRecordTime] = useState(initialValues?.recordTime || new Date())
  const [duration, setDuration] = useState<number>(initialValues?.duration || 90)
  const [milkAmount, setMilkAmount] = useState<number>(initialValues?.milkAmount || 90)
  const [burpSuccess, setBurpSuccess] = useState<boolean | undefined>(initialValues?.burpSuccess)

  // 加载偏好设置（仅在新建时）
  useEffect(() => {
    if (isEditing) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedPrefs = JSON.parse(saved) as Preferences
        setPreferences(savedPrefs)
        if (savedPrefs.rememberSelection && !initialValues) {
          setDuration(savedPrefs.defaultDuration)
          setMilkAmount(savedPrefs.defaultMilkAmount)
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
      defaultMilkAmount: milkAmount,
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
    if (duration <= 0 || milkAmount <= 0) return
    onSubmit({
      recordTime,
      duration,
      milkAmount,
      burpSuccess,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 活动图标和名称 */}
      <div className="text-center flex flex-col items-center">
        <ActivityIcon type={ActivityType.BOTTLE} size={48} className="text-blue-500" />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          {ActivityTypeLabels[ActivityType.BOTTLE]}
        </h3>
      </div>

      {/* 开始时间 */}
      <TimeAdjuster time={recordTime} onTimeChange={setRecordTime} />

      {/* 奶量 - 滑块输入，10ml 间隔 */}
      <SliderInput
        value={milkAmount}
        onChange={setMilkAmount}
        min={10}
        max={200}
        step={10}
        unit="ml"
        label="奶量"
        color="blue"
      />

      {/* 喂奶时长 - 滑块输入 */}
      <SliderInput
        value={duration}
        onChange={setDuration}
        min={5}
        max={60}
        step={1}
        unit="分钟"
        label="喂奶时长"
        color="gray"
        allowExceedMax
      />

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
          disabled={duration <= 0 || milkAmount <= 0}
          className={`p-4 rounded-2xl font-semibold text-lg transition-all ${
            duration > 0 && milkAmount > 0
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
