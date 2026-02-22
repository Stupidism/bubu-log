import { redirect } from 'next/navigation'
import { type PageSearchParams, resolveDefaultScopedUrl } from '@/lib/auth/scoped-redirect'

type LegacyTrendPageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}

export default async function LegacyTrendPage({ searchParams }: LegacyTrendPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  redirect(await resolveDefaultScopedUrl('/daily-stats', resolvedSearchParams))
}
