'use client'

import { useState } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { differenceInMinutes } from 'date-fns'

interface SleepEndFormProps {
  startTime?: Date
  onSubmit: (data: {
    recordTime: Date
    duration: number
  }) => void
  onCancel: () => void
}

const DURATION_PRESETS = [30, 60, 90, 120, 180, 240]

export function SleepEndForm({ startTime, onSubmit, onCancel }: SleepEndFormProps) {
  const [recordTime, setRecordTime] = useState(new Date())
  const [manualDuration, setManualDuration] = useState<number | undefined>(undefined)
  const [durationAdjustment, setDurationAdjustment] = useState(0)

  // 是否有开始时间（是否从入睡状态过来）
  const hasStartTime = !!startTime

  // 计算时长
  const baseDuration = startTime ? differenceInMinutes(recordTime, startTime) : 0
  const actualDuration = hasStartTime 
    ? Math.max(0, baseDuration + durationAdjustment) 
    : manualDuration || 0

  const handleSubmit = () => {
    if (!hasStartTime && !manualDuration) return
    onSubmit({
      recordTime,
      duration: actualDuration,
    })
  }

  const canSubmit = hasStartTime || (manualDuration && manualDuration > 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 活动图标和名称 */}
      <div className="text-center flex flex-col items-center">
        <ActivityIcon type={ActivityType.SLEEP_END} size={48} className="text-amber-500" />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          {ActivityTypeLabels[ActivityType.SLEEP_END]}
        </h3>
      </div>

      <TimeAdjuster time={recordTime} onTimeChange={setRecordTime} />

      {hasStartTime ? (
        <>
          {/* 睡眠时长显示（有开始时间时） */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 text-center">
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">睡眠时长</p>
            <p className="text-4xl font-bold text-amber-700 dark:text-amber-300">
              {Math.floor(actualDuration / 60) > 0 && (
                <>{Math.floor(actualDuration / 60)} <span className="text-lg">小时</span> </>
              )}
              {actualDuration % 60} <span className="text-lg">分钟</span>
            </p>
          </div>

          {/* 时长调整 */}
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">
              调整睡眠时长
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDurationAdjustment((d) => d - 15)}
                className="px-5 py-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
              >
                -15分钟
              </button>
              <button
                onClick={() => setDurationAdjustment(0)}
                className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm"
              >
                重置
              </button>
              <button
                onClick={() => setDurationAdjustment((d) => d + 15)}
                className="px-5 py-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold"
              >
                +15分钟
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 手动输入睡眠时长（没有开始时间时） */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4">
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-3 text-center">
              请选择宝宝睡了多久
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setManualDuration(manualDuration === d ? undefined : d)}
                  className={`p-3 rounded-xl font-semibold transition-all ${
                    manualDuration === d
                      ? 'bg-amber-500 text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {d >= 60 ? `${d / 60}小时` : `${d}分钟`}
                </button>
              ))}
            </div>
            {manualDuration && (
              <p className="text-center mt-3 text-lg font-bold text-amber-700 dark:text-amber-300">
                已选择: {manualDuration >= 60 ? `${Math.floor(manualDuration / 60)}小时${manualDuration % 60 > 0 ? ` ${manualDuration % 60}分钟` : ''}` : `${manualDuration}分钟`}
              </p>
            )}
          </div>
        </>
      )}

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
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          确认记录
        </button>
      </div>
    </div>
  )
}

