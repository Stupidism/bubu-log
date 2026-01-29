'use client'

import { useCallback, useMemo, useEffect, useRef, Suspense, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AvatarUpload } from '@/components/AvatarUpload'
import { PullToRefresh } from '@/components/PullToRefresh'
import { ActivityFAB } from '@/components/ActivityFAB'
import { DayTimeline, type DayTimelineRef } from '@/components/DayTimeline'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { useVersionCheck } from '@/hooks/useVersionCheck'
import { useModalParams, activityTypeToModalType } from '@/hooks/useModalParams'
import Link from 'next/link'
import { calculateDurationMinutes, calculateDurationInDay, formatDateChinese, formatWeekday, formatTime, dayjs } from '@/lib/dayjs'
import { BarChart3, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useActivities, type Activity } from '@/lib/api/hooks'
import { PreviousEveningSummary } from '@/components/PreviousEveningSummary'
import { StatsCardList, type StatFilter } from '@/components/StatsCardList'
import { ActivityPicker } from '@/components/ActivityPicker'
import { ActivityType } from '@/types/activity'
import { useRouter } from 'next/navigation'

// 每日统计
interface DaySummary {
  sleepCount: number
  totalSleepMinutes: number
  feedingCount: number
  totalMilkAmount: number
  totalBreastfeedMinutes: number
  diaperCount: number
  totalHeadLiftMinutes: number
}

function HomeContent() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const timelineRef = useRef<DayTimelineRef>(null)
  
  // 活动选择器状态
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerDefaultTime, setPickerDefaultTime] = useState<Date | null>(null)
  
  // URL 参数管理（包括日期）
  const { openActivityDetail, openModal, selectedDate, selectedDateStr, setSelectedDate } = useModalParams()

  // 获取当天活动数据（包括跨夜活动）
  const { data: todayActivities = [], isLoading: activitiesLoading } = useActivities({
    date: selectedDateStr,
    limit: 200,
  })
  
  // 计算前一天晚上的时间范围（用于"昨晚摘要"）
  const previousEveningRange = useMemo(() => {
    const currentDayStart = dayjs(selectedDate).startOf('day')
    const previousDay = currentDayStart.subtract(1, 'day')
    const eveningStart = previousDay.hour(18).minute(0).second(0)
    return {
      startTimeGte: eveningStart.toISOString(),
      startTimeLt: currentDayStart.toISOString(),
    }
  }, [selectedDate])
  
  // 单独请求前一天晚上的活动（用于"昨晚摘要"）
  const { data: previousDayActivities = [] } = useActivities({
    ...previousEveningRange,
    limit: 50,
  })
  
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
      totalHeadLiftMinutes: 0,
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
        case 'HEAD_LIFT':
          // 抬头：只统计当天发生的（startTime在当天）
          if (isActivityInToday && activity.endTime) {
            result.totalHeadLiftMinutes += calculateDurationMinutes(activity.startTime, activity.endTime)
          }
          break
      }
    }

    return result
  }, [todayActivities, selectedDate])

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

  // 点击统计卡片 - 跳转到 stats 页面并带上过滤条件
  const handleStatCardClick = useCallback((filter: StatFilter) => {
    const params = new URLSearchParams()
    if (!isToday) {
      params.set('date', selectedDateStr)
    }
    if (filter !== 'all') {
      params.set('filter', filter)
    }
    const queryString = params.toString()
    router.push(`/stats${queryString ? `?${queryString}` : ''}`)
  }, [isToday, selectedDateStr, router])

  // 长按时间轴空白处 - 打开活动选择器
  const handleTimelineLongPress = useCallback((time: Date) => {
    setPickerDefaultTime(time)
    setPickerOpen(true)
  }, [])

  // 各活动类型的默认时长（分钟）
  const DEFAULT_DURATIONS: Partial<Record<ActivityType | 'wake', number>> = {
    [ActivityType.HEAD_LIFT]: 5,
    [ActivityType.PASSIVE_EXERCISE]: 10,
    [ActivityType.GAS_EXERCISE]: 10,
    [ActivityType.BATH]: 15,
    [ActivityType.OUTDOOR]: 30,
    [ActivityType.EARLY_EDUCATION]: 20,
    [ActivityType.BOTTLE]: 15,
    [ActivityType.BREASTFEED]: 15,
    'wake': 60, // 睡醒默认 1 小时
  }

  // 活动选择器选择活动
  const handlePickerSelect = useCallback((type: ActivityType | 'wake') => {
    const modalType = activityTypeToModalType[type]
    if (pickerDefaultTime) {
      const defaultDuration = DEFAULT_DURATIONS[type]
      const params: Record<string, string> = {
        startTime: pickerDefaultTime.toISOString(),
      }
      // 对于有时长的活动，设置结束时间
      // 排除尿布（点事件）和入睡（只有开始时间）
      if (defaultDuration && type !== ActivityType.DIAPER && type !== ActivityType.SLEEP) {
        const endTime = dayjs(pickerDefaultTime).add(defaultDuration, 'minute').toDate()
        params.endTime = endTime.toISOString()
      }
      openModal(modalType, { params })
    } else {
      openModal(modalType)
    }
    setPickerOpen(false)
  }, [openModal, pickerDefaultTime])

  // 活动选择器选择尿布
  const handlePickerDiaperSelect = useCallback((diaperType: 'poop' | 'pee' | 'both') => {
    const params: Record<string, string> = {
      hasPoop: (diaperType === 'poop' || diaperType === 'both').toString(),
      hasPee: (diaperType === 'pee' || diaperType === 'both').toString(),
    }
    if (pickerDefaultTime) {
      params.startTime = pickerDefaultTime.toISOString()
    }
    openModal('diaper', { params })
    setPickerOpen(false)
  }, [openModal, pickerDefaultTime])

  // 活动选择器选择补剂
  const handlePickerSupplementSelect = useCallback((supplementType: 'AD' | 'D3') => {
    const params: Record<string, string> = {
      supplementType,
    }
    if (pickerDefaultTime) {
      params.startTime = pickerDefaultTime.toISOString()
    }
    openModal('supplement', { params })
    setPickerOpen(false)
  }, [openModal, pickerDefaultTime])

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
              data-testid="date-prev-btn"
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
              data-testid="date-next-btn"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          {/* 右侧：数据入口 */}
          <Link 
            href={isToday ? '/stats' : `/stats?date=${selectedDateStr}`}
            className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors flex items-center gap-1"
            data-testid="stats-link"
          >
            <BarChart3 size={14} />
            数据
          </Link>
        </header>

        {/* 今日统计卡片 - 点击跳转到 stats 页面 */}
        <div className="px-4 py-3">
          <StatsCardList 
            summary={summary} 
            onStatCardClick={handleStatCardClick}
          />
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
                onLongPressBlank={handleTimelineLongPress}
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
      targetDate={selectedDate}
    />

    {/* 活动选择器 - 长按时间轴触发 */}
    <ActivityPicker
      isOpen={pickerOpen}
      onClose={() => setPickerOpen(false)}
      onSelect={handlePickerSelect}
      onDiaperSelect={handlePickerDiaperSelect}
      onSupplementSelect={handlePickerSupplementSelect}
      selectedTime={pickerDefaultTime ? formatTime(pickerDefaultTime) : undefined}
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
