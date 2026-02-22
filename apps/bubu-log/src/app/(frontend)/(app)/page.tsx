import { redirect } from 'next/navigation'
import { type PageSearchParams, resolveDefaultScopedUrl } from '@/lib/auth/scoped-redirect'

type LegacyHomePageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}

export default async function LegacyHomePage({ searchParams }: LegacyHomePageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  redirect(await resolveDefaultScopedUrl('', resolvedSearchParams))
}
