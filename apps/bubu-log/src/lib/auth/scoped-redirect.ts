import { buildBabyScopedPath } from '@/lib/baby-scope'
import { getCurrentBaby } from '@/lib/auth/get-current-baby'

export type PageSearchParams = Record<string, string | string[] | undefined>

function toQueryString(searchParams: PageSearchParams | undefined): string {
  if (!searchParams) {
    return ''
  }

  const urlSearchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          urlSearchParams.append(key, item)
        }
      }
      continue
    }

    if (typeof value === 'string') {
      urlSearchParams.set(key, value)
    }
  }

  return urlSearchParams.toString()
}

export async function resolveDefaultScopedUrl(
  subPath = '',
  searchParams?: PageSearchParams
): Promise<string> {
  const context = await getCurrentBaby()
  if (!context) {
    return '/login'
  }

  const basePath = buildBabyScopedPath(context.baby.id, subPath)
  const queryString = toQueryString(searchParams)
  return queryString ? `${basePath}?${queryString}` : basePath
}
