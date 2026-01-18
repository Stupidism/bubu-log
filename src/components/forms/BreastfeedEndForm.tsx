'use client'

import { useState, useEffect } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { differenceInMinutes } from 'date-fns'
import { Check, Circle } from 'lucide-react'

interface BreastfeedEndFormProps {
  startTime?: Date
  onSubmit: (data: {
    recordTime: Date
    burpSuccess: boolean
    duration: number
  }) => void
  onCancel: () => void
}

export function BreastfeedEndForm({ startTime, onSubmit, onCancel }: BreastfeedEndFormProps) {
  const [recordTime, setRecordTime] = useState(new Date())
  const [burpSuccess, setBurpSuccess] = useState(false)
  const [durationAdjustment, setDurationAdjustment] = useState(0)

  // 计算实际时长
  const baseDuration = startTime ? differenceInMinutes(recordTime, startTime) : 0
  const actualDuration = Math.max(0, baseDuration + durationAdjustment)

  const handleSubmit = () => {
    onSubmit({
      recordTime,
      burpSuccess,
      duration: actualDuration,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <TimeAdjuster time={recordTime} onTimeChange={setRecordTime} />

      {/* 亲喂时长显示 */}
      <div className="bg-pink-50 dark:bg-pink-900/20 rounded-2xl p-4 text-center">
        <p className="text-sm text-pink-600 dark:text-pink-400 mb-1">亲喂时长</p>
        <p className="text-4xl font-bold text-pink-700 dark:text-pink-300">
          {actualDuration} <span className="text-lg">分钟</span>
        </p>
        {startTime && (
          <p className="text-xs text-pink-500 dark:text-pink-400 mt-1">
            (计算时长 - 调整时长)
          </p>
        )}
      </div>

      {/* 时长调整 */}
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">
          调整亲喂时长
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setDurationAdjustment((d) => d - 5)}
            className="px-6 py-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-lg"
          >
            -5分钟
          </button>
          <button
            onClick={() => setDurationAdjustment(0)}
            className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm"
          >
            重置
          </button>
          <button
            onClick={() => setDurationAdjustment((d) => d + 5)}
            className="px-6 py-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold text-lg"
          >
            +5分钟
          </button>
        </div>
      </div>

      {/* 拍嗝成功 */}
      <div>
        <button
          onClick={() => setBurpSuccess(!burpSuccess)}
          className={`w-full p-4 rounded-2xl text-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            burpSuccess
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          {burpSuccess ? <Check size={20} /> : <Circle size={20} />}
          拍嗝成功
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
          className="p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-lg shadow-lg"
        >
          确认记录
        </button>
      </div>
    </div>
  )
}

