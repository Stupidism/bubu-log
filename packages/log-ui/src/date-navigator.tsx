'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

export type DateNavigatorVariant = 'card' | 'inline'

interface DateNavigatorProps {
  label: string
  subLabel?: string
  onPrev: () => void
  onNext: () => void
  disablePrev?: boolean
  disableNext?: boolean
  onToday?: () => void
  showToday?: boolean
  todayLabel?: string
  variant?: DateNavigatorVariant
  className?: string
  prevTestId?: string
  nextTestId?: string
  todayTestId?: string
}

export function DateNavigator({
  label,
  subLabel,
  onPrev,
  onNext,
  disablePrev = false,
  disableNext = false,
  onToday,
  showToday = false,
  todayLabel = '回到今天',
  variant = 'card',
  className,
  prevTestId,
  nextTestId,
  todayTestId,
}: DateNavigatorProps) {
  const containerClass =
    variant === 'card'
      ? 'flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 shadow-sm'
      : 'flex items-center justify-center gap-2'

  const buttonClass =
    variant === 'card'
      ? 'rounded-full p-2 text-gray-500 hover:bg-gray-100'
      : 'p-1.5 rounded-full text-gray-500 hover:bg-gray-100'

  return (
    <div className={`${containerClass} ${className ?? ''}`.trim()}>
      <button
        type="button"
        onClick={onPrev}
        disabled={disablePrev}
        className={`${buttonClass} ${disablePrev ? 'opacity-30 cursor-not-allowed' : ''}`}
        data-testid={prevTestId}
      >
        <ChevronLeft size={20} />
      </button>
      <div className="text-center">
        <p className={variant === 'card' ? 'text-sm font-semibold text-gray-800' : 'text-base font-bold text-gray-800'}>
          {label}
        </p>
        {subLabel && (
          <p className={variant === 'card' ? 'text-xs text-gray-500' : 'text-xs text-gray-400'}>
            {subLabel}
          </p>
        )}
        {showToday && onToday && (
          <button
            type="button"
            onClick={onToday}
            className="text-xs text-primary"
            data-testid={todayTestId}
          >
            {todayLabel}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={disableNext}
        className={`${buttonClass} ${disableNext ? 'opacity-30 cursor-not-allowed' : ''}`}
        data-testid={nextTestId}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
