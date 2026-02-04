'use client'

import { useState } from 'react'
import { TimeAdjuster } from '../TimeAdjuster'
import { ActivityIcon } from '../ActivityIcon'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { Minus, Plus } from 'lucide-react'

interface CountActivityFormProps {
  type: ActivityType
  onSubmit: (data: {
    startTime: Date
    count: number
  }) => void
  onCancel: () => void
  initialValues?: {
    startTime?: Date
    count?: number
  }
  isEditing?: boolean
}

// 各活动类型的配置：默认次数、颜色
interface ActivityConfig {
  defaultCount: number
  minCount: number
  maxCount: number
  color: string
}

const ACTIVITY_CONFIGS: Partial<Record<ActivityType, ActivityConfig>> = {
  [ActivityType.ROLL_OVER]: {
    defaultCount: 3,
    minCount: 1,
    maxCount: 20,
    color: 'blue',
  },
  [ActivityType.PULL_TO_SIT]: {
    defaultCount: 3,
    minCount: 1,
    maxCount: 20,
    color: 'violet',
  },
}

const DEFAULT_CONFIG: ActivityConfig = {
  defaultCount: 3,
  minCount: 1,
  maxCount: 20,
  color: 'amber',
}

export function CountActivityForm({ 
  type, 
  onSubmit, 
  onCancel, 
  initialValues,
  isEditing 
}: CountActivityFormProps) {
  const config = ACTIVITY_CONFIGS[type] || DEFAULT_CONFIG
  const [startTime, setStartTime] = useState(initialValues?.startTime || new Date())
  const [count, setCount] = useState(initialValues?.count || config.defaultCount)

  const handleSubmit = () => {
    onSubmit({ startTime, count })
  }

  const incrementCount = () => {
    if (count < config.maxCount) {
      setCount(count + 1)
    }
  }

  const decrementCount = () => {
    if (count > config.minCount) {
      setCount(count - 1)
    }
  }

  // 获取颜色样式
  const getColorStyles = () => {
    const colorMap: Record<string, { bg: string; text: string; textDark: string; gradient: string }> = {
      blue: { 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        text: 'text-blue-600 dark:text-blue-400', 
        textDark: 'text-blue-700 dark:text-blue-300',
        gradient: 'from-blue-500 to-indigo-500'
      },
      violet: { 
        bg: 'bg-violet-50 dark:bg-violet-900/20', 
        text: 'text-violet-600 dark:text-violet-400', 
        textDark: 'text-violet-700 dark:text-violet-300',
        gradient: 'from-violet-500 to-purple-500'
      },
      amber: { 
        bg: 'bg-amber-50 dark:bg-amber-900/20', 
        text: 'text-amber-600 dark:text-amber-400', 
        textDark: 'text-amber-700 dark:text-amber-300',
        gradient: 'from-amber-500 to-orange-500'
      },
    }
    return colorMap[config.color] || colorMap.amber
  }

  const colorStyles = getColorStyles()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 活动图标和名称 */}
      <div className="text-center flex flex-col items-center">
        <ActivityIcon type={type} size={48} className={colorStyles.textDark} />
        <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">
          {ActivityTypeLabels[type]}
        </h3>
      </div>

      <TimeAdjuster time={startTime} onTimeChange={setStartTime} />

      {/* 次数选择 */}
      <div className={`${colorStyles.bg} rounded-2xl p-4`}>
        <p className={`text-center text-base ${colorStyles.text} mb-3`}>次数</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={decrementCount}
            disabled={count <= config.minCount}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              count <= config.minCount
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                : `${colorStyles.bg} ${colorStyles.text} hover:scale-105 active:scale-95`
            }`}
          >
            <Minus size={24} />
          </button>
          <span className={`text-4xl font-bold ${colorStyles.textDark} min-w-[60px] text-center`}>
            {count}
          </span>
          <button
            onClick={incrementCount}
            disabled={count >= config.maxCount}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              count >= config.maxCount
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                : `${colorStyles.bg} ${colorStyles.text} hover:scale-105 active:scale-95`
            }`}
          >
            <Plus size={24} />
          </button>
        </div>
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
          className={`p-4 rounded-2xl bg-gradient-to-r ${colorStyles.gradient} text-white font-semibold text-lg shadow-lg`}
        >
          {isEditing ? '保存修改' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
