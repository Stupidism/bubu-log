import { defineConfig } from 'prisma/config'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const configDir = dirname(fileURLToPath(import.meta.url))

function loadEnvFromFile(fileName: string) {
  const fullPath = join(configDir, fileName)
  if (!existsSync(fullPath)) {
    return
  }

  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(fullPath)
    return
  }

  const rawContent = readFileSync(fullPath, 'utf8')
  for (const line of rawContent.split(/\r?\n/)) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const equalSignIndex = trimmedLine.indexOf('=')
    if (equalSignIndex < 1) {
      continue
    }

    const key = trimmedLine.slice(0, equalSignIndex).trim()
    if (key in process.env) {
      continue
    }

    let value = trimmedLine.slice(equalSignIndex + 1).trim()
    const hasSingleQuote =
      value.length >= 2 && value.startsWith("'") && value.endsWith("'")
    const hasDoubleQuote =
      value.length >= 2 && value.startsWith('"') && value.endsWith('"')
    if (hasSingleQuote || hasDoubleQuote) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

// Keep external environment variables as highest priority.
// For local files, .env.local takes precedence over .env.
loadEnvFromFile('.env.local')
loadEnvFromFile('.env')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
