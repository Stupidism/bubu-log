'use client'

import { useEffect, useMemo, useState } from 'react'
import { EntryType, EntryTypeHints, EntryTypeLabels, EntryTypeShortcuts, type TimeEntry } from '@/types/entry'
import { EntryTypeButton } from './EntryTypeButton'
import { X, Save } from 'lucide-react'
import { toast } from 'sonner'
import { dayjs } from '@/lib/dayjs'

export interface EntryFormValues {
  id?: string
  type: EntryType
  startTime: Date
  durationMinutes: number
  notes?: string
}

interface EntryFormSheetProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: EntryFormValues) => Promise<void>
  initialEntry?: TimeEntry | null
  defaultStartTime?: Date
}

const DEFAULT_DURATION = 30

function toLocalInputValue(date: Date) {
  return dayjs(date).format('YYYY-MM-DDTHH:mm')
}

export function EntryFormSheet({
  open,
  onClose,
  onSubmit,
  initialEntry,
  defaultStartTime,
}: EntryFormSheetProps) {
  const [type, setType] = useState<EntryType>(EntryType.SLEEP)
  const [startTime, setStartTime] = useState<Date>(defaultStartTime ?? new Date())
  const [durationMinutes, setDurationMinutes] = useState<number>(DEFAULT_DURATION)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    if (initialEntry) {
      setType(initialEntry.type)
      const start = new Date(initialEntry.startTime)
      setStartTime(start)
      if (initialEntry.endTime) {
        const end = new Date(initialEntry.endTime)
        const diff = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
        setDurationMinutes(diff || DEFAULT_DURATION)
      } else {
        setDurationMinutes(DEFAULT_DURATION)
      }
      setNotes(initialEntry.notes ?? '')
    } else {
      setType(EntryType.SLEEP)
      setStartTime(defaultStartTime ?? new Date())
      setDurationMinutes(DEFAULT_DURATION)
      setNotes('')
    }
  }, [open, initialEntry, defaultStartTime])

  const quickDurations = useMemo(() => EntryTypeShortcuts[type], [type])

  const handleSubmit = async () => {
    if (saving) return
    setSaving(true)
    try {
      await onSubmit({
        id: initialEntry?.id,
        type,
        startTime,
        durationMinutes: Math.max(0, durationMinutes),
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6 animate-in slide-in-from-bottom-4 fade-in duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-5 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {initialEntry ? '编辑记录' : '新增记录'}
              </h2>
              <p className="text-xs text-gray-500">{EntryTypeLabels[type]} · {EntryTypeHints[type]}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">类别</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(EntryType).map((entryType) => (
                  <EntryTypeButton
                    key={entryType}
                    type={entryType}
                    selected={type === entryType}
                    onClick={setType}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">开始时间</p>
              <input
                type="datetime-local"
                value={toLocalInputValue(startTime)}
                onChange={(event) => setStartTime(new Date(event.target.value))}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">持续时长（分钟）</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {quickDurations.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setDurationMinutes(minutes)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      durationMinutes === minutes
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-white text-gray-500 hover:border-primary/60'
                    }`}
                  >
                    {minutes} 分
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={0}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">备注</p>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={EntryTypeHints[type]}
                rows={3}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98]"
          >
            <Save size={16} />
            {saving ? '保存中...' : '保存记录'}
          </button>
        </div>
      </div>
    </>
  )
}
