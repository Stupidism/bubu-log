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
  LucideIcon,
} from 'lucide-react'
import { ActivityType } from '@/types/activity'

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SLEEP_START]: Moon,
  [ActivityType.SLEEP_END]: Sun,
  [ActivityType.DIAPER]: Baby,
  [ActivityType.BREASTFEED_START]: Heart,
  [ActivityType.BREASTFEED_END]: Heart,
  [ActivityType.BOTTLE_START]: Milk,
  [ActivityType.BOTTLE_END]: Milk,
  [ActivityType.PASSIVE_EXERCISE]: Activity,
  [ActivityType.GAS_EXERCISE]: Wind,
  [ActivityType.BATH]: Bath,
  [ActivityType.OUTDOOR]: SunMedium,
  [ActivityType.EARLY_EDUCATION]: BookOpen,
}

interface ActivityIconProps {
  type: ActivityType
  size?: number
  className?: string
}

export function ActivityIcon({ type, size = 24, className = '' }: ActivityIconProps) {
  const Icon = iconMap[type]
  return <Icon size={size} className={className} />
}

