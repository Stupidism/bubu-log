'use client'

import {
  Moon,
  Utensils,
  Briefcase,
  Baby,
  Gamepad2,
  StickyNote,
  LucideIcon,
} from 'lucide-react'
import { EntryType } from '@/types/entry'

const iconMap: Record<EntryType, LucideIcon> = {
  [EntryType.SLEEP]: Moon,
  [EntryType.MEAL]: Utensils,
  [EntryType.WORK]: Briefcase,
  [EntryType.CHILDCARE]: Baby,
  [EntryType.ENTERTAINMENT]: Gamepad2,
  [EntryType.OTHER]: StickyNote,
}

interface EntryIconProps {
  type: EntryType
  size?: number
  className?: string
}

export function EntryIcon({ type, size = 20, className }: EntryIconProps) {
  const Icon = iconMap[type]
  if (!Icon) return null
  return <Icon size={size} className={className} />
}
