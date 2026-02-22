import { loadScriptEnv } from './utils/load-env'
import { getPayloadForScript } from './utils/payload-script'
import { Pool } from 'pg'

loadScriptEnv({ preferPayloadDatabase: true })

const databaseURL = process.env.DATABASE_URL
if (!databaseURL) {
  throw new Error('DATABASE_URL is required')
}

async function columnExists(pool: Pool, table: string, column: string) {
  const result = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
      ) AS exists
    `,
    [table, column]
  )

  return Boolean(result.rows[0]?.exists)
}

async function normalizeLegacyColumns(pool: Pool) {
  const renames: Array<{ table: string; from: string; to: string }> = [
    { table: 'BabyUser', from: 'baby_id_id', to: 'baby_id' },
    { table: 'BabyUser', from: 'user_id_id', to: 'user_id' },
  ]

  for (const item of renames) {
    const fromExists = await columnExists(pool, item.table, item.from)
    const toExists = await columnExists(pool, item.table, item.to)

    if (!fromExists || toExists) {
      continue
    }

    await pool.query(`ALTER TABLE "${item.table}" RENAME COLUMN "${item.from}" TO "${item.to}"`)
    console.log(`🔧 Renamed ${item.table}.${item.from} -> ${item.to}`)
  }
}

async function main() {
  process.env.PAYLOAD_MIGRATING = 'true'

  const pool = new Pool({ connectionString: databaseURL })
  const payload = await getPayloadForScript()

  try {
    await payload.db.migrate({})
    await normalizeLegacyColumns(pool)
    console.log('✅ Payload migrations completed')
  } finally {
    await pool.end()
    await payload.destroy()
  }
}

main()
  .catch((error) => {
    console.error('❌ Payload migration failed:', error)
    process.exitCode = 1
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0)
  })
