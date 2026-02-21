import fs from 'node:fs'
import path from 'node:path'

function normalizePGSSLMode(url: string): string {
  if (url.includes('sslmode=require')) {
    return url.replace(/sslmode=require/g, 'sslmode=verify-full')
  }
  return url
}

function unquoteEnvValue(rawValue: string): string {
  const trimmed = rawValue.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

export function loadScriptEnv(options?: { preferPayloadDatabase?: boolean }) {
  const envCandidates = ['.env', '.env.local', '.env.development.local']

  for (const filename of envCandidates) {
    const fullPath = path.resolve(process.cwd(), filename)
    if (!fs.existsSync(fullPath)) {
      continue
    }

    const content = fs.readFileSync(fullPath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const equalsIndex = trimmed.indexOf('=')
      if (equalsIndex <= 0) {
        continue
      }

      const key = trimmed.slice(0, equalsIndex).trim()
      const value = unquoteEnvValue(trimmed.slice(equalsIndex + 1))

      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  }

  if (options?.preferPayloadDatabase) {
    const preferredDatabaseURL = process.env.PAYLOAD_DATABASE_URL || process.env.DATABASE_URL
    if (!preferredDatabaseURL) {
      throw new Error('DATABASE_URL is missing. Please set PAYLOAD_DATABASE_URL or DATABASE_URL.')
    }
    process.env.DATABASE_URL = preferredDatabaseURL
  }

  if (!process.env.DATABASE_URL && process.env.PAYLOAD_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.PAYLOAD_DATABASE_URL
  }

  if (!process.env.DATABASE_URL_UNPOOLED && process.env.DATABASE_URL) {
    process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL
  }

  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = normalizePGSSLMode(process.env.DATABASE_URL)
  }
  if (process.env.DATABASE_URL_UNPOOLED) {
    process.env.DATABASE_URL_UNPOOLED = normalizePGSSLMode(process.env.DATABASE_URL_UNPOOLED)
  }
  if (process.env.PAYLOAD_DATABASE_URL) {
    process.env.PAYLOAD_DATABASE_URL = normalizePGSSLMode(process.env.PAYLOAD_DATABASE_URL)
  }
}
