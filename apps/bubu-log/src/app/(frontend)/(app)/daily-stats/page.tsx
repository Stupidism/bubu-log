import { redirect } from 'next/navigation'
import { type PageSearchParams, resolveDefaultScopedUrl } from '@/lib/auth/scoped-redirect'

type LegacyDailyStatsPageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}

export default async function LegacyDailyStatsPage({ searchParams }: LegacyDailyStatsPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  redirect(await resolveDefaultScopedUrl('/daily-stats', resolvedSearchParams))
}
