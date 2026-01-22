'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BottomSheet } from '@/components/BottomSheet'
import { BreastfeedForm } from '@/components/forms'
import { useModalParams } from '@/hooks/useModalParams'
import { useCreateActivity, useUpdateActivity, useActivity } from '@/lib/api/hooks'
import { ActivityType } from '@/types/activity'
import { Loader2 } from 'lucide-react'

export function BreastfeedModal() {
  const { modalType, activityId, closeModal } = useModalParams()
  const searchParams = useSearchParams()
  
  const isOpen = modalType === 'breastfeed'
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
    
    const duration = searchParams.get('duration')
    const recordTime = searchParams.get('recordTime')
    const burpSuccess = searchParams.get('burpSuccess')
    
    return {
      recordTime: recordTime ? new Date(recordTime) : new Date(),
      duration: duration ? parseInt(duration, 10) : undefined,
      burpSuccess: burpSuccess ? burpSuccess === 'true' : undefined,
    }
  }, [isEditing, isOpen, searchParams])
  
  // 编辑模式的初始值
  const initialValues = useMemo(() => {
    if (isEditing && activity) {
      return {
        recordTime: new Date(activity.recordTime),
        duration: activity.duration ?? undefined,
        burpSuccess: activity.burpSuccess ?? undefined,
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
            duration: data.duration as number,
            burpSuccess: data.burpSuccess as boolean,
          },
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    } else {
      createActivity.mutate(
        {
          body: {
            type: ActivityType.BREASTFEED,
            recordTime: (data.recordTime as Date).toISOString(),
            duration: data.duration as number,
            burpSuccess: data.burpSuccess as boolean,
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
      title={isEditing ? '编辑亲喂记录' : '亲喂'}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <BreastfeedForm
          onSubmit={handleSubmit}
          onCancel={closeModal}
          initialValues={initialValues}
          isEditing={isEditing}
        />
      )}
    </BottomSheet>
  )
}

