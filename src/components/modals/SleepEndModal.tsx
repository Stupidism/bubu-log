'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BottomSheet } from '@/components/BottomSheet'
import { SleepEndForm } from '@/components/forms'
import { useModalParams } from '@/hooks/useModalParams'
import { useCreateActivity, useUpdateActivity, useActivity, useSleepState } from '@/lib/api/hooks'
import { ActivityType } from '@/types/activity'
import { Loader2 } from 'lucide-react'

export function SleepEndModal() {
  const { modalType, activityId, closeModal } = useModalParams()
  const searchParams = useSearchParams()
  const { getCurrentSleepActivity } = useSleepState()
  
  const isOpen = modalType === 'sleep_end'
  const isEditing = !!activityId
  
  // 获取当前睡眠活动（如果有）
  const currentSleepActivity = getCurrentSleepActivity()
  
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
  
  // 睡眠开始时间（从当前睡眠活动获取，或从 URL 参数获取）
  const startTime = useMemo(() => {
    if (currentSleepActivity) {
      return new Date(currentSleepActivity.recordTime)
    }
    // 如果有初始值中的 recordTime 和 duration，计算开始时间
    if (initialValues?.recordTime && initialValues?.duration) {
      const endTime = initialValues.recordTime
      return new Date(endTime.getTime() - initialValues.duration * 60 * 1000)
    }
    return undefined
  }, [currentSleepActivity, initialValues])
  
  const handleSubmit = useCallback(async (data: Record<string, unknown>) => {
    const duration = data.duration as number
    
    if (isEditing && activityId) {
      // 编辑模式：更新现有活动
      updateActivity.mutate(
        {
          params: { path: { id: activityId } },
          body: {
            recordTime: (data.recordTime as Date).toISOString(),
            duration,
          },
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    } else if (currentSleepActivity) {
      // 更新现有睡眠记录（添加 duration）
      updateActivity.mutate(
        {
          params: { path: { id: currentSleepActivity.id } },
          body: {
            duration,
          },
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    } else {
      // 创建新的完整睡眠记录
      createActivity.mutate(
        {
          body: {
            type: ActivityType.SLEEP,
            recordTime: (data.recordTime as Date).toISOString(),
            duration,
          },
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    }
  }, [isEditing, activityId, currentSleepActivity, createActivity, updateActivity, closeModal])
  
  if (!isOpen) return null
  
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={closeModal}
      title={isEditing ? '编辑睡眠记录' : '睡醒'}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <SleepEndForm
          onSubmit={handleSubmit}
          onCancel={closeModal}
          startTime={startTime}
          initialValues={initialValues}
          isEditing={isEditing}
        />
      )}
    </BottomSheet>
  )
}

