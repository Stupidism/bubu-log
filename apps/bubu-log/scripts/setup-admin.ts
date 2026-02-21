import { ensureInitialAdmin } from './ensure-initial-admin'
import { loadScriptEnv } from './utils/load-env'
import { getPayloadForScript } from './utils/payload-script'

loadScriptEnv({ preferPayloadDatabase: true })

async function main() {
  const payload = await getPayloadForScript()
  try {
    console.log('🔐 初始化管理员账号...')
    await ensureInitialAdmin(payload, { verbose: true })
    console.log('\n🎉 管理员账号初始化完成')
  } finally {
    await payload.destroy()
  }
}

main()
  .catch((error) => {
    console.error('❌ 初始化失败:', error)
    process.exitCode = 1
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0)
  })
