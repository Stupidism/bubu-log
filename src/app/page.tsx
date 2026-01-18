'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { ActivityType, ActivityTypeLabels, Activity } from '@/types/activity'
import Link from 'next/link'
import { Moon, Milk, Baby as DiaperIcon, Target, BarChart3 } from 'lucide-react'

type FormType = 
  | 'diaper'
  | 'breastfeed_end'
  | 'bottle_end'
  | 'activity_duration'
  | 'simple'
  | 'sleep_end'
  | null

interface PairedState {
  sleep: 'start' | 'end'
  breastfeed: 'start' | 'end'
  bottle: 'start' | 'end'
}

export default function Home() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [currentForm, setCurrentForm] = useState<FormType>(null)
  const [currentActivityType, setCurrentActivityType] = useState<ActivityType | null>(null)
  const [startActivity, setStartActivity] = useState<Activity | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 配对活动的状态（入睡/睡醒，开始喂/结束喂）
  const [pairedState, setPairedState] = useState<PairedState>({
    sleep: 'start',
    breastfeed: 'start',
    bottle: 'start',
  })

  // 获取配对活动的最新状态
  const fetchPairedStates = useCallback(async () => {
    try {
      // 获取睡眠状态
      const sleepRes = await fetch('/api/activities/latest?types=SLEEP_START,SLEEP_END')
      const sleepData = await sleepRes.json()
      if (sleepData) {
        setPairedState((prev) => ({
          ...prev,
          sleep: sleepData.type === 'SLEEP_START' ? 'end' : 'start',
        }))
        if (sleepData.type === 'SLEEP_START') {
          // 保存开始活动用于结束时计算时长
        }
      }

      // 获取亲喂状态
      const bfRes = await fetch('/api/activities/latest?types=BREASTFEED_START,BREASTFEED_END')
      const bfData = await bfRes.json()
      if (bfData) {
        setPairedState((prev) => ({
          ...prev,
          breastfeed: bfData.type === 'BREASTFEED_START' ? 'end' : 'start',
        }))
      }

      // 获取瓶喂状态
      const bottleRes = await fetch('/api/activities/latest?types=BOTTLE_START,BOTTLE_END')
      const bottleData = await bottleRes.json()
      if (bottleData) {
        setPairedState((prev) => ({
          ...prev,
          bottle: bottleData.type === 'BOTTLE_START' ? 'end' : 'start',
        }))
      }
    } catch (error) {
      console.error('Failed to fetch paired states:', error)
    }
  }, [])

  useEffect(() => {
    fetchPairedStates()
  }, [fetchPairedStates])

  // 打开表单
  const openForm = async (type: ActivityType) => {
    setCurrentActivityType(type)

    switch (type) {
      case ActivityType.DIAPER:
        setCurrentForm('diaper')
        break
      case ActivityType.SLEEP_END:
        // 获取入睡时间（如果有的话）
        if (pairedState.sleep === 'end') {
          // 有入睡记录，获取开始时间
          const sleepRes = await fetch('/api/activities/latest?types=SLEEP_START')
          const sleepData = await sleepRes.json()
          setStartActivity(sleepData)
        } else {
          // 没有入睡记录，清空开始活动
          setStartActivity(null)
        }
        setCurrentForm('sleep_end')
        break
      case ActivityType.BREASTFEED_END:
        // 获取开始亲喂的时间
        const bfRes = await fetch('/api/activities/latest?types=BREASTFEED_START')
        const bfData = await bfRes.json()
        setStartActivity(bfData)
        setCurrentForm('breastfeed_end')
        break
      case ActivityType.BOTTLE_END:
        // 获取开始瓶喂的时间
        const bottleRes = await fetch('/api/activities/latest?types=BOTTLE_START')
        const bottleData = await bottleRes.json()
        setStartActivity(bottleData)
        setCurrentForm('bottle_end')
        break
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
  }

  // 提交活动记录
  const submitActivity = async (data: Record<string, unknown>) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: currentActivityType,
          ...data,
          startActivityId: startActivity?.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to create activity')

      setToast({ message: '记录成功！', type: 'success' })
      setIsSheetOpen(false)
      setCurrentForm(null)
      setStartActivity(null)
      fetchPairedStates() // 刷新配对状态
    } catch (error) {
      console.error('Failed to submit activity:', error)
      setToast({ message: '记录失败，请重试', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 关闭表单
  const closeForm = () => {
    setIsSheetOpen(false)
    setCurrentForm(null)
    setCurrentActivityType(null)
    setStartActivity(null)
  }

  // 获取当前应该显示的睡眠按钮类型
  const sleepType = pairedState.sleep === 'start' ? ActivityType.SLEEP_START : ActivityType.SLEEP_END
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
            />
            {/* 睡醒按钮始终可点击 */}
            <ActivityButton
              type={ActivityType.SLEEP_END}
              onClick={() => openForm(ActivityType.SLEEP_END)}
              variant="sleep"
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
            />
            <ActivityButton
              type={bottleType}
              onClick={() => openForm(bottleType)}
              variant="feed"
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
