const BABY_PATH_PATTERN = /^\/b\/([^/]+)(?:\/|$)/

export const BABY_ID_QUERY_KEY = 'babyId'
export const BABY_ID_HEADER_KEY = 'x-baby-id'

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function normalizeBabyId(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  return trimmed
}

export function extractBabyIdFromPathname(pathname: string): string | null {
  const match = BABY_PATH_PATTERN.exec(pathname)
  if (!match) {
    return null
  }

  return normalizeBabyId(decodeSegment(match[1]))
}

export function buildBabyScopedPath(babyId: string, subPath = ''): string {
  const normalizedBabyId = normalizeBabyId(babyId)
  if (!normalizedBabyId) {
    throw new Error('Invalid babyId')
  }

  const normalizedSubPath =
    subPath.length === 0
      ? ''
      : subPath.startsWith('/')
        ? subPath
        : `/${subPath}`

  return `/b/${encodeURIComponent(normalizedBabyId)}${normalizedSubPath}`
}

export function replaceBabyIdInPathname(pathname: string, targetBabyId: string): string {
  const normalizedTarget = normalizeBabyId(targetBabyId)
  if (!normalizedTarget) {
    return pathname
  }

  if (!BABY_PATH_PATTERN.test(pathname)) {
    return buildBabyScopedPath(normalizedTarget)
  }

  const suffix = pathname.replace(BABY_PATH_PATTERN, '/')
  const normalizedSuffix = suffix === '/' ? '' : suffix
  return buildBabyScopedPath(normalizedTarget, normalizedSuffix)
}

export function withBabyIdOnApiPath(path: string, babyId: string | null | undefined): string {
  const normalizedBabyId = normalizeBabyId(babyId)
  if (!normalizedBabyId) {
    return path
  }

  let url: URL
  if (typeof window !== 'undefined') {
    url = new URL(path, window.location.origin)
  } else {
    url = new URL(path, 'http://localhost')
  }

  if (!url.pathname.startsWith('/api')) {
    return path
  }

  if (!url.searchParams.has(BABY_ID_QUERY_KEY)) {
    url.searchParams.set(BABY_ID_QUERY_KEY, normalizedBabyId)
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return url.toString()
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export function withCurrentBabyIdOnApiPath(path: string): string {
  if (typeof window === 'undefined') {
    return path
  }

  const babyId = extractBabyIdFromPathname(window.location.pathname)
  return withBabyIdOnApiPath(path, babyId)
}
