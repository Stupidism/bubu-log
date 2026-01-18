'use client'

import {
  Moon,
  Sun,
  Baby,
  Heart,
  Milk,
  Activity,
  Wind,
  Bath,
  SunMedium,
  BookOpen,
  ArrowUp,
  LucideIcon,
} from 'lucide-react'
import { ActivityType } from '@/types/activity'

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SLEEP]: Moon,
  [ActivityType.DIAPER]: Baby,
  [ActivityType.BREASTFEED]: Heart,
  [ActivityType.BOTTLE]: Milk,
  // deprecated types for backward compatibility
  [ActivityType.SLEEP_START]: Moon,
  [ActivityType.SLEEP_END]: Sun,
  [ActivityType.BREASTFEED_START]: Heart,
  [ActivityType.BREASTFEED_END]: Heart,
  [ActivityType.BOTTLE_START]: Milk,
  [ActivityType.BOTTLE_END]: Milk,
  [ActivityType.HEAD_LIFT]: ArrowUp,
  [ActivityType.PASSIVE_EXERCISE]: Activity,
  [ActivityType.GAS_EXERCISE]: Wind,
  [ActivityType.BATH]: Bath,
  [ActivityType.OUTDOOR]: SunMedium,
  [ActivityType.EARLY_EDUCATION]: BookOpen,
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
