import { buildBabyScopedPath } from '@/lib/baby-scope'
import { asAuthFailure, requireAuth } from '@/lib/auth/get-current-baby'

export type PageSearchParams = Record<string, string | string[] | undefined>
const NO_BABY_PLACEHOLDER_ID = '__no_baby__'

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
  let basePath = '/login'

  try {
    const context = await requireAuth()
    basePath = buildBabyScopedPath(context.baby.id, subPath)
  } catch (error) {
    const failure = asAuthFailure(error)
    if (!failure || failure.code === 'UNAUTHORIZED') {
      basePath = '/login'
    } else if (failure.code === 'NO_BABY_BINDING' || failure.code === 'BABY_NOT_FOUND') {
      // Route authenticated users without available baby binding into the in-app no-baby state.
      basePath = buildBabyScopedPath(NO_BABY_PLACEHOLDER_ID, subPath)
    }
  }

  const queryString = toQueryString(searchParams)
  return queryString ? `${basePath}?${queryString}` : basePath
}
