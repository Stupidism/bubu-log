'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BottomSheet } from '@/components/BottomSheet'
import { CountActivityForm } from '@/components/forms'
import { useModalParams, ModalType } from '@/hooks/useModalParams'
import { useCreateActivity, useUpdateActivity, useActivity } from '@/lib/api/hooks'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { Loader2 } from 'lucide-react'

// Modal type 到 ActivityType 的映射
const MODAL_TO_ACTIVITY_TYPE: Partial<Record<ModalType, ActivityType>> = {
  roll_over: ActivityType.ROLL_OVER,
  pull_to_sit: ActivityType.PULL_TO_SIT,
}

const COUNT_ACTIVITY_MODALS: ModalType[] = [
  'roll_over',
  'pull_to_sit',
]

export function CountActivityModal() {
  const { modalType, activityId, closeModal, selectedDate } = useModalParams()
  const searchParams = useSearchParams()
  
  const activityType = modalType ? MODAL_TO_ACTIVITY_TYPE[modalType] : undefined
  const isOpen = !!activityType && COUNT_ACTIVITY_MODALS.includes(modalType as ModalType)
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
    
    const startTime = searchParams.get('startTime')
    const countParam = searchParams.get('count')
    
    // 使用 URL 中的时间，或者使用当前选中日期的当前时间
    const defaultTime = new Date()
    defaultTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    
    return {
      startTime: startTime ? new Date(startTime) : defaultTime,
      count: countParam ? parseInt(countParam) : undefined,
    }
  }, [isEditing, isOpen, searchParams, selectedDate])
  
  // 编辑模式的初始值
  const initialValues = useMemo(() => {
    if (isEditing && activity) {
      return {
        startTime: new Date(activity.startTime),
        count: activity.count || undefined,
      }
    }
    return initialValuesFromUrl
  }, [isEditing, activity, initialValuesFromUrl])
  
  const handleSubmit = useCallback(async (data: { startTime: Date; count: number }) => {
    if (!activityType) return
    
    // 对于计数活动，startTime 和 endTime 相同
    const startTimeStr = data.startTime.toISOString()
    
    if (isEditing && activityId) {
      updateActivity.mutate(
        {
          params: { path: { id: activityId } },
          body: {
            startTime: startTimeStr,
            endTime: startTimeStr,
            count: data.count,
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
            startTime: startTimeStr,
            endTime: startTimeStr,
            count: data.count,
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
        <CountActivityForm
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
