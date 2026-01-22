'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BottomSheet } from '@/components/BottomSheet'
import { Toast } from '@/components/Toast'
import { AvatarUpload } from '@/components/AvatarUpload'
import { PullToRefresh } from '@/components/PullToRefresh'
import { ActivityFAB, type VoiceParsedData } from '@/components/ActivityFAB'
import { DayTimeline, type DayTimelineRef } from '@/components/DayTimeline'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { useVersionCheck } from '@/hooks/useVersionCheck'
import {
  DiaperForm,
  BreastfeedForm,
  BottleForm,
  ActivityDurationForm,
  SimpleActivityForm,
  SleepEndForm,
} from '@/components/forms'
import { ActivityType, ActivityTypeLabels, PoopColor, PeeAmount } from '@/types/activity'
import Link from 'next/link'
import { format, subDays, addMinutes } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { BarChart3, ChevronLeft, ChevronRight, Moon, Milk, Baby, Target, Droplet, Check, Loader2 } from 'lucide-react'
import { useSleepState, useCreateActivity, useUpdateActivity, useActivities, type Activity } from '@/lib/api/hooks'
import type { components } from '@/lib/api/openapi-types'
import { ActivityIcon } from '@/components/ActivityIcon'

type FormType = 
  | 'diaper'
  | 'breastfeed'
  | 'bottle'
  | 'activity_duration'
  | 'simple'
  | 'sleep_start'
  | 'sleep_end'
  | 'activity_detail'
  | null

type DiaperType = 'poop' | 'pee' | 'both'

interface SleepActivityData {
  id: string
  recordTime: string
}

// 每日统计
interface DaySummary {
  sleepCount: number
  totalSleepMinutes: number
  feedingCount: number
  totalMilkAmount: number
  diaperCount: number
  poopCount: number
}

