'use client'

import { useState, useMemo, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { dayjs, calculateDurationMinutes, calculateDurationInDay, formatDuration as formatDurationUtil, formatDateChinese, formatWeekday } from '@/lib/dayjs'
import {
  ActivityType,
  ActivityTypeLabels,
  PeeAmountLabels,
  PoopColorStyles,
} from '@/types/activity'
import { ActivityIcon } from '@/components/ActivityIcon'
import { BottomSheet } from '@/components/BottomSheet'
import { toast } from 'sonner'
import { useActivities, useBatchDeleteActivities, useBatchUpdateActivityDate, type Activity } from '@/lib/api/hooks'
import { useModalParams } from '@/hooks/useModalParams'
import {
  BarChart3,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Droplet,
  Check,
  Trash2,
  X,
  CheckSquare,
  Square,
  History,
  ArrowUpDown,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { StatsCardList, type StatFilter, type DaySummary } from '@/components/StatsCardList'

// 排序字段类型
const sortFields = ['endTime', 'createdAt', 'updatedAt'] as const
type SortField = typeof sortFields[number]

const sortFieldLabels: Record<SortField, string> = {
  endTime: '结束时间',
  createdAt: '创建时间',
  updatedAt: '修改时间',
}

const STAT_FILTERS: StatFilter[] = ['sleep', 'bottle', 'breastfeed', 'pump', 'diaper', 'outdoor', 'headLift', 'rollOver']

const statFilterActivityTypes: Record<StatFilter, ActivityType[]> = {
  sleep: [ActivityType.SLEEP],
  bottle: [ActivityType.BOTTLE],
  breastfeed: [ActivityType.BREASTFEED],
  pump: [ActivityType.PUMP],
  diaper: [ActivityType.DIAPER],
  outdoor: [ActivityType.OUTDOOR],
  headLift: [ActivityType.HEAD_LIFT],
  rollOver: [ActivityType.ROLL_OVER],
}

const legacyFilterMapping: Partial<Record<string, StatFilter[]>> = {
  sleep: ['sleep'],
  feeding: ['bottle', 'breastfeed', 'pump'],
  diaper: ['diaper'],
  activities: ['outdoor', 'headLift', 'rollOver'],
}

const filterLabelMap: Record<StatFilter, string> = {
  sleep: '睡眠',
  bottle: '瓶喂',
  breastfeed: '亲喂',
  pump: '吸奶',
  diaper: '尿布',
  outdoor: '户外',
  headLift: '趴趴',
  rollOver: '翻身',
}

function isStatFilter(value: string): value is StatFilter {
  return STAT_FILTERS.includes(value as StatFilter)
}

function StatsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeFilters = useMemo<StatFilter[]>(() => {
    const filtersParam = searchParams.get('filters')
    if (filtersParam) {
      return Array.from(new Set(filtersParam.split(',').map(filter => filter.trim()).filter(isStatFilter)))
    }

    const legacyFilter = searchParams.get('filter')
    if (legacyFilter && legacyFilterMapping[legacyFilter]) {
      return legacyFilterMapping[legacyFilter] || []
    }

    return []
  }, [searchParams])

  // 多选状态
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false)
  const [showBatchDateChange, setShowBatchDateChange] = useState(false)
  const [targetDateInput, setTargetDateInput] = useState('')

  // 排序状态：默认按结束时间倒序
  const [sortField, setSortField] = useState<SortField>('endTime')
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)

  // URL 参数管理（包括日期）
  const { openActivityDetail, selectedDate, selectedDateStr, setSelectedDate } = useModalParams()
  const batchDeleteMutation = useBatchDeleteActivities()
  const batchUpdateDateMutation = useBatchUpdateActivityDate()

  // Use React Query for activities (不包含前一天晚上的活动)
  const { data: activities = [], isLoading, refetch } = useActivities({
    date: selectedDateStr,
    limit: 100,
    // 不设置 includePreviousEvening，默认 false，只获取当天的活动
  })

  // Filter and sort activities based on selected filter and sort field
  const filteredActivities = useMemo(() => {
    let result = activities

    // 先过滤
    if (activeFilters.length > 0) {
      const filterTypes = new Set(activeFilters.flatMap(filter => statFilterActivityTypes[filter]))
      result = result.filter(a => filterTypes.has(a.type as ActivityType))
    }

    // 再排序（倒序）
    return [...result].sort((a, b) => {
      let aValue: string | null | undefined
      let bValue: string | null | undefined

      if (sortField === 'endTime') {
        // 结束时间排序：没有 endTime 的用 startTime 代替
        aValue = a.endTime || a.startTime
        bValue = b.endTime || b.startTime
      } else {
        aValue = a[sortField]
        bValue = b[sortField]
      }

      // 倒序排列
      return new Date(bValue || 0).getTime() - new Date(aValue || 0).getTime()
    })
  }, [activities, activeFilters, sortField])

  // 切换排序字段
  const cycleSortField = useCallback(() => {
    setSortField(current => {
      const currentIndex = sortFields.indexOf(current)
      const nextIndex = (currentIndex + 1) % sortFields.length
      return sortFields[nextIndex]
    })
  }, [])

  // Calculate summary from activities (shape matches StatsCardList DaySummary)
  const summary = useMemo<DaySummary | null>(() => {
    if (!activities || activities.length === 0) {
      return {
        sleepCount: 0,
        totalSleepMinutes: 0,
        totalBottleMilkAmount: 0,
        totalBreastfeedMinutes: 0,
        totalPumpMilkAmount: 0,
        diaperCount: 0,
        largePeeDiaperCount: 0,
        smallMediumPeeDiaperCount: 0,
        totalOutdoorMinutes: 0,
        totalHeadLiftMinutes: 0,
        totalRollOverCount: 0,
        totalPullToSitCount: 0,
      }
    }

    const summary: DaySummary = {
      sleepCount: 0,
      totalSleepMinutes: 0,
      totalBottleMilkAmount: 0,
      totalBreastfeedMinutes: 0,
      totalPumpMilkAmount: 0,
      diaperCount: 0,
      largePeeDiaperCount: 0,
      smallMediumPeeDiaperCount: 0,
      totalOutdoorMinutes: 0,
      totalHeadLiftMinutes: 0,
      totalRollOverCount: 0,
      totalPullToSitCount: 0,
    }

    // 睡眠统计 - 有 endTime 才计为完整睡眠，只计算当天范围内的部分
    const sleeps = activities.filter((a) => a.type === 'SLEEP' && a.endTime)
    const sleepMinutesPerActivity = sleeps.map(a =>
      calculateDurationInDay(a.startTime, a.endTime!, selectedDate)
    )
    summary.sleepCount = sleepMinutesPerActivity.filter(m => m > 0).length
    summary.totalSleepMinutes = sleepMinutesPerActivity.reduce((acc, m) => acc + m, 0)

    // 尿布统计
    const diapers = activities.filter((a) => a.type === 'DIAPER')
    summary.diaperCount = diapers.length
    for (const d of diapers) {
      if (d.hasPee) {
        if (d.peeAmount === 'LARGE') summary.largePeeDiaperCount++
        else if (d.peeAmount === 'MEDIUM' || d.peeAmount === 'SMALL') summary.smallMediumPeeDiaperCount++
      }
    }

    // 亲喂统计
    const breastfeeds = activities.filter((a) => a.type === 'BREASTFEED')
    summary.totalBreastfeedMinutes = breastfeeds.reduce((acc, a) =>
      acc + (a.endTime ? calculateDurationMinutes(a.startTime, a.endTime) : 0), 0)

    // 瓶喂统计
    const bottles = activities.filter((a) => a.type === 'BOTTLE')
    summary.totalBottleMilkAmount = bottles.reduce((acc, a) => acc + (a.milkAmount || 0), 0)

    // 吸奶统计
    const pumps = activities.filter((a) => a.type === 'PUMP')
    summary.totalPumpMilkAmount = pumps.reduce((acc, a) => acc + (a.milkAmount || 0), 0)

    // 抬头时间统计
    const headLifts = activities.filter((a) => a.type === 'HEAD_LIFT' && a.endTime)
    summary.totalHeadLiftMinutes = headLifts.reduce((acc, a) =>
      acc + calculateDurationMinutes(a.startTime, a.endTime!), 0)

    // 户外时间统计
    const outdoors = activities.filter((a) => a.type === 'OUTDOOR' && a.endTime)
    summary.totalOutdoorMinutes = outdoors.reduce((acc, a) =>
      acc + calculateDurationMinutes(a.startTime, a.endTime!), 0)

    // 翻身 / 拉坐
    const rollOvers = activities.filter((a) => a.type === 'ROLL_OVER')
    summary.totalRollOverCount = rollOvers.reduce((acc, a) => acc + (a.count ?? 1), 0)
    const pullToSits = activities.filter((a) => a.type === 'PULL_TO_SIT')
    summary.totalPullToSitCount = pullToSits.reduce((acc, a) => acc + (a.count ?? 1), 0)

    return summary
  }, [activities, selectedDate])

  // 日期导航
  const navigateDate = (days: number) => {
    const newDate = dayjs(selectedDate).add(days, 'day').toDate()
    setSelectedDate(newDate)
    // 切换日期时退出多选模式
    setIsSelectMode(false)
    setSelectedIds(new Set())
  }

  // 是否是今天
  const isToday = selectedDateStr === dayjs().format('YYYY-MM-DD')

  // 格式化时间
  const formatTime = (date: Date | string) => {
    return dayjs(date).format('HH:mm')
  }

  // 格式化时间范围
  const formatTimeRange = (startTime: Date | string, endTime: Date | string) => {
    return `${dayjs(startTime).format('HH:mm')} - ${dayjs(endTime).format('HH:mm')}`
  }

  // 处理卡片点击过滤 - 更新 URL params
  const handleCardClick = useCallback((filterType: StatFilter) => {
    const params = new URLSearchParams(searchParams.toString())
    const nextFilters = new Set(activeFilters)
    if (nextFilters.has(filterType)) {
      nextFilters.delete(filterType)
    } else {
      nextFilters.add(filterType)
    }

    if (nextFilters.size === 0) {
      params.delete('filters')
      params.delete('filter')
    } else {
      params.set('filters', Array.from(nextFilters).join(','))
      params.delete('filter')
    }

    router.replace(`/stats?${params.toString()}`, { scroll: false })
  }, [activeFilters, searchParams, router])

  // 长按开始多选（支持滑动取消）
  const handleLongPressStart = useCallback((activityId: string, e: React.TouchEvent | React.MouseEvent) => {
    longPressTriggered.current = false

    // 记录起始位置
    if ('touches' in e) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else {
      touchStartPos.current = { x: e.clientX, y: e.clientY }
    }

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setIsSelectMode(true)
      setSelectedIds(new Set([activityId]))
    }, 500) // 500ms 长按
  }, [])

  // 长按移动检测（滑动超过 10px 取消长按）
  const handleLongPressMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartPos.current) return

    let currentX: number, currentY: number
    if ('touches' in e) {
      currentX = e.touches[0].clientX
      currentY = e.touches[0].clientY
    } else {
      currentX = e.clientX
      currentY = e.clientY
    }

    const deltaX = Math.abs(currentX - touchStartPos.current.x)
    const deltaY = Math.abs(currentY - touchStartPos.current.y)

    // 滑动超过 10px，取消长按
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }, [])

  // 长按结束
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
  }, [])

  // 处理活动点击
  const handleActivityClick = useCallback((activity: Activity) => {
    if (isSelectMode) {
      // 多选模式下，切换选中状态
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(activity.id)) {
          next.delete(activity.id)
        } else {
          next.add(activity.id)
        }
        return next
      })
    } else {
      // 使用 URL 参数打开活动详情弹窗
      openActivityDetail(activity.id)
    }
  }, [isSelectMode, openActivityDetail])

  // 退出多选模式
  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false)
    setSelectedIds(new Set())
  }, [])

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredActivities.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredActivities.map(a => a.id)))
    }
  }, [filteredActivities, selectedIds.size])

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return

    batchDeleteMutation.mutate(
      { body: { ids: Array.from(selectedIds) } },
      {
        onSuccess: (data) => {
          toast.success(`成功删除 ${data.count} 条记录`)
          setShowBatchDeleteConfirm(false)
          exitSelectMode()
          refetch()
        },
        onError: () => {
          toast.error('删除失败，请重试')
        },
      }
    )
  }, [selectedIds, batchDeleteMutation, refetch, exitSelectMode])

  // 批量修改日期
  const handleBatchDateChange = useCallback(async () => {
    if (selectedIds.size === 0 || !targetDateInput) return

    batchUpdateDateMutation.mutate(
      { body: { ids: Array.from(selectedIds), targetDate: targetDateInput } },
      {
        onSuccess: (data) => {
          toast.success(`成功修改 ${data.count} 条记录的日期`)
          setShowBatchDateChange(false)
          setTargetDateInput('')
          exitSelectMode()
          refetch()
        },
        onError: (error) => {
          const errorMessage = (error as { error?: string })?.error || '修改失败，请重试'
          toast.error(errorMessage)
        },
      }
    )
  }, [selectedIds, targetDateInput, batchUpdateDateMutation, refetch, exitSelectMode])

  // 渲染活动详情（用于列表项）
  const renderActivityDetails = (activity: Activity) => {
    switch (activity.type) {
      case 'DIAPER':
        return (
          <div className="flex items-center gap-2 text-base text-gray-600 dark:text-gray-400">
            {activity.hasPoop && (
              <span className="flex items-center gap-1">
                <span className="text-amber-700">💩</span>
                {activity.poopColor && (
                  <span
                    className={`w-4 h-4 rounded-full ${PoopColorStyles[activity.poopColor as keyof typeof PoopColorStyles]}`}
                  />
                )}
              </span>
            )}
            {activity.hasPee && (
              <span className="flex items-center gap-1">
                <Droplet size={16} className="text-yellow-500" />
                {activity.peeAmount && PeeAmountLabels[activity.peeAmount as keyof typeof PeeAmountLabels]}
              </span>
            )}
          </div>
        )
      case 'BREASTFEED': {
        const duration = activity.endTime
          ? calculateDurationMinutes(activity.startTime, activity.endTime)
          : null
        return (
          <div className="text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
            {activity.endTime && (
              <>
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  {formatTimeRange(activity.startTime, activity.endTime)}
                </span>
                <span>({duration}分钟)</span>
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
      }
      case 'BOTTLE': {
        const duration = activity.endTime
          ? calculateDurationMinutes(activity.startTime, activity.endTime)
          : null
        return (
          <div className="text-base text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
            {activity.milkAmount && (
              <span className="text-pink-600 dark:text-pink-400 font-medium text-lg">
                {activity.milkAmount}ml
              </span>
            )}
            {activity.endTime && (
              <>
                <span className="text-gray-500">
                  {formatTimeRange(activity.startTime, activity.endTime)}
                </span>
                <span>({duration}分钟)</span>
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
      }
      case 'PUMP': {
        const duration = activity.endTime
          ? calculateDurationMinutes(activity.startTime, activity.endTime)
          : null
        return (
          <div className="text-base text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
            {activity.milkAmount && (
              <span className="text-fuchsia-600 dark:text-fuchsia-400 font-medium text-lg">
                {activity.milkAmount}ml
              </span>
            )}
            {activity.endTime && (
              <>
                <span className="text-gray-500">
                  {formatTimeRange(activity.startTime, activity.endTime)}
                </span>
                <span>({duration}分钟)</span>
              </>
            )}
          </div>
        )
      }
      case 'SLEEP': {
        const duration = activity.endTime
          ? calculateDurationMinutes(activity.startTime, activity.endTime)
          : null
        return activity.endTime ? (
          <span className="text-base text-sky-600 dark:text-sky-400 font-medium">
            {formatTimeRange(activity.startTime, activity.endTime)} ({formatDurationUtil(duration!)})
          </span>
        ) : (
          <span className="text-base text-sky-500 dark:text-sky-400 animate-pulse">
            正在睡觉...
          </span>
        )
      }
      default: {
        const duration = activity.endTime
          ? calculateDurationMinutes(activity.startTime, activity.endTime)
          : null
        return duration ? (
          <span className="text-base text-gray-600 dark:text-gray-400">
            {duration}分钟
          </span>
        ) : null
      }
    }
  }

  // 获取过滤器标签
  const getFilterLabel = () => {
    if (activeFilters.length === 0) return '当日记录'
    if (activeFilters.length === 1) return `${filterLabelMap[activeFilters[0]]}记录`
    return `${activeFilters.length}类筛选记录`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fefbf6] to-[#fff5e6] dark:from-[#1a1a2e] dark:to-[#16213e] safe-area-top safe-area-bottom">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          {isSelectMode ? (
            <>
              <button
                onClick={exitSelectMode}
                className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-base flex items-center gap-1"
              >
                <X size={18} />
                取消
              </button>
              <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                已选 {selectedIds.size} 项
              </span>
              <button
                onClick={toggleSelectAll}
                className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-base flex items-center gap-1"
              >
                {selectedIds.size === filteredActivities.length ? (
                  <>
                    <Square size={18} />
                    取消
                  </>
                ) : (
                  <>
                    <CheckSquare size={18} />
                    全选
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <Link
                href={isToday ? '/' : `/?date=${selectedDateStr}`}
                className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-base flex items-center gap-1"
                data-testid="stats-back-link"
              >
                <ArrowLeft size={18} />
                返回
              </Link>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                <BarChart3 size={22} />
                数据统计
              </h1>
              <div className="flex items-center gap-2">
                <Link
                  href="/stats/trends"
                  className="p-2 rounded-full bg-primary/10 text-primary"
                  title="数据趋势"
                  data-testid="stats-trends-link"
                >
                  <TrendingUp size={18} />
                </Link>
                <Link
                  href="/audits"
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  title="操作记录"
                  data-testid="stats-audits-link"
                >
                  <History size={18} />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* 日期选择器 - 多选模式下隐藏 */}
        {!isSelectMode && (
          <div className="px-4 pb-3 flex items-center justify-center gap-4">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              data-testid="stats-date-prev-btn"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {formatDateChinese(selectedDate)}
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400">
                {formatWeekday(selectedDate)}
              </p>
            </div>
            <button
              onClick={() => navigateDate(1)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              disabled={isToday}
              data-testid="stats-date-next-btn"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </header>

      {/* 统计概览 - 可点击过滤，多选模式下隐藏 */}
      {summary && !isSelectMode && (
        <section className="p-4">
          <StatsCardList
            summary={summary}
            activeFilters={activeFilters}
            onStatCardClick={handleCardClick}
          />
        </section>
      )}

      {/* 时间线 */}
      <section className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
            <ClipboardList size={22} />
            {getFilterLabel()}
          </h2>
          <div className="flex items-center gap-2">
            {!isSelectMode && (
              <button
                onClick={cycleSortField}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-base flex items-center gap-1"
                title={`当前排序：${sortFieldLabels[sortField]}`}
              >
                <ArrowUpDown size={16} />
                {sortFieldLabels[sortField]}
              </button>
            )}
            {activeFilters.length > 0 && !isSelectMode && (
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete('filters')
                  params.delete('filter')
                  router.replace(`/stats?${params.toString()}`, { scroll: false })
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-base flex items-center gap-1"
              >
                <X size={16} />
                清除筛选
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500 text-lg">加载中...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-lg">暂无记录</div>
        ) : (
          <>
            {/* 长按提示 */}
            {!isSelectMode && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">
                长按记录可进入多选模式
              </p>
            )}
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => {
                    // 如果刚触发了长按，不执行点击
                    if (longPressTriggered.current) {
                      longPressTriggered.current = false
                      return
                    }
                    handleActivityClick(activity)
                  }}
                  onTouchStart={(e) => handleLongPressStart(activity.id, e)}
                  onTouchMove={handleLongPressMove}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                  onMouseDown={(e) => handleLongPressStart(activity.id, e)}
                  onMouseMove={handleLongPressMove}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  className={`w-full bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-start gap-4 text-left transition-all ${isSelectMode && selectedIds.has(activity.id)
                      ? 'ring-2 ring-primary ring-offset-2 bg-primary/5'
                      : 'hover:shadow-md'
                    }`}
                  data-testid={`stats-activity-${activity.id}`}
                >
                  {/* 多选模式下显示选择框 */}
                  {isSelectMode && (
                    <div className="flex-shrink-0 mt-1">
                      {selectedIds.has(activity.id) ? (
                        <CheckSquare size={24} className="text-primary" />
                      ) : (
                        <Square size={24} className="text-gray-400" />
                      )}
                    </div>
                  )}
                  <ActivityIcon type={activity.type as ActivityType} size={36} className="text-gray-600 dark:text-gray-300 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                        {ActivityTypeLabels[activity.type as ActivityType]}
                      </span>
                      <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                        {formatTime(activity.startTime)}
                      </span>
                    </div>
                    {renderActivityDetails(activity)}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 多选模式底部操作栏 */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 safe-area-bottom">
          <div className="max-w-md mx-auto space-y-3">
            <button
              onClick={() => setShowBatchDateChange(true)}
              className="w-full p-4 rounded-2xl bg-primary text-white font-semibold text-lg flex items-center justify-center gap-2"
              data-testid="batch-change-date-btn"
            >
              <Calendar size={22} />
              修改日期 ({selectedIds.size} 项)
            </button>
            <button
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="w-full p-4 rounded-2xl bg-red-500 text-white font-semibold text-lg flex items-center justify-center gap-2"
              data-testid="batch-delete-btn"
            >
              <Trash2 size={22} />
              删除选中的 {selectedIds.size} 项
            </button>
          </div>
        </div>
      )}

      {/* 批量删除确认弹窗 */}
      <BottomSheet
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        title="确认批量删除"
      >
        <div className="space-y-6">
          <p className="text-center text-lg text-gray-600 dark:text-gray-400">
            确定要删除选中的 <span className="font-bold text-red-500">{selectedIds.size}</span> 条记录吗？此操作无法撤销。
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowBatchDeleteConfirm(false)}
              className="p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-lg"
              data-testid="batch-delete-cancel-btn"
            >
              取消
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={batchDeleteMutation.isPending}
              className="p-4 rounded-2xl bg-red-500 text-white font-semibold text-lg"
              data-testid="batch-delete-confirm-btn"
            >
              {batchDeleteMutation.isPending ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* 批量修改日期弹窗 */}
      <BottomSheet
        isOpen={showBatchDateChange}
        onClose={() => {
          setShowBatchDateChange(false)
          setTargetDateInput('')
        }}
        title="修改日期"
      >
        <div className="space-y-6">
          <p className="text-center text-lg text-gray-600 dark:text-gray-400">
            将选中的 <span className="font-bold text-primary">{selectedIds.size}</span> 条记录移动到新日期
          </p>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              选择目标日期
            </label>
            <input
              type="date"
              value={targetDateInput}
              onChange={(e) => setTargetDateInput(e.target.value)}
              max={dayjs().format('YYYY-MM-DD')}
              className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-lg"
              data-testid="batch-date-input"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              活动的具体时间（小时分钟）将保持不变，只修改日期
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setShowBatchDateChange(false)
                setTargetDateInput('')
              }}
              className="p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-lg"
              data-testid="batch-date-cancel-btn"
            >
              取消
            </button>
            <button
              onClick={handleBatchDateChange}
              disabled={batchUpdateDateMutation.isPending || !targetDateInput}
              className="p-4 rounded-2xl bg-primary text-white font-semibold text-lg disabled:opacity-50"
              data-testid="batch-date-confirm-btn"
            >
              {batchUpdateDateMutation.isPending ? '修改中...' : '确认修改'}
            </button>
          </div>
        </div>
      </BottomSheet>

    </main>
  )
}

export default function StatsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 size={32} className="mx-auto text-gray-400 mb-2 animate-pulse" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    }>
      <StatsPageContent />
    </Suspense>
  )
}
