'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { buildBabyScopedPath } from '@/lib/baby-scope'

interface BackHomeButtonProps {
  babyId: string
}

export function BackHomeButton({ babyId }: BackHomeButtonProps) {
  return (
    <Link
      href={buildBabyScopedPath(babyId)}
      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      aria-label="返回首页"
      data-testid="back-home-button"
    >
      <ChevronLeft size={16} />
      首页
    </Link>
  )
}
