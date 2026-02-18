'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { ActivityConflictError } from '@/lib/api/hooks'
import { formatTime } from '@/lib/dayjs'
import { ActivityTypeLabels, ActivityType } from '@/types/activity'

interface OverlapConfirmModalProps {
  isOpen: boolean
  conflictError: ActivityConflictError | null
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function OverlapConfirmModal({
  isOpen,
  conflictError,
  onConfirm,
  onCancel,
  isLoading,
}: OverlapConfirmModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen || !conflictError) return null

  const conflictingActivity = conflictError.conflictingActivity
  const activityType = conflictingActivity?.type as ActivityType
  const activityLabel = ActivityTypeLabels[activityType] || activityType
  const startTimeStr = conflictingActivity?.startTime 
    ? formatTime(new Date(conflictingActivity.startTime))
    : ''
  const endTimeStr = conflictingActivity?.endTime
    ? formatTime(new Date(conflictingActivity.endTime))
    : ''

  return createPortal(
    <>
      {/* 遮罩层 - 通过 portal 挂到 body，避免被 Drawer 层级遮挡 */}
      <div 
        className="fixed inset-0 bg-black/50 animate-in fade-in duration-200"
        style={{ zIndex: 1000 }}
        onClick={onCancel}
      />

      {/* 弹窗 */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 1001, pointerEvents: 'auto' }}
        data-testid="overlap-confirm-modal"
      >
        <div 
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 图标 */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          {/* 标题 */}
          <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100 mb-2">
            时间重叠提醒
          </h3>

          {/* 描述 */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            {conflictError.error}
          </p>

          {/* 冲突活动信息 */}
          {conflictingActivity && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                已有记录：<span className="font-medium text-gray-900 dark:text-gray-100">{activityLabel}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {startTimeStr}{endTimeStr ? ` - ${endTimeStr}` : ''}
              </p>
            </div>
          )}

          {/* 按钮 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              data-testid="overlap-cancel-btn"
              className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              data-testid="overlap-confirm-btn"
              className="px-4 py-3 rounded-xl bg-yellow-500 text-white font-medium transition-colors hover:bg-yellow-600 disabled:opacity-50"
            >
              {isLoading ? '创建中...' : '仍要创建'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
