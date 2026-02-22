import { redirect } from 'next/navigation'
import { type PageSearchParams, resolveDefaultScopedUrl } from '@/lib/auth/scoped-redirect'

type LegacySettingsPageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}

export default async function LegacySettingsPage({ searchParams }: LegacySettingsPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  redirect(await resolveDefaultScopedUrl('/settings', resolvedSearchParams))
}
