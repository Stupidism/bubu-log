'use client'

import { EntryType, EntryTypeLabels, EntryTypeColors } from '@/types/entry'
import { EntryIcon } from './EntryIcon'
import { formatDuration } from '@/lib/dayjs'

export interface DailySummary {
  totalMinutes: number
  byType: Record<EntryType, number>
}

interface DailySummaryCardsProps {
  summary: DailySummary
}

function formatMinutes(minutes: number) {
  if (minutes <= 0) return '-'
  return formatDuration(minutes)
}

export function DailySummaryCards({ summary }: DailySummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.values(EntryType).map((type) => {
        const color = EntryTypeColors[type]
        const value = summary.byType[type] || 0
        return (
          <div
            key={type}
            className={`rounded-2xl border ${color.border} ${color.bg} px-2 py-3 text-center shadow-sm`}
          >
            <div className="flex items-center justify-center gap-1 text-xs font-medium">
              <EntryIcon type={type} size={16} className={color.text} />
              <span className={color.text}>{EntryTypeLabels[type]}</span>
            </div>
            <p className={`mt-1 text-sm font-semibold ${color.text}`}>{formatMinutes(value)}</p>
          </div>
        )
      })}
    </div>
  )
}
