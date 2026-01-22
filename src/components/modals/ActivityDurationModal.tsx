'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BottomSheet } from '@/components/BottomSheet'
import { ActivityDurationForm } from '@/components/forms'
import { useModalParams, ModalType } from '@/hooks/useModalParams'
import { useCreateActivity, useUpdateActivity, useActivity } from '@/lib/api/hooks'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { Loader2 } from 'lucide-react'

// Modal type 到 ActivityType 的映射
const MODAL_TO_ACTIVITY_TYPE: Partial<Record<ModalType, ActivityType>> = {
  head_lift: ActivityType.HEAD_LIFT,
  passive_exercise: ActivityType.PASSIVE_EXERCISE,
  gas_exercise: ActivityType.GAS_EXERCISE,
  bath: ActivityType.BATH,
  outdoor: ActivityType.OUTDOOR,
  early_education: ActivityType.EARLY_EDUCATION,
}

const ACTIVITY_MODALS: ModalType[] = [
  'head_lift',
  'passive_exercise',
  'gas_exercise',
  'bath',
  'outdoor',
  'early_education',
]

export function ActivityDurationModal() {
  const { modalType, activityId, closeModal } = useModalParams()
  const searchParams = useSearchParams()
  
  const activityType = modalType ? MODAL_TO_ACTIVITY_TYPE[modalType] : undefined
  const isOpen = !!activityType && ACTIVITY_MODALS.includes(modalType as ModalType)
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
    
    return {
      recordTime: recordTime ? new Date(recordTime) : new Date(),
      duration: duration ? parseInt(duration, 10) : undefined,
    }
  }, [isEditing, isOpen, searchParams])
  
  // 编辑模式的初始值
  const initialValues = useMemo(() => {
    if (isEditing && activity) {
      return {
        recordTime: new Date(activity.recordTime),
        duration: activity.duration ?? undefined,
      }
    }
    return initialValuesFromUrl
  }, [isEditing, activity, initialValuesFromUrl])
  
  const handleSubmit = useCallback(async (data: Record<string, unknown>) => {
    if (!activityType) return
    
    if (isEditing && activityId) {
      updateActivity.mutate(
        {
          params: { path: { id: activityId } },
          body: {
            recordTime: (data.recordTime as Date).toISOString(),
            duration: data.duration as number,
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
            type: activityType,
            recordTime: (data.recordTime as Date).toISOString(),
            duration: data.duration as number,
          },
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    }
  }, [activityType, isEditing, activityId, createActivity, updateActivity, closeModal])
  
  if (!isOpen || !activityType) return null
  
  const title = isEditing 
    ? `编辑${ActivityTypeLabels[activityType]}` 
    : ActivityTypeLabels[activityType]
  
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={closeModal}
      title={title}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <ActivityDurationForm
          type={activityType}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          initialValues={initialValues}
          isEditing={isEditing}
        />
      )}
    </BottomSheet>
  )
}

