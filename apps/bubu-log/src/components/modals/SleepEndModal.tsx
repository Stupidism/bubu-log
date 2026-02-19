'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BottomSheet } from '@/components/BottomSheet'
import { SleepEndForm } from '@/components/forms'
import { useModalParams } from '@/hooks/useModalParams'
import { useCreateActivityWithConflictCheck, useUpdateActivity, useActivity, useSleepState } from '@/lib/api/hooks'
import { ActivityType } from '@/types/activity'
import { Loader2 } from 'lucide-react'
import { OverlapConfirmModal } from './OverlapConfirmModal'

export function SleepEndModal() {
  const { modalType, activityId, closeModal, selectedDate } = useModalParams()
  const searchParams = useSearchParams()
  const isOpen = modalType === 'sleep_end'
  const { getCurrentSleepActivity } = useSleepState({ enabled: isOpen })
  
  const isEditing = !!activityId
  
  // 获取当前睡眠活动（如果有）
  const currentSleepActivity = getCurrentSleepActivity()
  
  // 如果是编辑模式，获取活动数据
  const { data: activity, isLoading } = useActivity(activityId || '', {
    enabled: isEditing && isOpen,
  })
  
  const createActivity = useCreateActivityWithConflictCheck()
  const updateActivity = useUpdateActivity()
  
  // 解析 URL 中的初始值（来自语音输入）
  const initialValuesFromUrl = useMemo(() => {
    if (isEditing || !isOpen) return undefined
    
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    
    // 使用 URL 中的时间，或者使用当前选中日期的当前时间
    const defaultTime = new Date()
    defaultTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    
    return {
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : defaultTime,
    }
  }, [isEditing, isOpen, searchParams, selectedDate])
  
  // 编辑模式的初始值
  const initialValues = useMemo(() => {
    if (isEditing && activity) {
      return {
        startTime: new Date(activity.startTime),
        endTime: activity.endTime ? new Date(activity.endTime) : undefined,
      }
    }
    return initialValuesFromUrl
  }, [isEditing, activity, initialValuesFromUrl])
  
  // 睡眠开始时间（从当前睡眠活动获取，或从 URL 参数获取）
  const sleepStartTime = useMemo(() => {
    if (currentSleepActivity) {
      return new Date(currentSleepActivity.startTime)
    }
    return initialValues?.startTime
  }, [currentSleepActivity, initialValues])
  
  const handleSubmit = useCallback(async (data: Record<string, unknown>) => {
    const startTime = data.startTime as Date
    const endTime = data.endTime as Date
    
    if (isEditing && activityId) {
      // 编辑模式：更新现有活动
      updateActivity.mutate(
        {
          params: { path: { id: activityId } },
          body: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          },
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    } else if (currentSleepActivity) {
      // 更新现有睡眠记录（添加 endTime）
      updateActivity.mutate(
        {
          params: { path: { id: currentSleepActivity.id } },
          body: {
            endTime: endTime.toISOString(),
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
          type: ActivityType.SLEEP,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    }
  }, [isEditing, activityId, currentSleepActivity, createActivity, updateActivity, closeModal])

  const handleForceCreate = useCallback(() => {
    createActivity.forceCreate({
      onSuccess: () => closeModal(),
    })
  }, [createActivity, closeModal])
  
  if (!isOpen) return null
  
  return (
    <>
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
            sleepStartTime={sleepStartTime}
            initialValues={initialValues}
            isEditing={isEditing}
          />
        )}
      </BottomSheet>

      <OverlapConfirmModal
        isOpen={createActivity.hasPendingConflict}
        conflictError={createActivity.conflictError}
        onConfirm={handleForceCreate}
        onCancel={createActivity.cancelConflict}
        isLoading={createActivity.isLoading}
      />
    </>
  )
}
