import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { AppUsers } from './src/payload/collections/AppUsers'
import { Babies } from './src/payload/collections/Babies'
import { BabyUsers } from './src/payload/collections/BabyUsers'
import { CMSAdmins } from './src/payload/collections/CMSAdmins'

const databaseURL =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres'

const config = buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'bubu-admin-dev-secret-change-me',
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL,
    },
  }),
  admin: {
    user: CMSAdmins.slug,
    importMap: {
      autoGenerate: false,
    },
  },
  collections: [CMSAdmins, AppUsers, Babies, BabyUsers],
  onInit: async (payload) => {
    const email = process.env.PAYLOAD_ADMIN_EMAIL?.trim().toLowerCase()
    const password = process.env.PAYLOAD_ADMIN_PASSWORD?.trim()
    const displayName = process.env.PAYLOAD_ADMIN_NAME?.trim() || '运营管理员'

    if (!email || !password) {
      payload.logger.info(
        'Payload admin bootstrap skipped: set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD to enable auto creation.'
      )
      return
    }

    const existing = await payload.find({
      collection: CMSAdmins.slug,
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
      collection: CMSAdmins.slug,
      data: {
        email,
        password,
        displayName,
      },
      overrideAccess: true,
    })

    payload.logger.info(`Payload admin user created: ${email}`)
  },
})

export default config
