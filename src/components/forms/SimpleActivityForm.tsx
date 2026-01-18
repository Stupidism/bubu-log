'use client'

import { useState } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'

interface SimpleActivityFormProps {
  type: ActivityType
  onSubmit: (data: {
    recordTime: Date
  }) => void
  onCancel: () => void
}

export function SimpleActivityForm({ type, onSubmit, onCancel }: SimpleActivityFormProps) {
  const [recordTime, setRecordTime] = useState(new Date())

  const handleSubmit = () => {
    onSubmit({ recordTime })
  }

  // 根据活动类型选择颜色
  const getGradient = () => {
    switch (type) {
      case ActivityType.SLEEP_START:
        return 'from-indigo-500 to-purple-500'
      case ActivityType.SLEEP_END:
        return 'from-amber-400 to-orange-500'
      case ActivityType.BREASTFEED_START:
        return 'from-pink-500 to-rose-500'
      case ActivityType.BOTTLE_START:
        return 'from-blue-500 to-indigo-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 活动图标和名称 */}
      <div className="text-center flex flex-col items-center">
        <ActivityIcon type={type} size={48} className="text-gray-700 dark:text-gray-200" />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          {ActivityTypeLabels[type]}
        </h3>
      </div>

      <TimeAdjuster time={recordTime} onTimeChange={setRecordTime} />

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
          className={`p-4 rounded-2xl bg-gradient-to-r ${getGradient()} text-white font-semibold text-lg shadow-lg`}
        >
          确认记录
        </button>
      </div>
    </div>
  )
}

