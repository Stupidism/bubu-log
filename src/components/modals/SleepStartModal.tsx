'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BottomSheet } from '@/components/BottomSheet'
import { SimpleActivityForm } from '@/components/forms'
import { useModalParams } from '@/hooks/useModalParams'
import { useCreateActivity, useUpdateActivity, useActivity } from '@/lib/api/hooks'
import { ActivityType } from '@/types/activity'
import { Loader2 } from 'lucide-react'

export function SleepStartModal() {
  const { modalType, activityId, closeModal } = useModalParams()
  const searchParams = useSearchParams()
  
  const isOpen = modalType === 'sleep_start'
  const isEditing = !!activityId
  
  // 如果是编辑模式，获取活动数据
  const { data: activity, isLoading } = useActivity(activityId || '', {
    enabled: isEditing && isOpen,
  })
  
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()
  
  // 解析 URL 中的初始值（来自语音输入）
  const initialValuesFromUrl = useMemo(() => {
    if (isEditing || !isOpen) return undefined
    
    const recordTime = searchParams.get('recordTime')
    
    return {
      recordTime: recordTime ? new Date(recordTime) : new Date(),
    }
  }, [isEditing, isOpen, searchParams])
  
  // 编辑模式的初始值
  const initialValues = useMemo(() => {
    if (isEditing && activity) {
      return {
        recordTime: new Date(activity.recordTime),
      }
    }
    return initialValuesFromUrl
  }, [isEditing, activity, initialValuesFromUrl])
  
  const handleSubmit = useCallback(async (data: Record<string, unknown>) => {
    if (isEditing && activityId) {
      updateActivity.mutate(
        {
          params: { path: { id: activityId } },
          body: {
            recordTime: (data.recordTime as Date).toISOString(),
          },
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    } else {
      // 入睡记录：不需要 duration
      createActivity.mutate(
        {
          body: {
            type: ActivityType.SLEEP,
            recordTime: (data.recordTime as Date).toISOString(),
          },
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    }
  }, [isEditing, activityId, createActivity, updateActivity, closeModal])
  
  if (!isOpen) return null
  
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={closeModal}
      title={isEditing ? '编辑入睡时间' : '入睡'}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <SimpleActivityForm
          type={ActivityType.SLEEP}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          initialValues={initialValues}
        />
      )}
    </BottomSheet>
  )
}

