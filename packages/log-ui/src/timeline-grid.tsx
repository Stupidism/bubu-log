'use client'

import type { MouseEvent, ReactNode, TouchEvent } from 'react'
import { useMemo, useRef } from 'react'

export interface TimelineGridProps {
  date: Date
  hourHeight?: number
  showHalfHours?: boolean
  roundToMinutes?: number
  onLongPressBlank?: (time: Date) => void
  className?: string
  children?: ReactNode
}

const DEFAULT_HOUR_HEIGHT = 60

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function TimelineGrid({
  date,
  hourHeight = DEFAULT_HOUR_HEIGHT,
  showHalfHours = false,
  roundToMinutes = 5,
  onLongPressBlank,
  className,
  children,
}: TimelineGridProps) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), [])
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartPos = useRef<{ x: number; y: number; offsetY: number } | null>(null)

  const calculateTimeFromOffsetY = (offsetY: number) => {
    const minutes = (offsetY / hourHeight) * 60
    const roundedMinutes = Math.round(minutes / roundToMinutes) * roundToMinutes
    const clampedMinutes = Math.min(24 * 60, Math.max(0, roundedMinutes))
    const dayStart = startOfDay(date)
    return new Date(dayStart.getTime() + clampedMinutes * 60 * 1000)
  }

  const handleBlankLongPressStart = (e: TouchEvent | MouseEvent) => {
    if (!onLongPressBlank) return

    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()

    let clientX: number
    let clientY: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const offsetY = clientY - rect.top
    touchStartPos.current = { x: clientX, y: clientY, offsetY }

    longPressTimer.current = setTimeout(() => {
      const selectedTime = calculateTimeFromOffsetY(offsetY)
      onLongPressBlank(selectedTime)
    }, 500)
  }

  const handleBlankLongPressMove = (e: TouchEvent | MouseEvent) => {
    if (!touchStartPos.current) return

    let currentX: number
    let currentY: number

    if ('touches' in e) {
      currentX = e.touches[0].clientX
      currentY = e.touches[0].clientY
    } else {
      currentX = e.clientX
      currentY = e.clientY
    }

    const deltaX = Math.abs(currentX - touchStartPos.current.x)
    const deltaY = Math.abs(currentY - touchStartPos.current.y)

    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }

  const handleBlankLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
  }

  return (
    <div
      className={`relative ${className ?? ''}`.trim()}
      style={{ height: 24 * hourHeight }}
      onTouchStart={handleBlankLongPressStart}
      onTouchMove={handleBlankLongPressMove}
      onTouchEnd={handleBlankLongPressEnd}
      onTouchCancel={handleBlankLongPressEnd}
      onMouseDown={handleBlankLongPressStart}
      onMouseMove={handleBlankLongPressMove}
      onMouseUp={handleBlankLongPressEnd}
      onMouseLeave={handleBlankLongPressEnd}
    >
      {hours.map((hour) => (
        <div
          key={hour}
          className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700"
          style={{ top: hour * hourHeight }}
        >
          <span className="absolute -top-2.5 left-2 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 px-1">
            {hour.toString().padStart(2, '0')}:00
          </span>
        </div>
      ))}

      {showHalfHours &&
        hours.map((hour) => (
          <div
            key={`${hour}-half`}
            className="absolute left-12 right-0 border-t border-dashed border-gray-50 dark:border-gray-700/50"
            style={{ top: hour * hourHeight + hourHeight / 2 }}
          />
        ))}

      {children}
    </div>
  )
}
