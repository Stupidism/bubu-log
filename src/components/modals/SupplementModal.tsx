'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BottomSheet } from '@/components/BottomSheet'
import { SupplementForm } from '@/components/forms'
import { useModalParams } from '@/hooks/useModalParams'
import { useCreateActivityWithConflictCheck, useUpdateActivity, useActivity } from '@/lib/api/hooks'
import { ActivityType } from '@/types/activity'
import type { SupplementType } from '@/types/activity'
import type { components } from '@/lib/api/openapi-types'
import { Loader2 } from 'lucide-react'
import { OverlapConfirmModal } from './OverlapConfirmModal'

export function SupplementModal() {
  const { modalType, activityId, closeModal, selectedDate } = useModalParams()
  const searchParams = useSearchParams()
  
  const isOpen = modalType === 'supplement'
  const isEditing = !!activityId
  
  // 如果是编辑模式，获取活动数据
  const { data: activity, isLoading } = useActivity(activityId || '', {
    enabled: isEditing && isOpen,
  })
  
  const createActivity = useCreateActivityWithConflictCheck()
  const updateActivity = useUpdateActivity()
  
  // 解析 URL 中的初始值（来自语音输入或活动选择器）
  const initialValuesFromUrl = useMemo(() => {
    if (isEditing || !isOpen) return undefined
    
    const supplementType = searchParams.get('supplementType')
    const startTime = searchParams.get('startTime')
    
    // 使用 URL 中的时间，或者使用当前选中日期的当前时间
    const defaultTime = new Date()
    defaultTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    
    return {
      startTime: startTime ? new Date(startTime) : defaultTime,
      supplementType: supplementType as SupplementType | undefined,
    }
  }, [isEditing, isOpen, searchParams, selectedDate])
  
  // 编辑模式的初始值
  const initialValues = useMemo(() => {
    if (isEditing && activity) {
      return {
        startTime: new Date(activity.startTime),
        supplementType: activity.supplementType as SupplementType | undefined,
      }
    }
    return initialValuesFromUrl
  }, [isEditing, activity, initialValuesFromUrl])
  
  const handleSubmit = useCallback(async (data: Record<string, unknown>) => {
    if (isEditing && activityId) {
      // 更新现有活动
      updateActivity.mutate(
        {
          params: { path: { id: activityId } },
          body: {
            startTime: (data.startTime as Date).toISOString(),
            supplementType: data.supplementType as components["schemas"]["SupplementType"],
          },
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    } else {
      // 创建新活动（带冲突检查）
      createActivity.mutate(
        {
          type: ActivityType.SUPPLEMENT,
          startTime: (data.startTime as Date).toISOString(),
          supplementType: data.supplementType as components["schemas"]["SupplementType"],
        },
        {
          onSuccess: () => closeModal(),
        }
      )
    }
  }, [isEditing, activityId, createActivity, updateActivity, closeModal])

  // 处理强制创建（确认重叠后）
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
        title={isEditing ? '编辑补剂' : '补剂'}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <SupplementForm
            onSubmit={handleSubmit}
            onCancel={closeModal}
            initialValues={initialValues}
            isEditing={isEditing}
          />
        )}
      </BottomSheet>

      {/* 时间重叠确认弹窗 */}
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
