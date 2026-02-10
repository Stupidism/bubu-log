'use client'

import { forwardRef, useImperativeHandle, useMemo, useRef, useEffect, useState } from 'react'
import { EntryTypeColors, EntryTypeLabels, type TimeEntry } from '@/types/entry'
import { EntryIcon } from './EntryIcon'
import { dayjs, calculateDurationInDay, formatTime } from '@/lib/dayjs'
import { TimelineGrid } from '@bubu-log/log-ui'

interface EntryTimelineProps {
  entries: TimeEntry[]
  date: Date
  onEntryClick?: (entry: TimeEntry) => void
  showCurrentTime?: boolean
}

export interface EntryTimelineRef {
  scrollToCurrentTime: () => void
}

const HOUR_HEIGHT = 60
const MIN_DURATION_BLOCK_HEIGHT = 16

export const EntryTimeline = forwardRef<EntryTimelineRef, EntryTimelineProps>(
  function EntryTimeline({ entries, date, onEntryClick, showCurrentTime = false }, ref) {
    const currentTimeRef = useRef<HTMLDivElement>(null)
    const [currentMinutes, setCurrentMinutes] = useState(() => {
      const now = new Date()
      return now.getHours() * 60 + now.getMinutes()
    })

    useEffect(() => {
      if (!showCurrentTime) return
      const interval = setInterval(() => {
        const now = new Date()
        setCurrentMinutes(now.getHours() * 60 + now.getMinutes())
      }, 60000)
      return () => clearInterval(interval)
    }, [showCurrentTime])

    useImperativeHandle(ref, () => ({
      scrollToCurrentTime: () => {
        if (currentTimeRef.current) {
          currentTimeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      },
    }))

    const positionedEntries = useMemo(() => {
      const dayStart = dayjs(date).startOf('day')
      return entries
        .map((entry) => {
          const startTime = dayjs(entry.startTime)
          const displayStart = startTime.isBefore(dayStart) ? dayStart : startTime
          const minutesFromStart = displayStart.diff(dayStart, 'minute')
          const top = Math.max(0, (minutesFromStart / 60) * HOUR_HEIGHT)

          const endTime = entry.endTime ? dayjs(entry.endTime) : null
          const duration = endTime ? calculateDurationInDay(entry.startTime, entry.endTime, date) : 0
          const isLineType = !endTime || duration === 0

          const height = isLineType
            ? 2
            : Math.max((duration / 60) * HOUR_HEIGHT, MIN_DURATION_BLOCK_HEIGHT)

          return {
            ...entry,
            top,
            height,
            duration,
            isLineType,
            startTimeDate: startTime.toDate(),
            endTimeDate: endTime ? endTime.toDate() : startTime.toDate(),
          }
        })
        .sort((a, b) => a.top - b.top)
    }, [entries, date])

    return (
      <TimelineGrid date={date} hourHeight={HOUR_HEIGHT} className="relative">
        {showCurrentTime && (
          <div
            ref={currentTimeRef}
            className="absolute left-0 right-0 flex items-center gap-3"
            style={{ top: `${(currentMinutes / 60) * HOUR_HEIGHT}px` }}
          >
            <span className="w-12 text-right text-xs text-primary font-semibold">现在</span>
            <div className="flex-1 border-t border-primary/60" />
          </div>
        )}

        <div className="absolute left-14 right-3 top-0 bottom-0">
          {positionedEntries.map((entry) => {
            const colors = EntryTypeColors[entry.type as keyof typeof EntryTypeColors] ?? EntryTypeColors.OTHER
            const label = EntryTypeLabels[entry.type as keyof typeof EntryTypeLabels] ?? '记录'

            return (
              <button
                key={entry.id}
                onClick={() => onEntryClick?.(entry)}
                className={`absolute left-0 right-0 rounded-xl border ${colors.border} ${colors.bg} ${colors.text} ${
                  entry.isLineType ? 'h-[2px]' : 'p-2 text-left'
                }`}
                style={{ top: `${entry.top}px`, height: `${entry.height}px` }}
              >
                {!entry.isLineType && (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <EntryIcon type={entry.type as any} size={18} />
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTime(entry.startTime)}
                      {entry.endTime ? ` - ${formatTime(entry.endTime)}` : ''}
                    </span>
                  </div>
                )}
                {!entry.isLineType && entry.notes && (
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">{entry.notes}</p>
                )}
              </button>
            )
          })}
        </div>
      </TimelineGrid>
    )
  }
)
