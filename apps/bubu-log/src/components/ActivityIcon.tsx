'use client'

import {
  Moon,
  Baby,
  Heart,
  Milk,
  CircleDot,
  Activity,
  Wind,
  Bath,
  SunMedium,
  BookOpen,
  ArrowUp,
  ArrowUpFromLine,
  RotateCcw,
  Pill,
  Droplets,
  LucideIcon,
} from 'lucide-react'
import { ActivityType } from '@/types/activity'

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SLEEP]: Moon,
  [ActivityType.DIAPER]: Baby,
  [ActivityType.BREASTFEED]: Heart,
  [ActivityType.BOTTLE]: Milk,
  [ActivityType.PUMP]: CircleDot,
  [ActivityType.HEAD_LIFT]: ArrowUp,
  [ActivityType.PASSIVE_EXERCISE]: Activity,
  [ActivityType.ROLL_OVER]: RotateCcw,
  [ActivityType.PULL_TO_SIT]: ArrowUpFromLine,
  [ActivityType.GAS_EXERCISE]: Wind,
  [ActivityType.BATH]: Bath,
  [ActivityType.OUTDOOR]: SunMedium,
  [ActivityType.EARLY_EDUCATION]: BookOpen,
  [ActivityType.SUPPLEMENT]: Pill,
  [ActivityType.SPIT_UP]: Droplets,
}

interface ActivityIconProps {
  type: ActivityType | string
  size?: number
  className?: string
}

export function ActivityIcon({ type, size = 24, className = '' }: ActivityIconProps) {
  const Icon = iconMap[type as ActivityType]
  if (!Icon) {
    return null
  }
  return <Icon size={size} className={className} />
}
