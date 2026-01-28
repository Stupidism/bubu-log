'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { dayjs } from '@/lib/dayjs'
import { useDailyStats, useComputeDailyStat, type DailyStat } from '@/lib/api/hooks'
import { toast } from 'sonner'
import {
  Calendar,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Moon,
  Milk,
} from 'lucide-react'

// 格式化分钟为小时
function formatMinutesToHours(minutes: number): string {
  if (minutes === 0) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h${mins}m`
}

// 获取颜色强度 (0-4)
function getIntensity(value: number, max: number): number {
  if (value === 0) return 0
  const ratio = value / max
  if (ratio < 0.25) return 1
  if (ratio < 0.5) return 2
  if (ratio < 0.75) return 3
  return 4
}

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function WeeklyPageContent() {
  // 当前显示的周（周一开始）
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    return dayjs().startOf('week').add(1, 'day').toDate() // 周一
  })
  
  // 显示的周数
  const [weeksToShow] = useState(4)
  
  // 计算日期范围
  const dateRange = useMemo(() => {
    const startDate = dayjs(currentWeekStart).subtract(weeksToShow - 1, 'week')
    const endDate = dayjs(currentWeekStart).add(6, 'day')
    return {
      start: startDate.format('YYYY-MM-DD'),
      end: endDate.format('YYYY-MM-DD'),
    }
  }, [currentWeekStart, weeksToShow])
  
  // 获取统计数据
  const { data: stats = [], isLoading, refetch } = useDailyStats({
    startDate: dateRange.start,
    endDate: dateRange.end,
    limit: 7 * weeksToShow,
  })
  
  const computeMutation = useComputeDailyStat()
  
  // 构建周数据
  const weeksData = useMemo(() => {
    const statsByDate = new Map(
      stats.map(s => [dayjs(s.date).format('YYYY-MM-DD'), s])
    )
    
    const weeks: Array<{
      weekLabel: string
      weekStart: string
      days: Array<{
        date: string
        dayOfWeek: number // 0=周一, 6=周日
        stat: DailyStat | null
      }>
    }> = []
    
    for (let w = weeksToShow - 1; w >= 0; w--) {
      const weekStart = dayjs(currentWeekStart).subtract(w, 'week')
      const weekLabel = weekStart.format('M/D') + ' - ' + weekStart.add(6, 'day').format('M/D')
      
      const days = []
      for (let d = 0; d < 7; d++) {
        const date = weekStart.add(d, 'day').format('YYYY-MM-DD')
        days.push({
          date,
          dayOfWeek: d,
          stat: statsByDate.get(date) || null,
        })
      }
      
      weeks.push({
        weekLabel,
        weekStart: weekStart.format('YYYY-MM-DD'),
        days,
      })
    }
    
    return weeks
  }, [currentWeekStart, weeksToShow, stats])
  
  // 计算最大值（用于颜色强度）
  const maxValues = useMemo(() => {
    let maxSleep = 0
    let maxMilk = 0
    
    for (const stat of stats) {
      maxSleep = Math.max(maxSleep, stat.totalSleepMinutes ?? 0)
      maxMilk = Math.max(maxMilk, stat.totalMilkAmount ?? 0)
    }
    
    // 设置合理的默认最大值
    return {
      sleep: maxSleep || 12 * 60, // 默认12小时
      milk: maxMilk || 600, // 默认600ml
    }
  }, [stats])
  
  // 导航周
  const navigateWeek = (direction: number) => {
    setCurrentWeekStart(prev => dayjs(prev).add(direction, 'week').toDate())
  }
  
  // 批量计算
  const handleComputeAll = useCallback(async () => {
    const allDates: string[] = []
    weeksData.forEach(week => {
      week.days.forEach(day => {
        allDates.push(day.date)
      })
    })
    
    const missingDates = allDates.filter(
      date => !stats.some(s => dayjs(s.date).format('YYYY-MM-DD') === date)
    )
    
    const datesToCompute = missingDates.length > 0 ? missingDates : allDates
    
    for (const date of datesToCompute) {
      await computeMutation.mutateAsync({ body: { date } })
    }
    
    toast.success('统计完成')
    refetch()
  }, [weeksData, stats, computeMutation, refetch])
  
  // 是否可以前进
  const canGoForward = dayjs(currentWeekStart).isBefore(dayjs().startOf('week').add(1, 'day'), 'day')
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fefbf6] to-[#fff5e6] dark:from-[#1a1a2e] dark:to-[#16213e] safe-area-top safe-area-bottom">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link
            href="/stats/trends"
            className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-base flex items-center gap-1"
          >
            <ArrowLeft size={18} />
            返回
          </Link>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
            <Calendar size={22} />
            周历视图
          </h1>
          <button
            onClick={handleComputeAll}
            disabled={computeMutation.isPending}
            className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-base flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={18} className={computeMutation.isPending ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* 周导航 */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <ChevronLeft size={24} />
          </button>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
            最近 {weeksToShow} 周
          </p>
          <button
            onClick={() => navigateWeek(1)}
            disabled={!canGoForward}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : (
        <div className="p-4 space-y-6">
          {/* 睡眠热力图 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Moon size={20} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">睡眠</h2>
            </div>
            
            {/* 表头 - 周几 */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-xs text-gray-400 text-right pr-1"></div>
              {weekdays.map((day, i) => (
                <div key={i} className="text-xs text-gray-500 text-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            {/* 周数据 */}
            {weeksData.map((week, weekIndex) => (
              <div key={week.weekStart} className="grid grid-cols-8 gap-1 mb-1">
                <div className="text-xs text-gray-400 text-right pr-1 self-center">
                  {dayjs(week.weekStart).format('M/D')}
                </div>
                {week.days.map((day) => {
                  const intensity = day.stat 
                    ? getIntensity(day.stat.totalSleepMinutes ?? 0, maxValues.sleep)
                    : 0
                  const isToday = day.date === dayjs().format('YYYY-MM-DD')
                  const isFuture = dayjs(day.date).isAfter(dayjs(), 'day')
                  
                  return (
                    <div
                      key={day.date}
                      className={`
                        aspect-square rounded-md flex items-center justify-center text-xs font-medium
                        ${isFuture ? 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-700' : ''}
                        ${!isFuture && intensity === 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : ''}
                        ${!isFuture && intensity === 1 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : ''}
                        ${!isFuture && intensity === 2 ? 'bg-indigo-200 dark:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300' : ''}
                        ${!isFuture && intensity === 3 ? 'bg-indigo-300 dark:bg-indigo-700/50 text-indigo-800 dark:text-indigo-200' : ''}
                        ${!isFuture && intensity === 4 ? 'bg-indigo-400 dark:bg-indigo-600/60 text-white' : ''}
                        ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                      `}
                      title={`${day.date}: ${day.stat ? formatMinutesToHours(day.stat.totalSleepMinutes ?? 0) : '无数据'}`}
                    >
                      {!isFuture && day.stat ? formatMinutesToHours(day.stat.totalSleepMinutes ?? 0) : ''}
                    </div>
                  )
                })}
              </div>
            ))}
            
            {/* 图例 */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-xs text-gray-400">少</span>
              <div className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-900/30"></div>
              <div className="w-4 h-4 rounded bg-indigo-200 dark:bg-indigo-800/40"></div>
              <div className="w-4 h-4 rounded bg-indigo-300 dark:bg-indigo-700/50"></div>
              <div className="w-4 h-4 rounded bg-indigo-400 dark:bg-indigo-600/60"></div>
              <span className="text-xs text-gray-400">多</span>
            </div>
          </section>

          {/* 奶量热力图 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Milk size={20} className="text-pink-500" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">奶量</h2>
            </div>
            
            {/* 表头 - 周几 */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-xs text-gray-400 text-right pr-1"></div>
              {weekdays.map((day, i) => (
                <div key={i} className="text-xs text-gray-500 text-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            {/* 周数据 */}
            {weeksData.map((week) => (
              <div key={week.weekStart} className="grid grid-cols-8 gap-1 mb-1">
                <div className="text-xs text-gray-400 text-right pr-1 self-center">
                  {dayjs(week.weekStart).format('M/D')}
                </div>
                {week.days.map((day) => {
                  const intensity = day.stat 
                    ? getIntensity(day.stat.totalMilkAmount ?? 0, maxValues.milk)
                    : 0
                  const isToday = day.date === dayjs().format('YYYY-MM-DD')
                  const isFuture = dayjs(day.date).isAfter(dayjs(), 'day')
                  
                  return (
                    <div
                      key={day.date}
                      className={`
                        aspect-square rounded-md flex items-center justify-center text-xs font-medium
                        ${isFuture ? 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-700' : ''}
                        ${!isFuture && intensity === 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : ''}
                        ${!isFuture && intensity === 1 ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' : ''}
                        ${!isFuture && intensity === 2 ? 'bg-pink-200 dark:bg-pink-800/40 text-pink-700 dark:text-pink-300' : ''}
                        ${!isFuture && intensity === 3 ? 'bg-pink-300 dark:bg-pink-700/50 text-pink-800 dark:text-pink-200' : ''}
                        ${!isFuture && intensity === 4 ? 'bg-pink-400 dark:bg-pink-600/60 text-white' : ''}
                        ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                      `}
                      title={`${day.date}: ${day.stat ? `${day.stat.totalMilkAmount ?? 0}ml` : '无数据'}`}
                    >
                      {!isFuture && day.stat && (day.stat.totalMilkAmount ?? 0) > 0 
                        ? `${day.stat.totalMilkAmount}` 
                        : ''}
                    </div>
                  )
                })}
              </div>
            ))}
            
            {/* 图例 */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-xs text-gray-400">少</span>
              <div className="w-4 h-4 rounded bg-pink-100 dark:bg-pink-900/30"></div>
              <div className="w-4 h-4 rounded bg-pink-200 dark:bg-pink-800/40"></div>
              <div className="w-4 h-4 rounded bg-pink-300 dark:bg-pink-700/50"></div>
              <div className="w-4 h-4 rounded bg-pink-400 dark:bg-pink-600/60"></div>
              <span className="text-xs text-gray-400">多</span>
            </div>
          </section>

          {/* 缺失数据提示 */}
          {weeksData.some(week => week.days.some(d => !d.stat && !dayjs(d.date).isAfter(dayjs(), 'day'))) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                部分日期缺少统计数据，点击右上角刷新按钮批量计算
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default function WeeklyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Calendar size={32} className="mx-auto text-gray-400 mb-2 animate-pulse" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    }>
      <WeeklyPageContent />
    </Suspense>
  )
}
