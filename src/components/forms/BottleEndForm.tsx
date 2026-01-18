'use client'

import { useState } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { differenceInMinutes } from 'date-fns'
import { Check, Circle } from 'lucide-react'

interface BottleEndFormProps {
  startTime?: Date
  onSubmit: (data: {
    recordTime: Date
    burpSuccess: boolean
    milkAmount: number
    duration: number
  }) => void
  onCancel: () => void
}

const MILK_PRESETS = [50, 100, 150]

export function BottleEndForm({ startTime, onSubmit, onCancel }: BottleEndFormProps) {
  const [recordTime, setRecordTime] = useState(new Date())
  const [burpSuccess, setBurpSuccess] = useState(false)
  const [milkAmount, setMilkAmount] = useState(100)

  const duration = startTime ? Math.max(0, differenceInMinutes(recordTime, startTime)) : 0

  const adjustMilk = (amount: number) => {
    setMilkAmount((prev) => Math.max(0, prev + amount))
  }

  const handleSubmit = () => {
    onSubmit({
      recordTime,
      burpSuccess,
      milkAmount,
      duration,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <TimeAdjuster time={recordTime} onTimeChange={setRecordTime} />

      {/* 瓶喂时长显示 */}
      {startTime && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 text-center">
          <p className="text-sm text-blue-600 dark:text-blue-400">瓶喂时长</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {duration} 分钟
          </p>
        </div>
      )}

      {/* 奶量选择 */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
          选择奶量 (ml)
        </p>
        
        {/* 预设按钮 */}
        <div className="grid grid-cols-3 gap-2">
          {MILK_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setMilkAmount(preset)}
              className={`p-4 rounded-2xl text-lg font-semibold transition-all ${
                milkAmount === preset
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {preset}ml
            </button>
          ))}
        </div>

        {/* 当前奶量和微调 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => adjustMilk(-10)}
              className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-2xl font-bold active:scale-95"
            >
              -
            </button>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                {milkAmount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">毫升 (ml)</p>
            </div>
            <button
              onClick={() => adjustMilk(10)}
              className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-2xl font-bold active:scale-95"
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
            点击 +/- 按钮调整 10ml
          </p>
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
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-lg shadow-lg"
        >
          确认记录
        </button>
      </div>
    </div>
  )
}

