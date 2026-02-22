'use client'

import { useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bubu-log/ui/dropdown-menu'
import { Baby, Check, ChevronDown, Loader2 } from 'lucide-react'
import { replaceBabyIdInPathname } from '@/lib/baby-scope'

export type BabySwitcherItem = {
  id: string
  name: string
  avatarUrl: string | null
  isDefault: boolean
}

interface BabySwitcherProps {
  babies: BabySwitcherItem[]
  currentBabyId: string
  isLoading?: boolean
}

function AvatarContent({
  avatarUrl,
  isLoading,
}: {
  avatarUrl: string | null
  isLoading: boolean
}) {
  if (isLoading) {
    return <Loader2 size={18} className="animate-spin text-primary" />
  }

  if (avatarUrl) {
    return <img src={avatarUrl} alt="宝宝头像" className="w-full h-full object-cover" />
  }

  return <Baby size={18} className="text-primary" />
}

export function BabySwitcher({ babies, currentBabyId, isLoading = false }: BabySwitcherProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentBaby = useMemo(
    () => babies.find((item) => item.id === currentBabyId) ?? babies[0] ?? null,
    [babies, currentBabyId]
  )

  const disabled = isLoading || babies.length === 0
  const showDropdown = babies.length > 1

  const handleSwitch = (targetBabyId: string) => {
    if (!targetBabyId || targetBabyId === currentBabyId) {
      return
    }

    const nextPath = replaceBabyIdInPathname(pathname, targetBabyId)
    const queryString = searchParams.toString()
    window.location.replace(queryString ? `${nextPath}?${queryString}` : nextPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || !showDropdown}>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-2.5 py-1.5 shadow-sm"
          data-testid="baby-switcher-trigger"
          aria-label="切换宝宝"
        >
          <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white bg-gradient-to-br from-pink-100 to-orange-100">
            <AvatarContent avatarUrl={currentBaby?.avatarUrl ?? null} isLoading={isLoading} />
          </span>
          <span className="max-w-20 truncate text-sm font-medium text-gray-700">
            {currentBaby?.name || '宝宝'}
          </span>
          {showDropdown && <ChevronDown size={16} className="text-gray-500" />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>切换宝宝</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {babies.map((baby) => (
          <DropdownMenuItem
            key={baby.id}
            onClick={() => handleSwitch(baby.id)}
            className="flex items-center justify-between gap-3"
            data-testid={`baby-switcher-item-${baby.id}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-100 to-orange-100">
                {baby.avatarUrl ? (
                  <img src={baby.avatarUrl} alt={baby.name} className="h-full w-full object-cover" />
                ) : (
                  <Baby size={14} className="text-primary" />
                )}
              </span>
              <span className="truncate text-sm">
                {baby.name}
                {baby.isDefault ? '（默认）' : ''}
              </span>
            </span>
            {baby.id === currentBabyId && <Check size={14} className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