export default function Home() {
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [currentForm, setCurrentForm] = useState<FormType>(null)
  const [currentActivityType, setCurrentActivityType] = useState<ActivityType | null>(null)
  const [currentSleepActivity, setCurrentSleepActivity] = useState<SleepActivityData | null>(null)
  const [currentDiaperType, setCurrentDiaperType] = useState<DiaperType | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [voiceInitialValues, setVoiceInitialValues] = useState<VoiceParsedData | null>(null)
  const timelineRef = useRef<DayTimelineRef>(null)

  // 获取活动数据
  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const { data: activities = [], isLoading: activitiesLoading, refetch } = useActivities({
    date: dateStr,
    limit: 100,
  })

  // 睡眠状态
  const { isSleeping, isFetching: sleepFetching, getCurrentSleepActivity } = useSleepState()
  
  // 版本检测 - 每分钟检查一次新版本
  const { hasNewVersion, refresh: refreshPage, dismiss: dismissUpdate } = useVersionCheck(60000)
  
  // Mutation for creating and updating activities
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()

  // 计算每日统计
  const summary = useMemo<DaySummary>(() => {
    const result: DaySummary = {
      sleepCount: 0,
      totalSleepMinutes: 0,
      feedingCount: 0,
      totalMilkAmount: 0,
      diaperCount: 0,
      poopCount: 0,
    }

    for (const activity of activities) {
      switch (activity.type) {
        case 'SLEEP':
          if (activity.duration) {
            result.sleepCount++
            result.totalSleepMinutes += activity.duration
          }
          break
        case 'BREASTFEED':
        case 'BOTTLE':
          result.feedingCount++
          if (activity.milkAmount) {
            result.totalMilkAmount += activity.milkAmount
          }
          break
        case 'DIAPER':
          result.diaperCount++
          if (activity.hasPoop) {
            result.poopCount++
          }
          break
      }
    }

    return result
  }, [activities])

  // 格式化分钟为小时和分钟
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h${mins > 0 ? mins + 'm' : ''}`
    }
    return `${mins}m`
  }

  // 日期导航
  const navigateDate = (days: number) => {
    setSelectedDate((prev) => subDays(prev, -days))
  }

  // 是否是今天
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  // 自动滚动到当前时间
  useEffect(() => {
    if (!isToday || activitiesLoading) return
    
    const LAST_VISIT_KEY = 'bubu-log-last-visit'
    const now = Date.now()
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY)
    const thirtyMinutes = 30 * 60 * 1000
    
    // 首次访问或超过30分钟，滚动到当前时间
    if (!lastVisit || now - parseInt(lastVisit) > thirtyMinutes) {
      setTimeout(() => {
        timelineRef.current?.scrollToCurrentTime()
      }, 100)
    }
    
    // 更新最后访问时间
    localStorage.setItem(LAST_VISIT_KEY, now.toString())
    
    // 页面可见性变化时检测
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const lastTime = localStorage.getItem(LAST_VISIT_KEY)
        if (lastTime && Date.now() - parseInt(lastTime) > thirtyMinutes) {
          timelineRef.current?.scrollToCurrentTime()
        }
        localStorage.setItem(LAST_VISIT_KEY, Date.now().toString())
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isToday, activitiesLoading])

  // 下拉刷新处理
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries()
    setToast({ message: '刷新成功', type: 'success' })
  }, [queryClient])

  // 打开换尿布表单
  const openDiaperForm = useCallback((diaperType: DiaperType) => {
    setCurrentActivityType(ActivityType.DIAPER)
    setCurrentDiaperType(diaperType)
    setCurrentForm('diaper')
    setIsSheetOpen(true)
  }, [])

  // 打开表单
  const openForm = useCallback(async (type: ActivityType | 'wake') => {
    if (type === 'wake') {
      // 睡醒：如果有正在进行的睡眠记录，更新它；否则手动输入时长
      setCurrentActivityType(ActivityType.SLEEP)
      if (isSleeping) {
        const sleepData = getCurrentSleepActivity()
        setCurrentSleepActivity(sleepData ? { id: sleepData.id, recordTime: sleepData.recordTime } : null)
      } else {
        setCurrentSleepActivity(null)
      }
      setCurrentForm('sleep_end')
      setIsSheetOpen(true)
      return
    }

    setCurrentActivityType(type)

    switch (type) {
      case ActivityType.DIAPER:
        setCurrentForm('diaper')
        break
      case ActivityType.SLEEP:
        // 入睡：创建新的 SLEEP 记录，duration=null
        setCurrentForm('sleep_start')
        break
      case ActivityType.BREASTFEED:
        setCurrentForm('breastfeed')
        break
      case ActivityType.BOTTLE:
        setCurrentForm('bottle')
        break
      case ActivityType.HEAD_LIFT:
      case ActivityType.PASSIVE_EXERCISE:
      case ActivityType.GAS_EXERCISE:
      case ActivityType.BATH:
      case ActivityType.OUTDOOR:
      case ActivityType.EARLY_EDUCATION:
        setCurrentForm('activity_duration')
        break
      default:
        setCurrentForm('simple')
    }

    setIsSheetOpen(true)
  }, [isSleeping, getCurrentSleepActivity])

  // 处理语音输入需要确认的情况
  const handleVoiceConfirmation = useCallback((parsed: VoiceParsedData) => {
    // Store the parsed data for initial values
    setVoiceInitialValues(parsed)
    setCurrentActivityType(parsed.type)
    
    // Determine which form to open based on activity type
    switch (parsed.type) {
      case ActivityType.DIAPER:
        // Set diaper type based on parsed data
        if (parsed.hasPoop && parsed.hasPee) {
          setCurrentDiaperType('both')
        } else if (parsed.hasPoop) {
          setCurrentDiaperType('poop')
        } else if (parsed.hasPee) {
          setCurrentDiaperType('pee')
        }
        setCurrentForm('diaper')
        break
      case ActivityType.SLEEP:
        // If has duration, it's a wake-up event (sleep end)
        if (parsed.duration) {
          setCurrentSleepActivity(null) // No existing sleep activity
          setCurrentForm('sleep_end')
        } else {
          setCurrentForm('sleep_start')
        }
        break
      case ActivityType.BREASTFEED:
        setCurrentForm('breastfeed')
        break
      case ActivityType.BOTTLE:
        setCurrentForm('bottle')
        break
      case ActivityType.HEAD_LIFT:
      case ActivityType.PASSIVE_EXERCISE:
      case ActivityType.GAS_EXERCISE:
      case ActivityType.BATH:
      case ActivityType.OUTDOOR:
      case ActivityType.EARLY_EDUCATION:
        setCurrentForm('activity_duration')
        break
      default:
        setCurrentForm('simple')
    }

    setIsSheetOpen(true)
    setToast({ message: `请确认: ${parsed.originalText}`, type: 'success' })
  }, [])

  // 点击活动查看详情
  const handleActivityClick = useCallback((activity: Activity) => {
    setSelectedActivity(activity)
    setCurrentForm('activity_detail')
    setIsSheetOpen(true)
  }, [])

  // 开始编辑活动
  const handleEdit = useCallback(() => {
    if (!selectedActivity) return
    setCurrentActivityType(selectedActivity.type as ActivityType)
    setIsEditing(true)
  }, [selectedActivity])

  // 提交活动记录
  const submitActivity = useCallback(async (data: Record<string, unknown>) => {
    if (createActivity.isPending || updateActivity.isPending) return

    // 编辑模式
    if (isEditing && selectedActivity) {
      updateActivity.mutate(
        {
          params: { path: { id: selectedActivity.id } },
          body: {
            recordTime: (data.recordTime as Date).toISOString(),
            ...(data.hasPoop !== undefined && { hasPoop: data.hasPoop as boolean }),
            ...(data.hasPee !== undefined && { hasPee: data.hasPee as boolean }),
            ...(data.poopColor !== undefined && { poopColor: data.poopColor as components["schemas"]["PoopColor"] }),
            ...(data.poopPhotoUrl !== undefined && { poopPhotoUrl: data.poopPhotoUrl as string }),
            ...(data.peeAmount !== undefined && { peeAmount: data.peeAmount as components["schemas"]["PeeAmount"] }),
            ...(data.burpSuccess !== undefined && { burpSuccess: data.burpSuccess as boolean }),
            ...(data.duration !== undefined && { duration: data.duration as number }),
            ...(data.milkAmount !== undefined && { milkAmount: data.milkAmount as number }),
            ...(data.notes !== undefined && { notes: data.notes as string }),
          },
        },
        {
          onSuccess: () => {
            setToast({ message: '修改成功！', type: 'success' })
            closeForm()
            refetch()
          },
          onError: (error) => {
            console.error('Failed to update activity:', error)
            setToast({ message: '修改失败，请重试', type: 'error' })
          },
        }
      )
      return
    }

    // 睡醒：如果有正在进行的睡眠记录，更新它
    if (currentForm === 'sleep_end' && currentSleepActivity) {
      updateActivity.mutate(
        {
          params: { path: { id: currentSleepActivity.id } },
          body: {
            duration: data.duration as number,
          },
        },
        {
          onSuccess: () => {
            setToast({ message: '记录成功！', type: 'success' })
            closeForm()
          },
          onError: (error) => {
            console.error('Failed to update sleep activity:', error)
            setToast({ message: '记录失败，请重试', type: 'error' })
          },
        }
      )
      return
    }

    // 入睡：创建 SLEEP 记录，duration=null
    const activityType = currentForm === 'sleep_start' 
      ? 'SLEEP' as components["schemas"]["ActivityType"]
      : currentActivityType as components["schemas"]["ActivityType"]

    createActivity.mutate(
      {
        body: {
          type: activityType,
          recordTime: (data.recordTime as Date).toISOString(),
          ...(data.hasPoop !== undefined && { hasPoop: data.hasPoop as boolean }),
          ...(data.hasPee !== undefined && { hasPee: data.hasPee as boolean }),
          ...(data.poopColor !== undefined && { poopColor: data.poopColor as components["schemas"]["PoopColor"] }),
          ...(data.poopPhotoUrl !== undefined && { poopPhotoUrl: data.poopPhotoUrl as string }),
          ...(data.peeAmount !== undefined && { peeAmount: data.peeAmount as components["schemas"]["PeeAmount"] }),
          ...(data.burpSuccess !== undefined && { burpSuccess: data.burpSuccess as boolean }),
          ...(data.duration !== undefined && { duration: data.duration as number }),
          ...(data.milkAmount !== undefined && { milkAmount: data.milkAmount as number }),
          ...(data.notes !== undefined && { notes: data.notes as string }),
        },
      },
      {
        onSuccess: () => {
          setToast({ message: '记录成功！', type: 'success' })
          closeForm()
        },
        onError: (error) => {
          console.error('Failed to submit activity:', error)
          setToast({ message: '记录失败，请重试', type: 'error' })
        },
      }
    )
  }, [createActivity, updateActivity, currentActivityType, currentForm, currentSleepActivity, isEditing, selectedActivity, refetch])

  // 关闭表单
  const closeForm = useCallback(() => {
    setIsSheetOpen(false)
    setCurrentForm(null)
    setCurrentActivityType(null)
    setCurrentSleepActivity(null)
    setCurrentDiaperType(null)
    setSelectedActivity(null)
    setIsEditing(false)
    setVoiceInitialValues(null)
  }, [])

  // 渲染活动详情
  const renderActivityDetails = (activity: Activity) => {
    const formatTimeRange = (startTime: Date | string, duration: number) => {
      const start = new Date(startTime)
      const end = addMinutes(start, duration)
      return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
    }

    const formatDurationLong = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      if (hours > 0) {
        return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`
      }
      return `${mins}分钟`
    }

    switch (activity.type) {
      case 'DIAPER':
        return (
          <div className="flex items-center gap-2 text-base text-gray-600 dark:text-gray-400">
            {activity.hasPoop && (
              <span className="flex items-center gap-1">
                <span className="text-amber-700">💩</span>
                {activity.poopColor && (
                  <span className={`px-2 py-0.5 rounded text-sm ${
                    activity.poopColor === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                    activity.poopColor === 'GREEN' ? 'bg-green-100 text-green-800' :
                    activity.poopColor === 'BROWN' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.poopColor === 'YELLOW' ? '黄色' :
                     activity.poopColor === 'GREEN' ? '绿色' :
                     activity.poopColor === 'BROWN' ? '棕色' : activity.poopColor}
                  </span>
                )}
              </span>
            )}
            {activity.hasPee && (
              <span className="flex items-center gap-1">
                <Droplet size={16} className="text-blue-400" />
                小便
              </span>
            )}
          </div>
        )
      case 'BREASTFEED':
        return (
          <div className="text-base text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
            {activity.duration && (
              <>
                <span className="text-pink-600 dark:text-pink-400 font-medium">
                  {formatTimeRange(activity.recordTime, activity.duration)}
                </span>
                <span>({activity.duration}分钟)</span>
              </>
            )}
            {activity.burpSuccess && (
              <span className="flex items-center gap-1">
                <Check size={16} className="text-green-500" />
                拍嗝
              </span>
            )}
          </div>
        )
      case 'BOTTLE':
        return (
          <div className="text-base text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
            {activity.milkAmount && (
              <span className="text-blue-600 dark:text-blue-400 font-medium text-lg">
                {activity.milkAmount}ml
              </span>
            )}
            {activity.duration && (
              <>
                <span className="text-gray-500">
                  {formatTimeRange(activity.recordTime, activity.duration)}
                </span>
                <span>({activity.duration}分钟)</span>
              </>
            )}
            {activity.burpSuccess && (
              <span className="flex items-center gap-1">
                <Check size={16} className="text-green-500" />
                拍嗝
              </span>
            )}
          </div>
        )
      case 'SLEEP':
        return activity.duration ? (
          <span className="text-base text-amber-600 dark:text-amber-400 font-medium">
            {formatTimeRange(activity.recordTime, activity.duration)} ({formatDurationLong(activity.duration)})
          </span>
        ) : (
          <span className="text-base text-amber-500 dark:text-amber-400 animate-pulse">
            正在睡觉...
          </span>
        )
      default:
        return activity.duration ? (
          <span className="text-base text-gray-600 dark:text-gray-400">
            {activity.duration}分钟
          </span>
        ) : null
    }
  }

  // 渲染编辑表单
  const renderEditForm = () => {
    if (!selectedActivity) return null

    const activityType = selectedActivity.type as ActivityType
    const initialValues = {
      recordTime: new Date(selectedActivity.recordTime),
      duration: selectedActivity.duration || undefined,
      milkAmount: selectedActivity.milkAmount || undefined,
      burpSuccess: selectedActivity.burpSuccess || undefined,
      hasPoop: selectedActivity.hasPoop || undefined,
      hasPee: selectedActivity.hasPee || undefined,
      poopColor: selectedActivity.poopColor as PoopColor | undefined,
      poopPhotoUrl: selectedActivity.poopPhotoUrl || undefined,
      peeAmount: selectedActivity.peeAmount as PeeAmount | undefined,
    }

    switch (activityType) {
      case ActivityType.DIAPER:
        return (
          <DiaperForm
            onSubmit={submitActivity}
            onCancel={() => setIsEditing(false)}
            initialValues={initialValues}
            isEditing
          />
        )
      case ActivityType.BREASTFEED:
        return (
          <BreastfeedForm
            onSubmit={submitActivity}
            onCancel={() => setIsEditing(false)}
            initialValues={initialValues}
            isEditing
          />
        )
      case ActivityType.BOTTLE:
        return (
          <BottleForm
            onSubmit={submitActivity}
            onCancel={() => setIsEditing(false)}
            initialValues={initialValues}
            isEditing
          />
        )
      case ActivityType.SLEEP:
        return (
          <SleepEndForm
            onSubmit={submitActivity}
            onCancel={() => setIsEditing(false)}
            initialValues={initialValues}
            isEditing
          />
        )
      default:
        return (
          <ActivityDurationForm
            type={activityType}
            onSubmit={submitActivity}
            onCancel={() => setIsEditing(false)}
            initialValues={initialValues}
            isEditing
          />
        )
    }
  }

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
      <main className="min-h-screen bg-gradient-to-b from-[#fefbf6] to-[#fff5e6] dark:from-[#1a1a2e] dark:to-[#16213e] safe-area-top pb-24">
        {/* 顶部标题栏 - 紧凑设计 */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
          <div className="px-3 py-2.5 flex items-center justify-between gap-2">
            {/* 左侧：头像 */}
            <AvatarUpload />
            
            {/* 中间：日期选择器 */}
            <div className="flex items-center gap-1 flex-1 justify-center">
              <button
                onClick={() => navigateDate(-1)}
                className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center min-w-[80px]">
                <p className="text-base font-bold text-gray-800 dark:text-gray-100">
                  {isToday ? '今天' : format(selectedDate, 'M月d日', { locale: zhCN })}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {format(selectedDate, 'EEEE', { locale: zhCN })}
                </p>
              </div>
              <button
                onClick={() => navigateDate(1)}
                className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
                disabled={isToday}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            {/* 右侧：数据入口 */}
            <Link 
              href="/stats" 
              className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors flex items-center gap-1"
            >
              <BarChart3 size={14} />
              数据
            </Link>
          </div>
        </header>

        {/* 今日统计卡片 */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm">
              <Moon size={18} className="mx-auto text-indigo-500 mb-1" />
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {summary.totalSleepMinutes > 0 ? formatDuration(summary.totalSleepMinutes) : '-'}
              </p>
              <p className="text-xs text-gray-500">{summary.sleepCount}次</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm">
              <Milk size={18} className="mx-auto text-pink-500 mb-1" />
              <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                {summary.totalMilkAmount > 0 ? `${summary.totalMilkAmount}ml` : '-'}
              </p>
              <p className="text-xs text-gray-500">{summary.feedingCount}次</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm">
              <Baby size={18} className="mx-auto text-teal-500 mb-1" />
              <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                {summary.diaperCount}
              </p>
              <p className="text-xs text-gray-500">换尿布</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm">
              <span className="text-lg block mb-1">💩</span>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {summary.poopCount}
              </p>
              <p className="text-xs text-gray-500">大便</p>
            </div>
          </div>
        </div>

        {/* 时间线 */}
        <div className="px-4">
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg mb-2">还没有记录</p>
              <p className="text-sm">点击右下角的 + 按钮添加活动</p>
            </div>
          ) : (
            <DayTimeline
              ref={timelineRef}
              activities={activities}
              date={selectedDate}
              onActivityClick={handleActivityClick}
              showCurrentTime={isToday}
            />
          )}
        </div>

        {/* 底部表单面板 */}
        <BottomSheet
          isOpen={isSheetOpen}
          onClose={closeForm}
          title={
            currentForm === 'activity_detail' && selectedActivity
              ? (isEditing ? '编辑记录' : ActivityTypeLabels[selectedActivity.type as ActivityType])
              : (currentActivityType ? ActivityTypeLabels[currentActivityType] : '')
          }
        >
          {/* 活动详情视图 */}
          {currentForm === 'activity_detail' && selectedActivity && !isEditing && (
            <div className="space-y-6">
              {/* 活动信息 */}
              <div className="text-center">
                <ActivityIcon type={selectedActivity.type as ActivityType} size={56} className="text-gray-600 dark:text-gray-300 mx-auto" />
                <h3 className="text-2xl font-bold mt-3 text-gray-800 dark:text-gray-100">
                  {ActivityTypeLabels[selectedActivity.type as ActivityType]}
                </h3>
                <p className="text-xl text-gray-500 dark:text-gray-400 mt-1">
                  {format(new Date(selectedActivity.recordTime), 'M月d日 HH:mm', { locale: zhCN })}
                </p>
              </div>

              {/* 详细信息 */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                {renderActivityDetails(selectedActivity)}
                {selectedActivity.notes && (
                  <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
                    备注: {selectedActivity.notes}
                  </p>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleEdit}
                  className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-lg"
                >
                  编辑
                </button>
                <button
                  onClick={closeForm}
                  className="p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-lg"
                >
                  关闭
                </button>
              </div>
            </div>
          )}

          {/* 编辑表单 */}
          {currentForm === 'activity_detail' && selectedActivity && isEditing && (
            renderEditForm()
          )}

          {/* 新建活动表单 */}
          {currentForm === 'diaper' && (
            <DiaperForm
              onSubmit={submitActivity}
              onCancel={closeForm}
              hideTypeSelection={!!currentDiaperType}
              initialValues={{
                ...(currentDiaperType && {
                  hasPoop: currentDiaperType === 'poop' || currentDiaperType === 'both',
                  hasPee: currentDiaperType === 'pee' || currentDiaperType === 'both',
                }),
                ...(voiceInitialValues && {
                  recordTime: new Date(voiceInitialValues.recordTime),
                  hasPoop: voiceInitialValues.hasPoop ?? undefined,
                  hasPee: voiceInitialValues.hasPee ?? undefined,
                  poopColor: voiceInitialValues.poopColor as PoopColor ?? undefined,
                  peeAmount: voiceInitialValues.peeAmount as PeeAmount ?? undefined,
                }),
              }}
            />
          )}
          {currentForm === 'breastfeed' && (
            <BreastfeedForm
              onSubmit={submitActivity}
              onCancel={closeForm}
              initialValues={voiceInitialValues ? {
                recordTime: new Date(voiceInitialValues.recordTime),
                duration: voiceInitialValues.duration ?? undefined,
              } : undefined}
            />
          )}
          {currentForm === 'bottle' && (
            <BottleForm
              onSubmit={submitActivity}
              onCancel={closeForm}
              initialValues={voiceInitialValues ? {
                recordTime: new Date(voiceInitialValues.recordTime),
                duration: voiceInitialValues.duration ?? undefined,
                milkAmount: voiceInitialValues.milkAmount ?? undefined,
              } : undefined}
            />
          )}
          {currentForm === 'activity_duration' && currentActivityType && (
            <ActivityDurationForm
              type={currentActivityType}
              onSubmit={submitActivity}
              onCancel={closeForm}
              initialValues={voiceInitialValues ? {
                recordTime: new Date(voiceInitialValues.recordTime),
                duration: voiceInitialValues.duration ?? undefined,
              } : undefined}
            />
          )}
          {currentForm === 'simple' && currentActivityType && (
            <SimpleActivityForm
              type={currentActivityType}
              onSubmit={submitActivity}
              onCancel={closeForm}
              initialValues={voiceInitialValues ? {
                recordTime: new Date(voiceInitialValues.recordTime),
              } : undefined}
            />
          )}
          {currentForm === 'sleep_start' && (
            <SimpleActivityForm
              type={ActivityType.SLEEP}
              onSubmit={submitActivity}
              onCancel={closeForm}
              initialValues={voiceInitialValues ? {
                recordTime: new Date(voiceInitialValues.recordTime),
              } : undefined}
            />
          )}
          {currentForm === 'sleep_end' && (
            <SleepEndForm
              startTime={currentSleepActivity ? new Date(currentSleepActivity.recordTime) : undefined}
              onSubmit={submitActivity}
              onCancel={closeForm}
              initialValues={voiceInitialValues ? {
                recordTime: new Date(voiceInitialValues.recordTime),
                duration: voiceInitialValues.duration ?? undefined,
              } : undefined}
            />
          )}
        </BottomSheet>

        {/* 新版本提示 */}
        {hasNewVersion && (
          <UpdatePrompt onRefresh={refreshPage} onDismiss={dismissUpdate} />
        )}

        {/* Toast 提示 */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </main>
    </PullToRefresh>

    {/* 悬浮操作按钮 - 放在 PullToRefresh 外面，避免 transform 影响 fixed 定位 */}
    <ActivityFAB
      onActivitySelect={openForm}
      onDiaperSelect={openDiaperForm}
      isSleeping={isSleeping}
      sleepLoading={sleepFetching}
      onVoiceSuccess={(message) => setToast({ message, type: 'success' })}
      onVoiceError={(message) => setToast({ message, type: 'error' })}
      onNeedConfirmation={handleVoiceConfirmation}
    />
    </>
  )
}
