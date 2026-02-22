import { redirect } from 'next/navigation'
import { type PageSearchParams, resolveDefaultScopedUrl } from '@/lib/auth/scoped-redirect'

type LegacyBabiesPageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}

export default async function LegacyBabiesPage({ searchParams }: LegacyBabiesPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  redirect(await resolveDefaultScopedUrl('/babies', resolvedSearchParams))
}
