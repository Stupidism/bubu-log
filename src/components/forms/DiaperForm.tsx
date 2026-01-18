'use client'

import { useState } from 'react'
import { PoopColor, PeeAmount, PoopColorLabels, PeeAmountLabels, PoopColorStyles } from '@/types/activity'
import { TimeAdjuster } from '../TimeAdjuster'

interface DiaperFormProps {
  onSubmit: (data: {
    recordTime: Date
    hasPoop: boolean
    hasPee: boolean
    poopColor?: PoopColor
    peeAmount?: PeeAmount
  }) => void
  onCancel: () => void
}

export function DiaperForm({ onSubmit, onCancel }: DiaperFormProps) {
  const [recordTime, setRecordTime] = useState(new Date())
  const [hasPoop, setHasPoop] = useState(false)
  const [hasPee, setHasPee] = useState(false)
  const [poopColor, setPoopColor] = useState<PoopColor | undefined>()
  const [peeAmount, setPeeAmount] = useState<PeeAmount | undefined>()

  const handleSubmit = () => {
    if (!hasPoop && !hasPee) return
    onSubmit({
      recordTime,
      hasPoop,
      hasPee,
      poopColor: hasPoop ? poopColor : undefined,
      peeAmount: hasPee ? peeAmount : undefined,
    })
  }

  const canSubmit = (hasPoop || hasPee) && (!hasPoop || poopColor) && (!hasPee || peeAmount)

  return (
    <div className="space-y-6 animate-fade-in">
      <TimeAdjuster time={recordTime} onTimeChange={setRecordTime} />

      {/* 大小便选择 */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setHasPoop(!hasPoop)}
            className={`p-4 rounded-2xl text-lg font-semibold transition-all ${
              hasPoop
                ? 'bg-amber-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            💩 大便
          </button>
          <button
            onClick={() => setHasPee(!hasPee)}
            className={`p-4 rounded-2xl text-lg font-semibold transition-all ${
              hasPee
                ? 'bg-yellow-400 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            💧 小便
          </button>
        </div>

        {/* 大便颜色选择 */}
        {hasPoop && (
          <div className="animate-fade-in">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">大便颜色</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PoopColorLabels).map(([color, label]) => (
                <button
                  key={color}
                  onClick={() => setPoopColor(color as PoopColor)}
                  className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    poopColor === color
                      ? 'ring-2 ring-primary ring-offset-2 scale-105'
                      : 'hover:scale-102'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${PoopColorStyles[color as PoopColor]}`} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 小便量选择 */}
        {hasPee && (
          <div className="animate-fade-in">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">小便量</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PeeAmountLabels).map(([amount, label]) => (
                <button
                  key={amount}
                  onClick={() => setPeeAmount(amount as PeeAmount)}
                  className={`p-4 rounded-xl text-lg font-semibold transition-all ${
                    peeAmount === amount
                      ? 'bg-yellow-400 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {amount === 'SMALL' ? '💧' : amount === 'MEDIUM' ? '💧💧' : '💧💧💧'}
                  <br />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
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
          disabled={!canSubmit}
          className={`p-4 rounded-2xl font-semibold text-lg transition-all ${
            canSubmit
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          确认记录
        </button>
      </div>
    </div>
  )
}

