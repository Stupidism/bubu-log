'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Toast } from '@/components/Toast'
import { AvatarUpload } from '@/components/AvatarUpload'
import { PullToRefresh } from '@/components/PullToRefresh'
import { ActivityFAB } from '@/components/ActivityFAB'
import { DayTimeline, type DayTimelineRef } from '@/components/DayTimeline'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { useVersionCheck } from '@/hooks/useVersionCheck'
import { useModalParams } from '@/hooks/useModalParams'
import Link from 'next/link'
import { calculateDurationMinutes, formatDateChinese, formatWeekday } from '@/lib/dayjs'
import { BarChart3, ChevronLeft, ChevronRight, Moon, Milk, Baby, Loader2 } from 'lucide-react'
import { useActivities, type Activity } from '@/lib/api/hooks'
import { PreviousEveningSummary } from '@/components/PreviousEveningSummary'
import { dayjs } from '@/lib/dayjs'

// 每日统计
interface DaySummary {
  sleepCount: number
  totalSleepMinutes: number
  feedingCount: number
  totalMilkAmount: number
  totalBreastfeedMinutes: number
  diaperCount: number
}

export default function Home() {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const timelineRef = useRef<DayTimelineRef>(null)
  
  // URL 参数管理（包括日期）
  const { openActivityDetail, selectedDate, selectedDateStr, setSelectedDate } = useModalParams()

  // 获取活动数据
  const { data: activities = [], isLoading: activitiesLoading } = useActivities({
    date: selectedDateStr,
    limit: 100,
  })
  
  // 获取前一天的活动数据（用于显示前一天晚上的喂奶和睡眠）
  const previousDateStr = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD')
  const { data: previousDayActivities = [] } = useActivities({
    date: previousDateStr,
    limit: 100,
  })
  
  // 版本检测 - 每分钟检查一次新版本
  const { hasNewVersion, refresh: refreshPage, dismiss: dismissUpdate } = useVersionCheck(60000)

  // 计算每日统计
  const summary = useMemo<DaySummary>(() => {
    const result: DaySummary = {
      sleepCount: 0,
      totalSleepMinutes: 0,
      feedingCount: 0,
      totalMilkAmount: 0,
      totalBreastfeedMinutes: 0,
      diaperCount: 0,
    }

    for (const activity of activities) {
      switch (activity.type) {
        case 'SLEEP':
          // 有 endTime 才计为完整睡眠
          if (activity.endTime) {
            result.sleepCount++
            result.totalSleepMinutes += calculateDurationMinutes(activity.startTime, activity.endTime)
          }
          break
        case 'BREASTFEED':
          result.feedingCount++
          // 计算亲喂时长
          if (activity.endTime) {
            result.totalBreastfeedMinutes += calculateDurationMinutes(activity.startTime, activity.endTime)
          }
          break
        case 'BOTTLE':
          result.feedingCount++
          if (activity.milkAmount) {
            result.totalMilkAmount += activity.milkAmount
          }
          break
        case 'DIAPER':
          result.diaperCount++
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
  const navigateDate = useCallback((days: number) => {
    const newDate = dayjs(selectedDate).add(days, 'day').toDate()
    setSelectedDate(newDate)
  }, [selectedDate, setSelectedDate])

  // 是否是今天
  const isToday = selectedDateStr === dayjs().format('YYYY-MM-DD')

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

  // 点击活动查看详情 - 通过 URL 打开弹窗
  const handleActivityClick = useCallback((activity: Activity) => {
    openActivityDetail(activity.id)
  }, [openActivityDetail])

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
      <main className="pb-24">
        {/* 头部 */}
        <header className="px-4 py-3 flex items-center gap-3">
          {/* 头像 */}
          <AvatarUpload />
          
          {/* 日期切换器 */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center min-w-[80px]">
              <p className="text-base font-bold text-gray-800 dark:text-gray-100">
                {isToday ? '今天' : formatDateChinese(selectedDate)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatWeekday(selectedDate)}
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
            href={isToday ? '/stats' : `/stats?date=${selectedDateStr}`}
            className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors flex items-center gap-1"
          >
            <BarChart3 size={14} />
            数据
          </Link>
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
              <p className="text-xs text-gray-500">瓶喂</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm">
              <Milk size={18} className="mx-auto text-pink-500 mb-1" />
              <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                {summary.totalBreastfeedMinutes > 0 ? formatDuration(summary.totalBreastfeedMinutes) : '-'}
              </p>
              <p className="text-xs text-gray-500">亲喂</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center shadow-sm">
              <Baby size={18} className="mx-auto text-teal-500 mb-1" />
              <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                {summary.diaperCount}
              </p>
              <p className="text-xs text-gray-500">换尿布</p>
            </div>
          </div>
        </div>

        {/* 时间线 */}
        <div className="px-4">
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : activities.length === 0 && previousDayActivities.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg mb-2">还没有记录</p>
              <p className="text-sm">点击右下角的 + 按钮添加活动</p>
            </div>
          ) : (
            <>
              {/* 前一天晚上的摘要 */}
              <PreviousEveningSummary
                activities={previousDayActivities}
                date={selectedDate}
                onActivityClick={handleActivityClick}
              />
              
              {/* 当天时间线 */}
              <DayTimeline
                ref={timelineRef}
                activities={activities}
                date={selectedDate}
                onActivityClick={handleActivityClick}
                showCurrentTime={isToday}
              />
            </>
          )}
        </div>

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
      onVoiceSuccess={(message) => setToast({ message, type: 'success' })}
      onVoiceError={(message) => setToast({ message, type: 'error' })}
    />
    </>
  )
}
