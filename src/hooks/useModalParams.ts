'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ActivityType } from '@/types/activity'
import { dayjs } from '@/lib/dayjs'

export type ModalType = 
  | 'activity'        // 查看/编辑活动详情
  | 'delete'          // 删除确认
  | 'diaper'          // 换尿布表单
  | 'breastfeed'      // 亲喂表单
  | 'bottle'          // 瓶喂表单
  | 'sleep_start'     // 入睡表单
  | 'sleep_end'       // 睡醒表单
  | 'head_lift'       // 抬头
  | 'passive_exercise' // 被动操
  | 'gas_exercise'    // 排气操
  | 'bath'            // 洗澡
  | 'outdoor'         // 户外
  | 'early_education' // 早教

/**
 * ActivityType 到 ModalType 的映射
 */
export const activityTypeToModalType: Record<ActivityType | 'wake', ModalType> = {
  [ActivityType.DIAPER]: 'diaper',
  [ActivityType.BREASTFEED]: 'breastfeed',
  [ActivityType.BOTTLE]: 'bottle',
  [ActivityType.SLEEP]: 'sleep_start',
  [ActivityType.HEAD_LIFT]: 'head_lift',
  [ActivityType.PASSIVE_EXERCISE]: 'passive_exercise',
  [ActivityType.GAS_EXERCISE]: 'gas_exercise',
  [ActivityType.BATH]: 'bath',
  [ActivityType.OUTDOOR]: 'outdoor',
  [ActivityType.EARLY_EDUCATION]: 'early_education',
  'wake': 'sleep_end',
}

interface OpenModalOptions {
  id?: string
  edit?: boolean
  /** 额外参数，用于传递初始值等 */
  params?: Record<string, string>
}

interface ModalParams {
  /** 当前打开的弹窗类型 */
  modalType: ModalType | null
  /** 活动 ID（用于查看/编辑/删除） */
  activityId: string | null
  /** 是否处于编辑模式 */
  isEditing: boolean
  /** 当前选中的日期（用于首页日历） */
  selectedDate: Date
  /** 当前选中的日期字符串 (YYYY-MM-DD) */
  selectedDateStr: string
  /** 设置日期 */
  setSelectedDate: (date: Date) => void
  /** 关闭弹窗 */
  closeModal: () => void
  /** 打开弹窗 */
  openModal: (type: ModalType, options?: OpenModalOptions) => void
  /** 设置编辑模式 */
  setEditing: (editing: boolean) => void
  /** 打开活动详情 */
  openActivityDetail: (activityId: string) => void
  /** 打开删除确认 */
  openDeleteConfirm: (activityId: string) => void
}

/**
 * 通过 URL 参数管理弹窗状态和日期选择
 * 
 * URL 参数格式：
 * - ?date=2026-01-22 - 选择日期
 * - ?modal=activity&id=xxx - 查看活动详情
 * - ?modal=activity&id=xxx&edit=true - 编辑活动
 * - ?modal=delete&id=xxx - 删除确认
 * - ?modal=diaper - 新建换尿布记录
 * - ?modal=breastfeed - 新建亲喂记录
 * - ...
 */
export function useModalParams(): ModalParams {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const modalType = searchParams.get('modal') as ModalType | null
  const activityId = searchParams.get('id')
  const isEditing = searchParams.get('edit') === 'true'
  
  // 日期参数
  const dateParam = searchParams.get('date')
  const selectedDateStr = dateParam || dayjs().format('YYYY-MM-DD')
  const selectedDate = useMemo(() => {
    return dateParam ? dayjs(dateParam).toDate() : new Date()
  }, [dateParam])
  
  // 设置日期（保留其他参数）
  const setSelectedDate = useCallback((date: Date) => {
    const params = new URLSearchParams(searchParams.toString())
    const dateStr = dayjs(date).format('YYYY-MM-DD')
    // 只有不是今天才设置 date 参数
    if (dayjs(date).isSame(dayjs(), 'day')) {
      params.delete('date')
    } else {
      params.set('date', dateStr)
    }
    // 移除 modal 相关参数
    params.delete('modal')
    params.delete('id')
    params.delete('edit')
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])
  
  // 关闭弹窗（保留日期参数）
  const closeModal = useCallback(() => {
    const params = new URLSearchParams()
    if (dateParam) {
      params.set('date', dateParam)
    }
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, pathname, dateParam])
  
  // 打开弹窗（保留日期参数）
  const openModal = useCallback((type: ModalType, options?: OpenModalOptions) => {
    const params = new URLSearchParams()
    // 保留日期参数
    if (dateParam) {
      params.set('date', dateParam)
    }
    params.set('modal', type)
    if (options?.id) {
      params.set('id', options.id)
    }
    if (options?.edit) {
      params.set('edit', 'true')
    }
    // 添加额外参数
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        params.set(key, value)
      })
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, dateParam])
  
  const setEditing = useCallback((editing: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (editing) {
      params.set('edit', 'true')
    } else {
      params.delete('edit')
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])
  
  const openActivityDetail = useCallback((id: string) => {
    openModal('activity', { id })
  }, [openModal])
  
  const openDeleteConfirm = useCallback((id: string) => {
    openModal('delete', { id })
  }, [openModal])
  
  return useMemo(() => ({
    modalType,
    activityId,
    isEditing,
    selectedDate,
    selectedDateStr,
    setSelectedDate,
    closeModal,
    openModal,
    setEditing,
    openActivityDetail,
    openDeleteConfirm,
  }), [modalType, activityId, isEditing, selectedDate, selectedDateStr, setSelectedDate, closeModal, openModal, setEditing, openActivityDetail, openDeleteConfirm])
}
