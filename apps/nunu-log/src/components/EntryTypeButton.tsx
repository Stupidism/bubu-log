'use client'

import { EntryType, EntryTypeLabels } from '@/types/entry'
import { EntryIcon } from './EntryIcon'

interface EntryTypeButtonProps {
  type: EntryType
  selected?: boolean
  onClick: (type: EntryType) => void
}

export function EntryTypeButton({ type, selected, onClick }: EntryTypeButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(type)}
      className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-2 transition-all ${
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-white/80 text-gray-600 hover:border-primary/60'
      }`}
    >
      <EntryIcon type={type} size={22} className={selected ? 'text-primary' : 'text-gray-500'} />
      <span className="text-xs font-medium">{EntryTypeLabels[type]}</span>
    </button>
  )
}
