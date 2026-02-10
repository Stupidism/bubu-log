'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { dayjs, calculateDurationInDay, formatDateChinese, formatWeekday } from '@/lib/dayjs'
import type { TimeEntry } from '@/types/entry'
import { EntryType } from '@/types/entry'
import { EntryTimeline, type EntryTimelineRef } from '@/components/EntryTimeline'
import { EntryFormSheet, type EntryFormValues } from '@/components/EntryFormSheet'
import { EntryFab } from '@/components/EntryFab'
import { DailySummaryCards } from '@/components/DailySummaryCards'
import { EntryList } from '@/components/EntryList'
import { DateNavigator } from '@bubu-log/log-ui'
import { BarChart3 } from 'lucide-react'

const emptySummary = {
  totalMinutes: 0,
  byType: {
    [EntryType.SLEEP]: 0,
    [EntryType.MEAL]: 0,
    [EntryType.WORK]: 0,
    [EntryType.CHILDCARE]: 0,
    [EntryType.ENTERTAINMENT]: 0,
    [EntryType.OTHER]: 0,
  },
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const timelineRef = useRef<EntryTimelineRef>(null)

  const fetchEntries = useCallback(async () => {
    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
    const tzOffset = new Date().getTimezoneOffset()
    setLoading(true)
    try {
      const response = await fetch(`/api/entries?date=${dateStr}&tzOffset=${tzOffset}`)
      if (!response.ok) throw new Error('加载失败')
      const data = await response.json()
      setEntries(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  useEffect(() => {
    if (dayjs(selectedDate).isSame(dayjs(), 'day')) {
      setTimeout(() => timelineRef.current?.scrollToCurrentTime(), 100)
    }
  }, [selectedDate, entries.length])

  const summary = useMemo(() => {
    if (!entries.length) return emptySummary

    const byType = { ...emptySummary.byType }
    let totalMinutes = 0

    for (const entry of entries) {
      if (!entry.endTime) continue
      const minutes = calculateDurationInDay(entry.startTime, entry.endTime, selectedDate)
      byType[entry.type as EntryType] += Math.max(0, minutes)
      totalMinutes += Math.max(0, minutes)
    }

    return { totalMinutes, byType }
  }, [entries, selectedDate])

  const handleSubmit = async (values: EntryFormValues) => {
    const payload = {
      type: values.type,
      startTime: values.startTime.toISOString(),
      durationMinutes: values.durationMinutes,
      notes: values.notes,
    }

    if (values.id) {
      const response = await fetch(`/api/entries/${values.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('更新失败')
      toast.success('记录已更新')
    } else {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('保存失败')
      toast.success('记录已保存')
    }

    setEditingEntry(null)
    await fetchEntries()
  }

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setFormOpen(true)
  }

  const handleDelete = async (entry: TimeEntry) => {
    const response = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' })
    if (!response.ok) {
      toast.error('删除失败')
      return
    }
    toast.success('记录已删除')
    await fetchEntries()
  }

  const showCurrentTime = dayjs(selectedDate).isSame(dayjs(), 'day')
  const defaultStartTime = useMemo(() => {
    if (showCurrentTime) return new Date()
    return dayjs(selectedDate).hour(12).minute(0).second(0).toDate()
  }, [selectedDate, showCurrentTime])

  return (
    <div className="min-h-screen bg-muted px-4 pb-24 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">暖暖日记</h1>
          <p className="text-xs text-gray-500">记录一天的时间去向</p>
        </div>
        <Link
          href="/weekly"
          className="flex items-center gap-1 rounded-full border border-border bg-white/80 px-3 py-1.5 text-xs text-gray-600 shadow-sm"
        >
          <BarChart3 size={14} />
          周回顾
        </Link>
      </header>

      <DateNavigator
        label={formatDateChinese(selectedDate)}
        subLabel={formatWeekday(selectedDate)}
        onPrev={() => setSelectedDate(dayjs(selectedDate).subtract(1, 'day').toDate())}
        onNext={() => setSelectedDate(dayjs(selectedDate).add(1, 'day').toDate())}
        onToday={() => setSelectedDate(new Date())}
        showToday={!showCurrentTime}
        variant="card"
      />

      <section className="mt-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">今日概览</h2>
        <DailySummaryCards summary={summary} />
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">时间线</h2>
          {loading && <span className="text-xs text-gray-400">加载中…</span>}
        </div>
        <div className="rounded-3xl bg-white/80 px-2 py-4 shadow-sm">
          <EntryTimeline
            ref={timelineRef}
            entries={entries}
            date={selectedDate}
            showCurrentTime={showCurrentTime}
            onEntryClick={handleEdit}
          />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">记录列表</h2>
        <EntryList entries={entries} onEdit={handleEdit} onDelete={handleDelete} />
      </section>

      <EntryFab
        onClick={() => {
          setEditingEntry(null)
          setFormOpen(true)
        }}
      />

      <EntryFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialEntry={editingEntry}
        defaultStartTime={defaultStartTime}
      />
    </div>
  )
}
