'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { format, subDays, addMinutes, differenceInMinutes } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  ActivityType,
  ActivityTypeLabels,
  PeeAmountLabels,
  PoopColorStyles,
  ActivityCategories,
} from '@/types/activity'
import { ActivityIcon } from '@/components/ActivityIcon'
import { BottomSheet } from '@/components/BottomSheet'
import { Toast } from '@/components/Toast'
import { useActivities, useDeleteActivity, type Activity } from '@/lib/api/hooks'
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
  Trash2,
  Edit2,
  X,
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

type FilterType = 'all' | 'sleep' | 'feeding' | 'diaper' | 'activities'

export default function StatsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const deleteActivityMutation = useDeleteActivity()

  // Use React Query for activities
  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const { data: activities = [], isLoading, refetch } = useActivities({
    date: dateStr,
    limit: 100,
  })

  // Filter activities based on selected filter
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities
    
    const filterTypes = ActivityCategories[filter as keyof typeof ActivityCategories] || []
    return activities.filter(a => filterTypes.includes(a.type as ActivityType))
  }, [activities, filter])

  // Calculate summary from activities
  const summary = useMemo<DaySummary | null>(() => {
    if (!activities || activities.length === 0) {
      return {
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
    }

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

    // 睡眠统计
    const sleepEnds = activities.filter((a) => a.type === 'SLEEP_END')
    summary.sleepCount = sleepEnds.length
    summary.totalSleepMinutes = sleepEnds.reduce((acc, a) => acc + (a.duration || 0), 0)

    // 尿布统计
    const diapers = activities.filter((a) => a.type === 'DIAPER')
    summary.diaperCount = diapers.length
    summary.poopCount = diapers.filter((a) => a.hasPoop).length
    summary.peeCount = diapers.filter((a) => a.hasPee).length

    // 亲喂统计（兼容新旧两种类型）
    const breastfeedsNew = activities.filter((a) => a.type === 'BREASTFEED')
    const breastfeedsOld = activities.filter((a) => a.type === 'BREASTFEED_END')
    summary.breastfeedCount = breastfeedsNew.length + breastfeedsOld.length
    summary.totalBreastfeedMinutes = 
      breastfeedsNew.reduce((acc, a) => acc + (a.duration || 0), 0) +
      breastfeedsOld.reduce((acc, a) => acc + (a.duration || 0), 0)

    // 瓶喂统计（兼容新旧两种类型）
    const bottlesNew = activities.filter((a) => a.type === 'BOTTLE')
    const bottlesOld = activities.filter((a) => a.type === 'BOTTLE_END')
    summary.bottleCount = bottlesNew.length + bottlesOld.length
    summary.totalMilkAmount = 
      bottlesNew.reduce((acc, a) => acc + (a.milkAmount || 0), 0) +
      bottlesOld.reduce((acc, a) => acc + (a.milkAmount || 0), 0)

    // 活动统计
    const exercises = activities.filter((a) =>
      ['HEAD_LIFT', 'PASSIVE_EXERCISE', 'GAS_EXERCISE', 'BATH', 'OUTDOOR', 'EARLY_EDUCATION'].includes(a.type)
    )
    summary.exerciseCount = exercises.length

    return summary
  }, [activities])

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

  // 格式化时间范围
  const formatTimeRange = (startTime: Date | string, duration: number) => {
    const start = new Date(startTime)
    const end = addMinutes(start, duration)
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
  }

  // 处理卡片点击过滤
  const handleCardClick = (filterType: FilterType) => {
    setFilter(prev => prev === filterType ? 'all' : filterType)
  }

  // 处理活动点击
  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity)
  }

  // 处理删除
  const handleDelete = useCallback(async () => {
    if (!selectedActivity) return
    
    deleteActivityMutation.mutate(
      { params: { path: { id: selectedActivity.id } } },
      {
        onSuccess: () => {
          setToast({ message: '删除成功', type: 'success' })
          setShowDeleteConfirm(false)
          setSelectedActivity(null)
          refetch()
        },
        onError: () => {
          setToast({ message: '删除失败，请重试', type: 'error' })
        },
      }
    )
  }, [selectedActivity, deleteActivityMutation, refetch])

  // 渲染活动详情
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
                <Droplet size={16} className="text-blue-400" />
                {activity.peeAmount && PeeAmountLabels[activity.peeAmount as keyof typeof PeeAmountLabels]}
              </span>
            )}
          </div>
        )
      case 'BREASTFEED':
      case 'BREASTFEED_END':
        return (
          <div className="text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
            {activity.duration && (
              <>
                <span className="text-pink-600 dark:text-pink-400 font-medium">
                  {formatTimeRange(activity.recordTime, activity.duration)}
                </span>
                <span>({activity.duration}分钟)</span>
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
      case 'BOTTLE':
      case 'BOTTLE_END':
        return (
          <div className="text-base text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
            {activity.milkAmount && (
              <span className="text-blue-600 dark:text-blue-400 font-medium text-lg">
                {activity.milkAmount}ml
              </span>
            )}
            {activity.duration && (
              <>
                <span className="text-gray-500">
                  {formatTimeRange(activity.recordTime, activity.duration)}
                </span>
                <span>({activity.duration}分钟)</span>
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
      case 'SLEEP_END':
        return activity.duration ? (
          <span className="text-base text-amber-600 dark:text-amber-400 font-medium">
            睡了 {formatDuration(activity.duration)}
          </span>
        ) : null
      default:
        return activity.duration ? (
          <span className="text-base text-gray-600 dark:text-gray-400">
            {activity.duration}分钟
          </span>
        ) : null
    }
  }

  // 获取过滤器标签
  const getFilterLabel = () => {
    switch (filter) {
      case 'sleep': return '睡眠记录'
      case 'feeding': return '喂奶记录'
      case 'diaper': return '换尿布记录'
      case 'activities': return '活动记录'
      default: return '今日记录'
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fefbf6] to-[#fff5e6] dark:from-[#1a1a2e] dark:to-[#16213e] safe-area-top safe-area-bottom">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-base flex items-center gap-1"
          >
            <ArrowLeft size={18} />
            返回
          </Link>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
            <BarChart3 size={22} />
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
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {format(selectedDate, 'M月d日', { locale: zhCN })}
            </p>
            <p className="text-base text-gray-500 dark:text-gray-400">
              {format(selectedDate, 'EEEE', { locale: zhCN })}
            </p>
          </div>
          <button
            onClick={() => navigateDate(1)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </header>

      {/* 统计概览 - 可点击过滤 */}
      {summary && (
        <section className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {/* 睡眠卡片 */}
            <button
              onClick={() => handleCardClick('sleep')}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left transition-all ${
                filter === 'sleep' ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Moon size={28} className="text-indigo-500" />
                <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">睡眠</span>
              </div>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatDuration(summary.totalSleepMinutes)}
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400">
                {summary.sleepCount} 次
              </p>
            </button>

            {/* 喂奶卡片 */}
            <button
              onClick={() => handleCardClick('feeding')}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left transition-all ${
                filter === 'feeding' ? 'ring-2 ring-pink-500 ring-offset-2' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Milk size={28} className="text-pink-500" />
                <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">喂奶</span>
              </div>
              <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {summary.totalMilkAmount > 0 ? `${summary.totalMilkAmount}ml` : '-'}
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400">
                亲喂 {summary.breastfeedCount}次 · 瓶喂 {summary.bottleCount}次
              </p>
            </button>

            {/* 尿布卡片 */}
            <button
              onClick={() => handleCardClick('diaper')}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left transition-all ${
                filter === 'diaper' ? 'ring-2 ring-teal-500 ring-offset-2' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Baby size={28} className="text-teal-500" />
                <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">尿布</span>
              </div>
              <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                {summary.diaperCount} 次
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="text-amber-600">{summary.poopCount}💩</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Droplet size={14} className="text-blue-400" />
                  {summary.peeCount}
                </span>
              </p>
            </button>

            {/* 活动卡片 */}
            <button
              onClick={() => handleCardClick('activities')}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left transition-all ${
                filter === 'activities' ? 'ring-2 ring-amber-500 ring-offset-2' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target size={28} className="text-amber-500" />
                <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">活动</span>
              </div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {summary.exerciseCount} 次
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400">各类活动</p>
            </button>
          </div>
        </section>
      )}

      {/* 时间线 */}
      <section className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
            <ClipboardList size={22} />
            {getFilterLabel()}
          </h2>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-base flex items-center gap-1"
            >
              <X size={16} />
              清除筛选
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500 text-lg">加载中...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-lg">暂无记录</div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-start gap-4 text-left hover:shadow-md transition-shadow"
              >
                <ActivityIcon type={activity.type as ActivityType} size={36} className="text-gray-600 dark:text-gray-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                      {ActivityTypeLabels[activity.type as ActivityType]}
                    </span>
                    <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                      {formatTime(activity.recordTime)}
                    </span>
                  </div>
                  {renderActivityDetails(activity)}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 活动详情弹窗 */}
      <BottomSheet
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        title="活动详情"
      >
        {selectedActivity && (
          <div className="space-y-6">
            {/* 活动信息 */}
            <div className="text-center">
              <ActivityIcon type={selectedActivity.type as ActivityType} size={56} className="text-gray-600 dark:text-gray-300 mx-auto" />
              <h3 className="text-2xl font-bold mt-3 text-gray-800 dark:text-gray-100">
                {ActivityTypeLabels[selectedActivity.type as ActivityType]}
              </h3>
              <p className="text-xl text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(selectedActivity.recordTime), 'M月d日 HH:mm', { locale: zhCN })}
              </p>
            </div>

            {/* 详细信息 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
              {renderActivityDetails(selectedActivity)}
              {selectedActivity.notes && (
                <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
                  备注: {selectedActivity.notes}
                </p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold text-lg flex items-center justify-center gap-2"
              >
                <Trash2 size={22} />
                删除
              </button>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-lg"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* 删除确认弹窗 */}
      <BottomSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="确认删除"
      >
        <div className="space-y-6">
          <p className="text-center text-lg text-gray-600 dark:text-gray-400">
            确定要删除这条记录吗？此操作无法撤销。
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-lg"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteActivityMutation.isPending}
              className="p-4 rounded-2xl bg-red-500 text-white font-semibold text-lg"
            >
              {deleteActivityMutation.isPending ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
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
