'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BottomSheet } from '@/components/BottomSheet'
import { PumpForm } from '@/components/forms'
import { useModalParams } from '@/hooks/useModalParams'
import { useCreateActivityWithConflictCheck, useUpdateActivity, useActivity } from '@/lib/api/hooks'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { Loader2 } from 'lucide-react'
import { OverlapConfirmModal } from './OverlapConfirmModal'

export function PumpModal() {
  const { modalType, activityId, closeModal, selectedDate } = useModalParams()
  const searchParams = useSearchParams()
  
  const isOpen = modalType === 'pump'
  const isEditing = !!activityId
  
  // 如果是编辑模式，获取活动数据
  const { data: activity, isLoading } = useActivity(activityId || '', {
    enabled: isEditing && isOpen,
  })
  
  const createActivity = useCreateActivityWithConflictCheck()
  const updateActivity = useUpdateActivity()
  
  // 解析 URL 中的初始值
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
        milkAmount: activity.milkAmount || undefined,
      }
    }
    return initialValuesFromUrl
  }, [isEditing, activity, initialValuesFromUrl])
  
  const handleSubmit = useCallback(async (data: { startTime: Date; endTime?: Date; milkAmount: number }) => {
    if (isEditing && activityId) {
      updateActivity.mutate(
        {
          params: { path: { id: activityId } },
          body: {
            startTime: data.startTime.toISOString(),
            endTime: data.endTime?.toISOString(),
            milkAmount: data.milkAmount,
          },
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    } else {
      createActivity.mutate(
        {
          type: ActivityType.PUMP,
          startTime: data.startTime.toISOString(),
          endTime: data.endTime?.toISOString(),
          milkAmount: data.milkAmount,
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    }
  }, [isEditing, activityId, createActivity, updateActivity, closeModal])

  const handleForceCreate = useCallback(() => {
    createActivity.forceCreate({
      onSuccess: () => closeModal(),
    })
  }, [createActivity, closeModal])
  
  if (!isOpen) return null
  
  const title = isEditing 
    ? `编辑${ActivityTypeLabels[ActivityType.PUMP]}` 
    : ActivityTypeLabels[ActivityType.PUMP]
  
  return (
    <>
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
          <PumpForm
            onSubmit={handleSubmit}
            onCancel={closeModal}
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
