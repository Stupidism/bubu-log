'use client'

import { Plus } from 'lucide-react'

interface EntryFabProps {
  onClick: () => void
}

export function EntryFab({ onClick }: EntryFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fab-button fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all active:scale-95"
    >
      <Plus size={24} />
    </button>
  )
}
