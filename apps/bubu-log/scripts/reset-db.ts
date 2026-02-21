import { Pool } from 'pg'
import { loadScriptEnv } from './utils/load-env'

loadScriptEnv({ preferPayloadDatabase: true })

const databaseURL = process.env.DATABASE_URL
if (!databaseURL) {
  throw new Error('DATABASE_URL is required')
}

async function main() {
  const pool = new Pool({ connectionString: databaseURL })
  try {
    console.log('🧹 Reset database schema...')
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE')
    await pool.query('CREATE SCHEMA public')
    await pool.query('GRANT ALL ON SCHEMA public TO PUBLIC')
    console.log('✅ Database schema reset complete')
  } finally {
    await pool.end()
  }
}

main()
  .catch((error) => {
    console.error('❌ Failed to reset database:', error)
    process.exit(1)
  })
