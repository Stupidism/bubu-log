import { redirect } from 'next/navigation'
import { buildBabyScopedPath } from '@/lib/baby-scope'

type LegacyStatsTrendsPageProps = {
  params: Promise<{ babyId: string }> | { babyId: string }
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}

export default async function LegacyStatsTrendsPage({
  params,
  searchParams,
}: LegacyStatsTrendsPageProps) {
  const resolvedParams = await Promise.resolve(params)
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  const nextPath = buildBabyScopedPath(resolvedParams.babyId, '/daily-stats')
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item)
      }
      continue
    }

    query.set(key, value)
  }

  const queryString = query.toString()
  redirect(queryString ? `${nextPath}?${queryString}` : nextPath)
}
