'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BottomSheet } from '@/components/BottomSheet'
import { BottleForm } from '@/components/forms'
import { useModalParams } from '@/hooks/useModalParams'
import { useCreateActivity, useUpdateActivity, useActivity } from '@/lib/api/hooks'
import { ActivityType } from '@/types/activity'
import { Loader2 } from 'lucide-react'

export function BottleModal() {
  const { modalType, activityId, closeModal, selectedDate } = useModalParams()
  const searchParams = useSearchParams()
  
  const isOpen = modalType === 'bottle'
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
    const endTime = searchParams.get('endTime')
    const milkAmount = searchParams.get('milkAmount')
    const burpSuccess = searchParams.get('burpSuccess')
    
    // 使用 URL 中的时间，或者使用当前选中日期的当前时间
    const defaultTime = new Date()
    defaultTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    
    return {
      startTime: startTime ? new Date(startTime) : defaultTime,
      endTime: endTime ? new Date(endTime) : undefined,
      milkAmount: milkAmount ? parseInt(milkAmount, 10) : undefined,
      burpSuccess: burpSuccess ? burpSuccess === 'true' : undefined,
    }
  }, [isEditing, isOpen, searchParams, selectedDate])
  
  // 编辑模式的初始值
  const initialValues = useMemo(() => {
    if (isEditing && activity) {
      return {
        startTime: new Date(activity.startTime),
        endTime: activity.endTime ? new Date(activity.endTime) : undefined,
        milkAmount: activity.milkAmount ?? undefined,
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
            startTime: (data.startTime as Date).toISOString(),
            endTime: data.endTime ? (data.endTime as Date).toISOString() : undefined,
            milkAmount: data.milkAmount as number,
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
            type: ActivityType.BOTTLE,
            startTime: (data.startTime as Date).toISOString(),
            endTime: data.endTime ? (data.endTime as Date).toISOString() : undefined,
            milkAmount: data.milkAmount as number,
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
      title={isEditing ? '编辑瓶喂记录' : '瓶喂'}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <BottleForm
          onSubmit={handleSubmit}
          onCancel={closeModal}
          initialValues={initialValues}
          isEditing={isEditing}
        />
      )}
    </BottomSheet>
  )
}

