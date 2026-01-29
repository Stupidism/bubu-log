'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { dayjs, formatDateChinese } from '@/lib/dayjs'
import { useDailyStats, useComputeDailyStat, type DailyStat } from '@/lib/api/hooks'
import { toast } from 'sonner'
import {
  TrendingUp,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Moon,
  Milk,
  Baby,
  Calendar,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@bubu-log/ui'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

// 图表配置
const sleepChartConfig = {
  totalSleepMinutes: {
    label: '睡眠时长',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

const feedingChartConfig = {
  totalMilkAmount: {
    label: '奶量',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

const diaperChartConfig = {
  diaperCount: {
    label: '换尿布',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig

// 格式化分钟为小时
function formatMinutesToHours(minutes: number): string {
  if (minutes === 0) return '0h'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h${mins}m`
}

function TrendsPageContent() {
  // 日期范围：默认显示最近7天
  const [daysToShow, setDaysToShow] = useState(7)
  const [endDate, setEndDate] = useState(() => dayjs().startOf('day').toDate())
  
  const startDate = useMemo(() => {
    return dayjs(endDate).subtract(daysToShow - 1, 'day').toDate()
  }, [endDate, daysToShow])
  
  const startDateStr = dayjs(startDate).format('YYYY-MM-DD')
  const endDateStr = dayjs(endDate).format('YYYY-MM-DD')
  
  // 获取统计数据
  const { data: stats = [], isLoading, refetch } = useDailyStats({
    startDate: startDateStr,
    endDate: endDateStr,
    limit: daysToShow,
  })
  
  const computeMutation = useComputeDailyStat()
  
  // 生成日期范围内所有日期
  const dateRange = useMemo(() => {
    const dates: string[] = []
    let current = dayjs(startDate)
    const end = dayjs(endDate)
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      dates.push(current.format('YYYY-MM-DD'))
      current = current.add(1, 'day')
    }
    return dates
  }, [startDate, endDate])
  
  // 将统计数据转换为图表数据（填充缺失日期）
  const chartData = useMemo(() => {
    const statsByDate = new Map(
      stats.map(s => [dayjs(s.date).format('YYYY-MM-DD'), s])
    )
    
    return dateRange.map(date => {
      const stat = statsByDate.get(date)
      return {
        date,
        dateLabel: dayjs(date).format('M/D'),
        totalSleepMinutes: stat?.totalSleepMinutes ?? 0,
        sleepHours: stat ? ((stat.totalSleepMinutes ?? 0) / 60).toFixed(1) : '0',
        totalMilkAmount: stat?.totalMilkAmount ?? 0,
        diaperCount: stat?.diaperCount ?? 0,
        hasData: !!stat,
      }
    })
  }, [dateRange, stats])
  
  // 计算某天的统计并刷新
  const handleComputeDay = useCallback(async (date: string) => {
    try {
      await computeMutation.mutateAsync({ body: { date } })
      toast.success('统计完成')
      refetch()
    } catch {
      toast.error('统计失败')
    }
  }, [computeMutation, refetch])
  
  // 批量计算所有日期（始终重新计算）
  const handleComputeAll = useCallback(async () => {
    try {
      // 重新计算所有日期的统计
      for (const date of dateRange) {
        await computeMutation.mutateAsync({ body: { date } })
      }
      
      toast.success(`已重新计算 ${dateRange.length} 天的统计数据`)
      refetch()
    } catch {
      toast.error('统计失败，请重试')
    }
  }, [dateRange, computeMutation, refetch])
  
  // 导航日期范围
  const navigateDays = (direction: number) => {
    setEndDate(prev => dayjs(prev).add(direction * daysToShow, 'day').toDate())
  }
  
  // 是否可以前进（不能超过今天）
  const canGoForward = dayjs(endDate).isBefore(dayjs(), 'day')
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fefbf6] to-[#fff5e6] dark:from-[#1a1a2e] dark:to-[#16213e] safe-area-top safe-area-bottom">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link
            href="/stats"
            className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-base flex items-center gap-1"
          >
            <ArrowLeft size={18} />
            返回
          </Link>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
            <TrendingUp size={22} />
            数据趋势
          </h1>
          <button
            onClick={handleComputeAll}
            disabled={computeMutation.isPending}
            className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-base flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={18} className={computeMutation.isPending ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* 日期范围选择器 */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <button
            onClick={() => navigateDays(-1)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {formatDateChinese(startDate)} - {formatDateChinese(endDate)}
            </p>
            <div className="flex justify-center gap-2 mt-2">
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setDaysToShow(days)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    daysToShow === days
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {days}天
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigateDays(1)}
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
          {/* 睡眠趋势 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Moon size={20} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">睡眠趋势</h2>
            </div>
            <ChartContainer config={sleepChartConfig} className="h-[200px] w-full">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 12 }}
                  className="text-gray-500"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatMinutesToHours(value)}
                  className="text-gray-500"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatMinutesToHours(value as number)}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="totalSleepMinutes"
                  stroke="var(--color-totalSleepMinutes)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-totalSleepMinutes)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </section>

          {/* 奶量趋势 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Milk size={20} className="text-pink-500" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">奶量趋势</h2>
            </div>
            <ChartContainer config={feedingChartConfig} className="h-[200px] w-full">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 12 }}
                  className="text-gray-500"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}ml`}
                  className="text-gray-500"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${value}ml`}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="totalMilkAmount"
                  stroke="var(--color-totalMilkAmount)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-totalMilkAmount)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </section>

          {/* 换尿布趋势 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Baby size={20} className="text-teal-500" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">换尿布趋势</h2>
            </div>
            <ChartContainer config={diaperChartConfig} className="h-[200px] w-full">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 12 }}
                  className="text-gray-500"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}次`}
                  className="text-gray-500"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${value}次`}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="diaperCount"
                  stroke="var(--color-diaperCount)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-diaperCount)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </section>

          {/* 缺失数据提示 */}
          {chartData.some(d => !d.hasData) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                部分日期缺少统计数据，点击右上角刷新按钮批量计算
              </p>
            </div>
          )}

          {/* 跳转到周历视图 */}
          <Link
            href="/stats/weekly"
            className="block bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={24} className="text-primary" />
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">周历视图</h3>
                  <p className="text-sm text-gray-500">按周对比每天的睡眠和喂奶情况</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </Link>
        </div>
      )}
    </main>
  )
}

export default function TrendsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <TrendingUp size={32} className="mx-auto text-gray-400 mb-2 animate-pulse" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    }>
      <TrendsPageContent />
    </Suspense>
  )
}
