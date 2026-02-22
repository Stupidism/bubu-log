import { redirect } from 'next/navigation'
import { type PageSearchParams, resolveDefaultScopedUrl } from '@/lib/auth/scoped-redirect'

type LegacyActivitiesPageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}

export default async function LegacyActivitiesPage({ searchParams }: LegacyActivitiesPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  redirect(await resolveDefaultScopedUrl('/activities', resolvedSearchParams))
}
