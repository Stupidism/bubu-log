'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { toast } from 'sonner'
import { dayjs, formatDateChinese, formatWeekday, formatDuration, calculateDurationInDay } from '@/lib/dayjs'
import type { TimeEntry } from '@/types/entry'
import { EntryType, EntryTypeChartColors, EntryTypeLabels } from '@/types/entry'

function getWeekStart(date: Date) {
  const day = date.getDay() // 0 Sunday
  const diff = (day + 6) % 7 // Monday as start
  return dayjs(date).subtract(diff, 'day').startOf('day').toDate()
}

const emptyByType = {
  [EntryType.SLEEP]: 0,
  [EntryType.MEAL]: 0,
  [EntryType.WORK]: 0,
  [EntryType.CHILDCARE]: 0,
  [EntryType.ENTERTAINMENT]: 0,
  [EntryType.OTHER]: 0,
}

export default function WeeklyPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchEntries = useCallback(async () => {
    const start = dayjs(weekStart).format('YYYY-MM-DD')
    const end = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD')
    const tzOffset = new Date().getTimezoneOffset()
    setLoading(true)
    try {
      const response = await fetch(`/api/entries?from=${start}&to=${end}&tzOffset=${tzOffset}`)
      if (!response.ok) throw new Error('加载失败')
      const data = await response.json()
      setEntries(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => dayjs(weekStart).add(index, 'day').toDate())
  }, [weekStart])

  const daySummaries = useMemo(() => {
    return days.map((day) => {
      const byType = { ...emptyByType }
      for (const entry of entries) {
        if (!entry.endTime) continue
        const minutes = calculateDurationInDay(entry.startTime, entry.endTime, day)
        byType[entry.type as EntryType] += Math.max(0, minutes)
      }
      const totalMinutes = Object.values(byType).reduce((acc, value) => acc + value, 0)
      return { date: day, byType, totalMinutes }
    })
  }, [days, entries])

  const weeklyTotals = useMemo(() => {
    const totals = { ...emptyByType }
    let totalMinutes = 0
    for (const summary of daySummaries) {
      totalMinutes += summary.totalMinutes
      for (const type of Object.values(EntryType)) {
        totals[type] += summary.byType[type]
      }
    }
    return { totals, totalMinutes }
  }, [daySummaries])

  const handlePrev = () => setWeekStart(dayjs(weekStart).subtract(7, 'day').toDate())
  const handleNext = () => setWeekStart(dayjs(weekStart).add(7, 'day').toDate())

  return (
    <div className="min-h-screen bg-muted px-4 pb-24 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">周回顾</h1>
          <p className="text-xs text-gray-500">{formatDateChinese(weekStart)} - {formatDateChinese(dayjs(weekStart).add(6, 'day').toDate())}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1 rounded-full border border-border bg-white/80 px-3 py-1.5 text-xs text-gray-600 shadow-sm"
        >
          <Home size={14} />
          今日
        </Link>
      </header>

      <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 shadow-sm">
        <button type="button" onClick={handlePrev} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <p className="text-sm font-semibold text-gray-700">本周总计 {formatDuration(weeklyTotals.totalMinutes || 0)}</p>
        <button type="button" onClick={handleNext} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
          <ChevronRight size={20} />
        </button>
      </div>

      <section className="space-y-3">
        {daySummaries.map((summary) => (
          <div key={summary.date.toISOString()} className="rounded-2xl border border-border bg-white px-3 py-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{formatDateChinese(summary.date)}</p>
                <p className="text-xs text-gray-500">{formatWeekday(summary.date)}</p>
              </div>
              <p className="text-xs font-semibold text-gray-700">
                {summary.totalMinutes ? formatDuration(summary.totalMinutes) : '暂无记录'}
              </p>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
              {Object.values(EntryType).map((type) => {
                const minutes = summary.byType[type]
                if (!summary.totalMinutes || minutes === 0) return null
                return (
                  <div
                    key={type}
                    style={{
                      width: `${(minutes / summary.totalMinutes) * 100}%`,
                      backgroundColor: EntryTypeChartColors[type],
                    }}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">分类占比</h2>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(EntryType).map((type) => (
            <div key={type} className="rounded-2xl border border-border bg-white px-3 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">{EntryTypeLabels[type]}</span>
                <span className="text-xs font-semibold" style={{ color: EntryTypeChartColors[type] }}>
                  {weeklyTotals.totals[type] ? formatDuration(weeklyTotals.totals[type]) : '-'}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: weeklyTotals.totalMinutes
                      ? `${(weeklyTotals.totals[type] / weeklyTotals.totalMinutes) * 100}%`
                      : '0%',
                    backgroundColor: EntryTypeChartColors[type],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {loading && (
        <p className="mt-4 text-center text-xs text-gray-400">加载中…</p>
      )}
    </div>
  )
}
