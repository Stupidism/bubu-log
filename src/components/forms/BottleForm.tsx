'use client'

import { useState, useEffect } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
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
}

const DURATION_PRESETS = [5, 10, 15, 20, 25, 30]
const MILK_PRESETS = [30, 60, 90, 120, 150, 180]
const STORAGE_KEY = 'bottle_form_preferences'

interface Preferences {
  rememberSelection: boolean
  defaultDuration: number
  defaultMilkAmount: number
  defaultBurpSuccess: boolean
}

const DEFAULT_PREFERENCES: Preferences = {
  rememberSelection: false,
  defaultDuration: 15,
  defaultMilkAmount: 90,
  defaultBurpSuccess: true,
}

export function BottleForm({ onSubmit, onCancel }: BottleFormProps) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES)
  const [recordTime, setRecordTime] = useState(new Date())
  const [duration, setDuration] = useState<number>(15)
  const [milkAmount, setMilkAmount] = useState<number>(90)
  const [burpSuccess, setBurpSuccess] = useState<boolean | undefined>(undefined)

  // 加载偏好设置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedPrefs = JSON.parse(saved) as Preferences
        setPreferences(savedPrefs)
        if (savedPrefs.rememberSelection) {
          setDuration(savedPrefs.defaultDuration)
          setMilkAmount(savedPrefs.defaultMilkAmount)
          setBurpSuccess(savedPrefs.defaultBurpSuccess)
        }
      }
    } catch (e) {
      console.error('Failed to load preferences:', e)
    }
  }, [])

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

  const handleDurationAdjust = (change: number) => {
    setDuration(Math.max(1, duration + change))
  }

  const handleMilkAdjust = (change: number) => {
    setMilkAmount(Math.max(10, milkAmount + change))
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
      <div>
        <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">
          开始时间
        </p>
        <TimeAdjuster time={recordTime} onTimeChange={setRecordTime} />
      </div>

      {/* 奶量 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
        <p className="text-base font-medium text-blue-600 dark:text-blue-400 mb-3 text-center">
          奶量
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {MILK_PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => setMilkAmount(m)}
              className={`p-3 rounded-xl text-lg font-semibold transition-all ${
                milkAmount === m
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {m}ml
            </button>
          ))}
        </div>
        <div className="text-center">
          <span className="text-4xl font-bold text-blue-700 dark:text-blue-300">
            {milkAmount}
          </span>
          <span className="text-xl text-blue-600 dark:text-blue-400 ml-2">ml</span>
        </div>
        {/* 微调按钮 */}
        <div className="flex justify-center gap-3 mt-3">
          <button
            onClick={() => handleMilkAdjust(-30)}
            className="px-4 py-2 rounded-xl text-base font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          >
            -30ml
          </button>
          <button
            onClick={() => handleMilkAdjust(-10)}
            className="px-4 py-2 rounded-xl text-base font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          >
            -10ml
          </button>
          <button
            onClick={() => handleMilkAdjust(10)}
            className="px-4 py-2 rounded-xl text-base font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          >
            +10ml
          </button>
          <button
            onClick={() => handleMilkAdjust(30)}
            className="px-4 py-2 rounded-xl text-base font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          >
            +30ml
          </button>
        </div>
      </div>

      {/* 喂奶时长 */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
        <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">
          喂奶时长
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {DURATION_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`p-2 rounded-xl text-base font-semibold transition-all ${
                duration === d
                  ? 'bg-gray-600 dark:bg-gray-500 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {d}分钟
            </button>
          ))}
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            {duration}
          </span>
          <span className="text-lg text-gray-600 dark:text-gray-400 ml-2">分钟</span>
        </div>
        {/* 微调按钮 */}
        <div className="flex justify-center gap-3 mt-2">
          <button
            onClick={() => handleDurationAdjust(-5)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          >
            -5分钟
          </button>
          <button
            onClick={() => handleDurationAdjust(-1)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          >
            -1分钟
          </button>
          <button
            onClick={() => handleDurationAdjust(1)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          >
            +1分钟
          </button>
          <button
            onClick={() => handleDurationAdjust(5)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          >
            +5分钟
          </button>
        </div>
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
      <div className="flex items-center justify-between py-2 px-1">
        <span className="text-base text-gray-600 dark:text-gray-400">记住当前选择</span>
        <button
          onClick={() => preferences.rememberSelection ? clearPreferences() : savePreferences()}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-base font-medium transition-all ${
            preferences.rememberSelection
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {preferences.rememberSelection && <Check size={16} />}
          {preferences.rememberSelection ? '已保存' : '保存'}
        </button>
      </div>

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
          确认记录
        </button>
      </div>
    </div>
  )
}

