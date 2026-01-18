'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, subDays, startOfDay, endOfDay, differenceInMinutes, differenceInHours } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Activity,
  ActivityType,
  ActivityTypeLabels,
  PoopColorLabels,
  PeeAmountLabels,
  PoopColorStyles,
} from '@/types/activity'
import { ActivityIcon } from '@/components/ActivityIcon'
import { 
  Moon, 
  Milk, 
  Baby, 
  Target, 
  BarChart3, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  Droplet,
  Check,
} from 'lucide-react'

interface DaySummary {
  sleepCount: number
  totalSleepMinutes: number
  diaperCount: number
  poopCount: number
  peeCount: number
  breastfeedCount: number
  totalBreastfeedMinutes: number
  bottleCount: number
  totalMilkAmount: number
  exerciseCount: number
}

export default function StatsPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<DaySummary | null>(null)

  // 获取活动数据
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true)
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const res = await fetch(`/api/activities?date=${dateStr}&limit=100`)
        const data = await res.json()
        // 检查返回的数据是否是数组
        if (Array.isArray(data)) {
          setActivities(data)
          calculateSummary(data)
        } else {
          // API 返回错误或非数组，设为空数组
          console.error('API returned non-array:', data)
          setActivities([])
          calculateSummary([])
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error)
        setActivities([])
        calculateSummary([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [selectedDate])

  // 计算每日统计
  const calculateSummary = (data: Activity[]) => {
    const summary: DaySummary = {
      sleepCount: 0,
      totalSleepMinutes: 0,
      diaperCount: 0,
      poopCount: 0,
      peeCount: 0,
      breastfeedCount: 0,
      totalBreastfeedMinutes: 0,
      bottleCount: 0,
      totalMilkAmount: 0,
      exerciseCount: 0,
    }

    // 找到所有睡眠周期
    const sleepStarts = data.filter((a) => a.type === ActivityType.SLEEP_START)
    const sleepEnds = data.filter((a) => a.type === ActivityType.SLEEP_END)
    summary.sleepCount = Math.min(sleepStarts.length, sleepEnds.length)
    
    // 计算总睡眠时间（简化计算）
    sleepEnds.forEach((end) => {
      const matchingStart = sleepStarts.find(
        (start) => new Date(start.recordTime) < new Date(end.recordTime)
      )
      if (matchingStart) {
        summary.totalSleepMinutes += differenceInMinutes(
          new Date(end.recordTime),
          new Date(matchingStart.recordTime)
        )
      }
    })

    // 尿布统计
    const diapers = data.filter((a) => a.type === ActivityType.DIAPER)
    summary.diaperCount = diapers.length
    summary.poopCount = diapers.filter((a) => a.hasPoop).length
    summary.peeCount = diapers.filter((a) => a.hasPee).length

    // 亲喂统计
    const breastfeedEnds = data.filter((a) => a.type === ActivityType.BREASTFEED_END)
    summary.breastfeedCount = breastfeedEnds.length
    summary.totalBreastfeedMinutes = breastfeedEnds.reduce(
      (acc, a) => acc + (a.duration || 0),
      0
    )

    // 瓶喂统计
    const bottleEnds = data.filter((a) => a.type === ActivityType.BOTTLE_END)
    summary.bottleCount = bottleEnds.length
    summary.totalMilkAmount = bottleEnds.reduce((acc, a) => acc + (a.milkAmount || 0), 0)

    // 活动统计
    const exercises = data.filter((a) =>
      [
        ActivityType.PASSIVE_EXERCISE,
        ActivityType.GAS_EXERCISE,
        ActivityType.BATH,
        ActivityType.OUTDOOR,
        ActivityType.EARLY_EDUCATION,
      ].includes(a.type)
    )
    summary.exerciseCount = exercises.length

    setSummary(summary)
  }

  // 日期导航
  const navigateDate = (days: number) => {
    setSelectedDate((prev) => subDays(prev, -days))
  }

  // 格式化时间
  const formatTime = (date: Date | string) => {
    return format(new Date(date), 'HH:mm')
  }

  // 格式化分钟为小时和分钟
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`
    }
    return `${mins}分钟`
  }

  // 渲染活动详情
  const renderActivityDetails = (activity: Activity) => {
    switch (activity.type) {
      case ActivityType.DIAPER:
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            {activity.hasPoop && (
              <span className="flex items-center gap-1">
                <span className="text-amber-700">Poop</span>
                {activity.poopColor && (
                  <span
                    className={`w-3 h-3 rounded-full ${PoopColorStyles[activity.poopColor]}`}
                  />
                )}
              </span>
            )}
            {activity.hasPee && (
              <span className="flex items-center gap-1">
                <Droplet size={14} className="text-blue-400" />
                {activity.peeAmount && PeeAmountLabels[activity.peeAmount]}
              </span>
            )}
          </div>
        )
      case ActivityType.BREASTFEED_END:
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            {activity.duration && <span>{activity.duration}分钟</span>}
            {activity.burpSuccess && (
              <span className="flex items-center gap-1">
                <Check size={14} className="text-green-500" />
                拍嗝
              </span>
            )}
          </div>
        )
      case ActivityType.BOTTLE_END:
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            {activity.milkAmount && <span>{activity.milkAmount}ml</span>}
            {activity.duration && <span>({activity.duration}分钟)</span>}
            {activity.burpSuccess && (
              <span className="flex items-center gap-1">
                <Check size={14} className="text-green-500" />
                拍嗝
              </span>
            )}
          </div>
        )
      default:
        return activity.duration ? (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {activity.duration}分钟
          </span>
        ) : null
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fefbf6] to-[#fff5e6] dark:from-[#1a1a2e] dark:to-[#16213e] safe-area-top safe-area-bottom">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            返回
          </Link>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
            <BarChart3 size={20} />
            数据统计
          </h1>
          <div className="w-16" />
        </div>

        {/* 日期选择器 */}
        <div className="px-4 pb-3 flex items-center justify-center gap-4">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {format(selectedDate, 'M月d日', { locale: zhCN })}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(selectedDate, 'EEEE', { locale: zhCN })}
            </p>
          </div>
          <button
            onClick={() => navigateDate(1)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* 统计概览 */}
      {summary && (
        <section className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {/* 睡眠卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Moon size={24} className="text-indigo-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">睡眠</span>
              </div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatDuration(summary.totalSleepMinutes)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {summary.sleepCount} 次
              </p>
            </div>

            {/* 喂奶卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Milk size={24} className="text-pink-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">喂奶</span>
              </div>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {summary.totalMilkAmount > 0 ? `${summary.totalMilkAmount}ml` : '-'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                亲喂 {summary.breastfeedCount}次 · 瓶喂 {summary.bottleCount}次
              </p>
            </div>

            {/* 尿布卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Baby size={24} className="text-teal-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">尿布</span>
              </div>
              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {summary.diaperCount} 次
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="text-amber-600">{summary.poopCount}次</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Droplet size={12} className="text-blue-400" />
                  {summary.peeCount}次
                </span>
              </p>
            </div>

            {/* 活动卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target size={24} className="text-amber-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">活动</span>
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {summary.exerciseCount} 次
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">各类活动</p>
            </div>
          </div>
        </section>
      )}

      {/* 时间线 */}
      <section className="px-4 pb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-1.5">
          <ClipboardList size={20} />
          今日记录
        </h2>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无记录</div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center gap-4"
              >
                <ActivityIcon type={activity.type} size={32} className="text-gray-600 dark:text-gray-300" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {ActivityTypeLabels[activity.type]}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(activity.recordTime)}
                    </span>
                  </div>
                  {renderActivityDetails(activity)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

