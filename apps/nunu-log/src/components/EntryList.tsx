'use client'

import { EntryTypeLabels, type TimeEntry } from '@/types/entry'
import { EntryIcon } from './EntryIcon'
import { formatDateTime, formatDuration, calculateDurationMinutes } from '@/lib/dayjs'
import { Trash2 } from 'lucide-react'

interface EntryListProps {
  entries: TimeEntry[]
  onEdit?: (entry: TimeEntry) => void
  onDelete?: (entry: TimeEntry) => void
}

function getDurationLabel(entry: TimeEntry) {
  if (!entry.endTime) return ''
  const minutes = calculateDurationMinutes(entry.startTime, entry.endTime)
  if (minutes <= 0) return ''
  return formatDuration(minutes)
}

export function EntryList({ entries, onEdit, onDelete }: EntryListProps) {
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 px-4 py-6 text-center text-sm text-gray-500">
        还没有记录，点击右下角开始添加。
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {[...entries]
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .map((entry) => (
        <div
          key={entry.id}
          className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-white px-3 py-3 shadow-sm"
        >
          <button type="button" onClick={() => onEdit?.(entry)} className="flex flex-1 items-start gap-3 text-left">
            <div className="mt-1 rounded-xl bg-primary/10 p-2 text-primary">
              <EntryIcon type={entry.type} size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">
                  {EntryTypeLabels[entry.type]}
                </span>
                <span className="text-xs text-gray-400">{formatDateTime(entry.startTime)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {getDurationLabel(entry) || '即时记录'}
              </div>
              {entry.notes && (
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{entry.notes}</p>
              )}
            </div>
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(entry)}
              className="mt-1 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
