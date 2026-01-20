'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ActivityButton } from '@/components/ActivityButton'
import { BottomSheet } from '@/components/BottomSheet'
import { Toast } from '@/components/Toast'
import { AvatarUpload } from '@/components/AvatarUpload'
import { PullToRefresh } from '@/components/PullToRefresh'
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
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import Link from 'next/link'
import { Moon, Sun, Milk, Baby as DiaperIcon, Target, BarChart3, Droplet } from 'lucide-react'
import { useSleepState, useCreateActivity, useUpdateActivity } from '@/lib/api/hooks'
import type { components } from '@/lib/api/openapi-types'

type FormType = 
  | 'diaper'
  | 'breastfeed'
  | 'bottle'
  | 'activity_duration'
  | 'simple'
  | 'sleep_start'
  | 'sleep_end'
  | null

type DiaperType = 'poop' | 'pee' | 'both'

interface SleepActivityData {
  id: string
  recordTime: string
}

export default function Home() {
  const queryClient = useQueryClient()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [currentForm, setCurrentForm] = useState<FormType>(null)
  const [currentActivityType, setCurrentActivityType] = useState<ActivityType | null>(null)
  const [currentSleepActivity, setCurrentSleepActivity] = useState<SleepActivityData | null>(null)
  const [currentDiaperType, setCurrentDiaperType] = useState<DiaperType | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // 睡眠状态
  const { sleepState, isSleeping, isFetching: sleepFetching, getCurrentSleepActivity } = useSleepState()
  
  // 版本检测 - 每分钟检查一次新版本
  const { hasNewVersion, refresh: refreshPage, dismiss: dismissUpdate } = useVersionCheck(60000)
  
  // Mutation for creating and updating activities
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()

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

  // 提交活动记录
  const submitActivity = useCallback(async (data: Record<string, unknown>) => {
    if (createActivity.isPending || updateActivity.isPending) return

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
            setIsSheetOpen(false)
            setCurrentForm(null)
            setCurrentSleepActivity(null)
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
          setIsSheetOpen(false)
          setCurrentForm(null)
          setCurrentSleepActivity(null)
        },
        onError: (error) => {
          console.error('Failed to submit activity:', error)
          setToast({ message: '记录失败，请重试', type: 'error' })
        },
      }
    )
  }, [createActivity, updateActivity, currentActivityType, currentForm, currentSleepActivity])

  // 关闭表单
  const closeForm = useCallback(() => {
    setIsSheetOpen(false)
    setCurrentForm(null)
    setCurrentActivityType(null)
    setCurrentSleepActivity(null)
    setCurrentDiaperType(null)
  }, [])

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <main className="min-h-screen bg-gradient-to-b from-[#fefbf6] to-[#fff5e6] dark:from-[#1a1a2e] dark:to-[#16213e] safe-area-top safe-area-bottom">
        {/* 顶部标题栏 */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AvatarUpload />
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                宝宝日记
              </h1>
            </div>
            <Link 
              href="/stats" 
              className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors flex items-center gap-1.5"
            >
              <BarChart3 size={16} />
              数据
            </Link>
          </div>
        </header>

        {/* 主要按钮区域 */}
        <div className="p-4 space-y-6">
          {/* 睡眠区域 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center gap-1.5">
              <Moon size={16} />
              睡眠
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <ActivityButton
                type={ActivityType.SLEEP}
                label="入睡"
                onClick={() => openForm(ActivityType.SLEEP)}
                variant="sleep"
                disabled={isSleeping}
                loading={sleepFetching}
              />
              {/* 睡醒按钮 - 使用自定义按钮因为不是独立的活动类型 */}
              <button
                onClick={() => openForm('wake')}
                disabled={sleepFetching}
                className={`big-button bg-gradient-to-br from-indigo-400 to-purple-500 text-white ${sleepFetching ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Sun size={32} className="mb-1" />
                <span className="text-base font-semibold">睡醒</span>
              </button>
            </div>
          </section>

          {/* 喂奶区域 - 单条记录模式 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center gap-1.5">
              <Milk size={16} />
              喂奶
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <ActivityButton
                type={ActivityType.BREASTFEED}
                onClick={() => openForm(ActivityType.BREASTFEED)}
                variant="feed"
              />
              <ActivityButton
                type={ActivityType.BOTTLE}
                onClick={() => openForm(ActivityType.BOTTLE)}
                variant="feed"
              />
            </div>
          </section>

          {/* 换尿布 - 三个快捷按钮 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center gap-1.5">
              <DiaperIcon size={16} />
              换尿布
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => openDiaperForm('poop')}
                className="big-button bg-gradient-to-br from-amber-400 to-orange-500 text-white"
              >
                <span className="text-2xl mb-1">💩</span>
                <span className="text-base font-semibold">大便</span>
              </button>
              <button
                onClick={() => openDiaperForm('pee')}
                className="big-button bg-gradient-to-br from-yellow-300 to-amber-400 text-white"
              >
                <Droplet size={28} className="mb-1" />
                <span className="text-base font-semibold">小便</span>
              </button>
              <button
                onClick={() => openDiaperForm('both')}
                className="big-button bg-gradient-to-br from-teal-400 to-cyan-500 text-white"
              >
                <span className="text-2xl mb-1">💩💧</span>
                <span className="text-base font-semibold">大小便</span>
              </button>
            </div>
          </section>

          {/* 其他活动 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center gap-1.5">
              <Target size={16} />
              其他活动
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <ActivityButton
                type={ActivityType.HEAD_LIFT}
                onClick={() => openForm(ActivityType.HEAD_LIFT)}
                variant="activity"
              />
              <ActivityButton
                type={ActivityType.PASSIVE_EXERCISE}
                onClick={() => openForm(ActivityType.PASSIVE_EXERCISE)}
                variant="activity"
              />
              <ActivityButton
                type={ActivityType.GAS_EXERCISE}
                onClick={() => openForm(ActivityType.GAS_EXERCISE)}
                variant="activity"
              />
              <ActivityButton
                type={ActivityType.BATH}
                onClick={() => openForm(ActivityType.BATH)}
                variant="activity"
              />
              <ActivityButton
                type={ActivityType.OUTDOOR}
                onClick={() => openForm(ActivityType.OUTDOOR)}
                variant="activity"
              />
              <ActivityButton
                type={ActivityType.EARLY_EDUCATION}
                onClick={() => openForm(ActivityType.EARLY_EDUCATION)}
                variant="activity"
              />
            </div>
          </section>
        </div>

        {/* 底部表单面板 */}
        <BottomSheet
          isOpen={isSheetOpen}
          onClose={closeForm}
          title={currentActivityType ? ActivityTypeLabels[currentActivityType] : ''}
        >
          {currentForm === 'diaper' && (
            <DiaperForm
              onSubmit={submitActivity}
              onCancel={closeForm}
              hideTypeSelection={!!currentDiaperType}
              initialValues={currentDiaperType ? {
                hasPoop: currentDiaperType === 'poop' || currentDiaperType === 'both',
                hasPee: currentDiaperType === 'pee' || currentDiaperType === 'both',
              } : undefined}
            />
          )}
          {currentForm === 'breastfeed' && (
            <BreastfeedForm
              onSubmit={submitActivity}
              onCancel={closeForm}
            />
          )}
          {currentForm === 'bottle' && (
            <BottleForm
              onSubmit={submitActivity}
              onCancel={closeForm}
            />
          )}
          {currentForm === 'activity_duration' && currentActivityType && (
            <ActivityDurationForm
              type={currentActivityType}
              onSubmit={submitActivity}
              onCancel={closeForm}
            />
          )}
          {currentForm === 'simple' && currentActivityType && (
            <SimpleActivityForm
              type={currentActivityType}
              onSubmit={submitActivity}
              onCancel={closeForm}
            />
          )}
          {currentForm === 'sleep_start' && (
            <SimpleActivityForm
              type={ActivityType.SLEEP}
              onSubmit={submitActivity}
              onCancel={closeForm}
            />
          )}
          {currentForm === 'sleep_end' && (
            <SleepEndForm
              startTime={currentSleepActivity ? new Date(currentSleepActivity.recordTime) : undefined}
              onSubmit={submitActivity}
              onCancel={closeForm}
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
  )
}
