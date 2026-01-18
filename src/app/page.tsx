'use client'

import { useState, useCallback } from 'react'
import { ActivityButton } from '@/components/ActivityButton'
import { BottomSheet } from '@/components/BottomSheet'
import { Toast } from '@/components/Toast'
import { AvatarUpload } from '@/components/AvatarUpload'
import {
  DiaperForm,
  BreastfeedEndForm,
  BottleEndForm,
  ActivityDurationForm,
  SimpleActivityForm,
  SleepEndForm,
} from '@/components/forms'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import Link from 'next/link'
import { Moon, Milk, Baby as DiaperIcon, Target, BarChart3 } from 'lucide-react'
import { usePairedActivityStates, useCreateActivity } from '@/lib/api/hooks'
import type { components } from '@/lib/api/openapi-types'

type FormType = 
  | 'diaper'
  | 'breastfeed_end'
  | 'bottle_end'
  | 'activity_duration'
  | 'simple'
  | 'sleep_end'
  | null

interface StartActivityData {
  id: string
  recordTime: string
}

export default function Home() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [currentForm, setCurrentForm] = useState<FormType>(null)
  const [currentActivityType, setCurrentActivityType] = useState<ActivityType | null>(null)
  const [startActivity, setStartActivity] = useState<StartActivityData | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Use new hooks for paired activity states
  const { pairedState, pairFetching, getStartActivity } = usePairedActivityStates()
  
  // Mutation for creating activities
  const createActivity = useCreateActivity()

  // 打开表单
  const openForm = useCallback(async (type: ActivityType) => {
    setCurrentActivityType(type)

    switch (type) {
      case ActivityType.DIAPER:
        setCurrentForm('diaper')
        break
      case ActivityType.SLEEP_END:
        // 获取入睡时间（如果有的话）
        if (pairedState.sleep === 'end') {
          const sleepData = getStartActivity('sleep')
          setStartActivity(sleepData ? { id: sleepData.id, recordTime: sleepData.recordTime } : null)
        } else {
          setStartActivity(null)
        }
        setCurrentForm('sleep_end')
        break
      case ActivityType.BREASTFEED_END:
        const bfData = getStartActivity('breastfeed')
        setStartActivity(bfData ? { id: bfData.id, recordTime: bfData.recordTime } : null)
        setCurrentForm('breastfeed_end')
        break
      case ActivityType.BOTTLE_END:
        const bottleData = getStartActivity('bottle')
        setStartActivity(bottleData ? { id: bottleData.id, recordTime: bottleData.recordTime } : null)
        setCurrentForm('bottle_end')
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
  }, [pairedState.sleep, getStartActivity])

  // 提交活动记录
  const submitActivity = useCallback(async (data: Record<string, unknown>) => {
    if (createActivity.isPending) return

    createActivity.mutate(
      {
        body: {
          type: currentActivityType as components["schemas"]["ActivityType"],
          recordTime: (data.recordTime as Date).toISOString(),
          ...(data.hasPoop !== undefined && { hasPoop: data.hasPoop as boolean }),
          ...(data.hasPee !== undefined && { hasPee: data.hasPee as boolean }),
          ...(data.poopColor !== undefined && { poopColor: data.poopColor as components["schemas"]["PoopColor"] }),
          ...(data.poopPhotoUrl !== undefined && { poopPhotoUrl: data.poopPhotoUrl as string }),
          ...(data.peeAmount !== undefined && { peeAmount: data.peeAmount as components["schemas"]["PeeAmount"] }),
          ...(data.burpSuccess !== undefined && { burpSuccess: data.burpSuccess as boolean }),
          ...(data.duration !== undefined && { duration: data.duration as number }),
          ...(data.milkAmount !== undefined && { milkAmount: data.milkAmount as number }),
          ...(startActivity?.id && { startActivityId: startActivity.id }),
          ...(data.notes !== undefined && { notes: data.notes as string }),
        },
      },
      {
        onSuccess: () => {
          setToast({ message: '记录成功！', type: 'success' })
          setIsSheetOpen(false)
          setCurrentForm(null)
          setStartActivity(null)
        },
        onError: (error) => {
          console.error('Failed to submit activity:', error)
          setToast({ message: '记录失败，请重试', type: 'error' })
        },
      }
    )
  }, [createActivity, currentActivityType, startActivity?.id])

  // 关闭表单
  const closeForm = useCallback(() => {
    setIsSheetOpen(false)
    setCurrentForm(null)
    setCurrentActivityType(null)
    setStartActivity(null)
  }, [])

  // 获取当前应该显示的喂奶按钮类型
  const breastfeedType = pairedState.breastfeed === 'start' ? ActivityType.BREASTFEED_START : ActivityType.BREASTFEED_END
  const bottleType = pairedState.bottle === 'start' ? ActivityType.BOTTLE_START : ActivityType.BOTTLE_END

  return (
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
              type={ActivityType.SLEEP_START}
              onClick={() => openForm(ActivityType.SLEEP_START)}
              variant="sleep"
              disabled={pairedState.sleep === 'end'}
              loading={pairFetching.sleep}
            />
            {/* 睡醒按钮始终可点击 */}
            <ActivityButton
              type={ActivityType.SLEEP_END}
              onClick={() => openForm(ActivityType.SLEEP_END)}
              variant="sleep"
              loading={pairFetching.sleep}
            />
          </div>
        </section>

        {/* 喂奶区域 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center gap-1.5">
            <Milk size={16} />
            喂奶
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ActivityButton
              type={breastfeedType}
              onClick={() => openForm(breastfeedType)}
              variant="feed"
              loading={pairFetching.breastfeed}
            />
            <ActivityButton
              type={bottleType}
              onClick={() => openForm(bottleType)}
              variant="feed"
              loading={pairFetching.bottle}
            />
          </div>
        </section>

        {/* 换尿布 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center gap-1.5">
            <DiaperIcon size={16} />
            换尿布
          </h2>
          <ActivityButton
            type={ActivityType.DIAPER}
            onClick={() => openForm(ActivityType.DIAPER)}
            variant="diaper"
          />
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
          <DiaperForm onSubmit={submitActivity} onCancel={closeForm} />
        )}
        {currentForm === 'breastfeed_end' && (
          <BreastfeedEndForm
            startTime={startActivity ? new Date(startActivity.recordTime) : undefined}
            onSubmit={submitActivity}
            onCancel={closeForm}
          />
        )}
        {currentForm === 'bottle_end' && (
          <BottleEndForm
            startTime={startActivity ? new Date(startActivity.recordTime) : undefined}
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
        {currentForm === 'sleep_end' && (
          <SleepEndForm
            startTime={startActivity ? new Date(startActivity.recordTime) : undefined}
            onSubmit={submitActivity}
            onCancel={closeForm}
          />
        )}
      </BottomSheet>

      {/* Toast 提示 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  )
}
