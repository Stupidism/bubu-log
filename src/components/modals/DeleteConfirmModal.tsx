'use client'

import { useCallback, useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { BottomSheet } from '@/components/BottomSheet'
import { Toast } from '@/components/Toast'
import { useModalParams } from '@/hooks/useModalParams'
import { useActivity, useDeleteActivity } from '@/lib/api/hooks'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { formatDateTimeChinese } from '@/lib/dayjs'

export function DeleteConfirmModal() {
  const { modalType, activityId, closeModal } = useModalParams()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const shouldFetch = modalType === 'delete' && !!activityId
  const { data: activity, isLoading } = useActivity(activityId || '', {
    enabled: shouldFetch,
  })
  
  const deleteActivity = useDeleteActivity()
  
  const isOpen = modalType === 'delete' && !!activityId
  
  const handleConfirm = useCallback(async () => {
    if (!activityId || deleteActivity.isPending) return
    
    deleteActivity.mutate(
      { params: { path: { id: activityId } } },
      {
        onSuccess: () => {
          setToast({ message: '删除成功', type: 'success' })
          setTimeout(() => closeModal(), 500)
        },
        onError: () => {
          setToast({ message: '删除失败，请重试', type: 'error' })
        },
      }
    )
  }, [activityId, deleteActivity, closeModal])
  
  if (!isOpen) return null
  
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={closeModal}
      title="确认删除"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : activity ? (
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
                确定要删除这条记录吗？
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {ActivityTypeLabels[activity.type as ActivityType]} · {formatDateTimeChinese(activity.startTime)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                此操作无法撤销
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={closeModal}
              className="p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-lg"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={deleteActivity.isPending}
              className="p-4 rounded-2xl bg-red-600 text-white font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {deleteActivity.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : null}
              删除
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          未找到活动记录
        </div>
      )}
      
      {/* Toast 提示 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </BottomSheet>
  )
}

