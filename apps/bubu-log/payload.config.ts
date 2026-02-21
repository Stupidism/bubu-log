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
  onInit: async (payload) => {
    const explicitEmail = process.env.PAYLOAD_ADMIN_EMAIL?.trim().toLowerCase()
    const explicitPassword = process.env.PAYLOAD_ADMIN_PASSWORD?.trim()

    const fallbackEmail = process.env.ADMIN_INIT_EMAIL?.trim().toLowerCase()
    const fallbackPassword = process.env.ADMIN_INIT_PASSWORD?.trim()
    const fallbackName = process.env.ADMIN_INIT_NAME?.trim()

    const isNonProduction = process.env.NODE_ENV !== 'production'
    const email =
      explicitEmail ||
      fallbackEmail ||
      (isNonProduction ? 'payload-admin@local.dev' : undefined)
    const password =
      explicitPassword ||
      fallbackPassword ||
      (isNonProduction ? 'ChangeMe_123456' : undefined)
    const displayName = process.env.PAYLOAD_ADMIN_NAME?.trim() || fallbackName || '运营管理员'

    if (!email || !password) {
      payload.logger.info(
        'Payload admin bootstrap skipped: set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD to enable auto creation.'
      )
      return
    }

    if (!explicitEmail || !explicitPassword) {
      payload.logger.warn(
        'Payload admin bootstrap is using fallback credentials. Set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD to avoid create-first-user runtime issues.'
      )
    }

    try {
      const existing = await payload.find({
        collection: CMS_ADMINS_COLLECTION,
        where: {
          email: {
            equals: email,
          },
        },
        limit: 1,
        overrideAccess: true,
      })

      if (existing.totalDocs > 0) {
        return
      }

      await payload.create({
        collection: CMS_ADMINS_COLLECTION,
        data: {
          email,
          password,
          displayName,
        },
        overrideAccess: true,
      })

      payload.logger.info(`Payload admin user created: ${email}`)
    } catch (error) {
      payload.logger.warn(
        'Payload admin bootstrap skipped because CMS tables are not initialized yet. Run pnpm db:migrate on the target branch database first.'
      )
      payload.logger.debug(error)
    }
  },
})

export default config
