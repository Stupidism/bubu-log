import { loadScriptEnv } from './utils/load-env'
import { getPayloadForScript } from './utils/payload-script'

loadScriptEnv({ preferPayloadDatabase: true })

async function main() {
  process.env.PAYLOAD_MIGRATING = 'true'

  const payload = await getPayloadForScript()

  try {
    await payload.db.migrate({})
    console.log('✅ Payload migrations completed')
  } finally {
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
