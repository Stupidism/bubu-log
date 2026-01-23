'use client'

import { useCallback, useMemo, useEffect, useRef, Suspense } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AvatarUpload } from '@/components/AvatarUpload'
import { PullToRefresh } from '@/components/PullToRefresh'
import { ActivityFAB } from '@/components/ActivityFAB'
import { DayTimeline, type DayTimelineRef } from '@/components/DayTimeline'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { useVersionCheck } from '@/hooks/useVersionCheck'
import { useModalParams } from '@/hooks/useModalParams'
import Link from 'next/link'
import { calculateDurationMinutes, calculateDurationInDay, formatDateChinese, formatWeekday } from '@/lib/dayjs'
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

function HomeContent() {
  const queryClient = useQueryClient()
  const timelineRef = useRef<DayTimelineRef>(null)
  
  // URL 参数管理（包括日期）
  const { openActivityDetail, selectedDate, selectedDateStr, setSelectedDate } = useModalParams()

  // 获取活动数据（包含当天和前一天晚上的活动）
  const { data: activities = [], isLoading: activitiesLoading } = useActivities({
    date: selectedDateStr,
    limit: 200, // 增加限制以包含前一天晚上的活动
  })
  
  // 从查询结果中筛选出前一天晚上的活动（用于"昨晚摘要"）
  const previousDayActivities = useMemo(() => {
    const currentDayStart = dayjs(selectedDate).startOf('day')
    const previousDay = currentDayStart.subtract(1, 'day')
    const eveningStart = previousDay.hour(18).minute(0).second(0)
    
    return activities.filter(activity => {
      const activityTime = dayjs(activity.startTime)
      // 筛选前一天晚上18:00之后开始的活动
      return activityTime.isAfter(eveningStart) && activityTime.isBefore(currentDayStart)
    })
  }, [activities, selectedDate])
  
  // 筛选出当天的活动（用于时间轴显示）
  // 包括：1. 当天开始的活动 2. 跨夜到当天的活动
  const todayActivities = useMemo(() => {
    const currentDayStart = dayjs(selectedDate).startOf('day')
    
    return activities.filter(activity => {
      const activityTime = dayjs(activity.startTime)
      // 活动开始时间在当天，或者是跨夜活动（开始时间在前一天但结束时间在当天或之后）
      if (!activityTime.isBefore(currentDayStart)) {
        return true // 当天开始的活动
      }
      // 跨夜活动：开始时间在前一天，但结束时间在当天或之后
      if (activity.endTime) {
        const endTime = dayjs(activity.endTime)
        return !endTime.isBefore(currentDayStart)
      }
      // 进行中的跨夜活动（endTime 为 null）
      return false // 这些已经在 previousDayActivities 中了
    })
  }, [activities, selectedDate])
  
  // 版本检测 - 每分钟检查一次新版本
  const { hasNewVersion, refresh: refreshPage, dismiss: dismissUpdate } = useVersionCheck(60000)

  // 计算每日统计
  // 注意：只有睡眠可以跨天计算，其他活动（奶量、尿布）需要严格按当天时间过滤
  const summary = useMemo<DaySummary>(() => {
    const result: DaySummary = {
      sleepCount: 0,
      totalSleepMinutes: 0,
      feedingCount: 0,
      totalMilkAmount: 0,
      totalBreastfeedMinutes: 0,
      diaperCount: 0,
    }

    const currentDayStart = dayjs(selectedDate).startOf('day')
    const currentDayEnd = dayjs(selectedDate).endOf('day')

    // 使用 todayActivities 进行统计
    for (const activity of todayActivities) {
      const activityStartTime = dayjs(activity.startTime)
      const isActivityInToday = !activityStartTime.isBefore(currentDayStart) && !activityStartTime.isAfter(currentDayEnd)

      switch (activity.type) {
        case 'SLEEP':
          // 睡眠可以跨天计算，但只计算当天范围内的部分（0点到24点）
          if (activity.endTime) {
            const sleepMinutesInDay = calculateDurationInDay(activity.startTime, activity.endTime, selectedDate)
            if (sleepMinutesInDay > 0) {
              result.sleepCount++
              result.totalSleepMinutes += sleepMinutesInDay
            }
          }
          break
        case 'BREASTFEED':
          // 亲喂：只统计当天发生的（startTime在当天）
          if (isActivityInToday) {
            result.feedingCount++
            // 计算亲喂时长（只计算当天的部分）
            if (activity.endTime) {
              const endTime = dayjs(activity.endTime)
              // 如果结束时间也在当天，计算完整时长
              // 如果结束时间跨到第二天，只计算到当天结束的部分
              const actualEndTime = endTime.isAfter(currentDayEnd) ? currentDayEnd.toDate() : activity.endTime
              result.totalBreastfeedMinutes += calculateDurationMinutes(activity.startTime, actualEndTime)
            }
          }
          break
        case 'BOTTLE':
          // 瓶喂：只统计当天发生的（startTime在当天）
          if (isActivityInToday) {
            result.feedingCount++
            if (activity.milkAmount) {
              result.totalMilkAmount += activity.milkAmount
            }
          }
          break
        case 'DIAPER':
          // 尿布：只统计当天发生的（startTime在当天）
          if (isActivityInToday) {
            result.diaperCount++
          }
          break
      }
    }

    return result
  }, [todayActivities, selectedDate])

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
    toast.success('刷新成功')
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
          ) : todayActivities.length === 0 && previousDayActivities.length === 0 ? (
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
                activities={todayActivities}
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
      </main>
    </PullToRefresh>

    {/* 悬浮操作按钮 - 放在 PullToRefresh 外面，避免 transform 影响 fixed 定位 */}
    <ActivityFAB
      onVoiceSuccess={(message) => toast.success(message)}
      onVoiceError={(message) => toast.error(message)}
    />
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
