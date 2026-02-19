import { PrismaClient } from '@prisma/client'
import { ensureInitialAdmin } from './ensure-initial-admin'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 初始化管理员账号...')
  await ensureInitialAdmin(prisma, { verbose: true })
  console.log('\n🎉 管理员账号初始化完成')
}

main()
  .catch((error) => {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
