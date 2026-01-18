'use client'

import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { ActivityIcon } from './ActivityIcon'
import { Loader2 } from 'lucide-react'

interface ActivityButtonProps {
  type: ActivityType
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'default' | 'sleep' | 'feed' | 'diaper' | 'activity'
}

const variantStyles = {
  default: 'bg-white hover:bg-gray-50 text-gray-800',
  sleep: 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white',
  feed: 'bg-gradient-to-br from-pink-400 to-rose-500 text-white',
  diaper: 'bg-gradient-to-br from-cyan-400 to-teal-500 text-white',
  activity: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
}

export function ActivityButton({ type, onClick, disabled, loading, variant = 'default' }: ActivityButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`big-button ${variantStyles[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <Loader2 size={32} className="mb-1 animate-spin" />
      ) : (
        <ActivityIcon type={type} size={32} className="mb-1" />
      )}
      <span className="text-base font-semibold">{ActivityTypeLabels[type]}</span>
    </button>
  )
}
