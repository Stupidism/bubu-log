import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { AppUsers } from './src/payload/collections/AppUsers.ts'
import { Activities } from './src/payload/collections/Activities.ts'
import { AuditLogs } from './src/payload/collections/AuditLogs.ts'
import { Babies } from './src/payload/collections/Babies.ts'
import { BabyUsers } from './src/payload/collections/BabyUsers.ts'
import { CMSAdmins } from './src/payload/collections/CMSAdmins.ts'
import { DailyStats } from './src/payload/collections/DailyStats.ts'

const normalizePGSSLMode = (url: string) => {
  if (!url) {
    return url
  }

  if (url.includes('sslmode=require')) {
    return url.replace(/sslmode=require/g, 'sslmode=verify-full')
  }

  return url
}

const databaseURL =
  normalizePGSSLMode(
    process.env.PAYLOAD_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      'postgresql://postgres:postgres@127.0.0.1:5432/postgres'
  )
const allowSchemaPush =
  process.env.PAYLOAD_DB_PUSH === 'true' &&
  process.env.PAYLOAD_ALLOW_DESTRUCTIVE_PUSH === 'true'

const CMS_ADMINS_COLLECTION = 'cms-admins' as const

const config = buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'bubu-log-payload-dev-secret-change-me',
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL,
    },
    // Prevent accidental schema push in app runtime.
    // Enable only for explicit one-off environments.
    push: allowSchemaPush,
  }),
  admin: {
    user: CMS_ADMINS_COLLECTION,
    importMap: {
      autoGenerate: false,
    },
  },
  collections: [CMSAdmins, AppUsers, Babies, BabyUsers, Activities, DailyStats, AuditLogs],
})

export default config
