import { redirect } from 'next/navigation'
import { type PageSearchParams, resolveDefaultScopedUrl } from '@/lib/auth/scoped-redirect'

type LegacyAuditsPageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}

export default async function LegacyAuditsPage({ searchParams }: LegacyAuditsPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  redirect(await resolveDefaultScopedUrl('/audits', resolvedSearchParams))
}
