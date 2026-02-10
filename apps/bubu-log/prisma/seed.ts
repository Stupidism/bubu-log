import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始初始化数据...')

  // 1. 创建宝宝 - 卜卜
  const baby = await prisma.baby.upsert({
    where: { id: 'bubu-baby-id' },
    update: {},
    create: {
      id: 'bubu-baby-id',
      name: '卜卜',
      birthDate: new Date('2025-01-01'), // 假设出生日期
    },
  })
  console.log('✅ 创建宝宝:', baby.name)

  // 2. 创建用户 - dudu（爸爸）
  const user = await prisma.user.upsert({
    where: { email: 'stupidism32@gmail.com' },
    update: {
      name: 'dudu',
      role: UserRole.DAD,
    },
    create: {
      id: 'dudu-user-id',
      name: 'dudu',
      email: 'stupidism32@gmail.com',
      role: UserRole.DAD,
    },
  })
  console.log('✅ 创建用户:', user.name, '(', user.email, ')')

  // 3. 关联宝宝和用户
  await prisma.babyUser.upsert({
    where: {
      babyId_userId: {
        babyId: baby.id,
        userId: user.id,
      },
    },
    update: {
      isDefault: true,
    },
    create: {
      babyId: baby.id,
      userId: user.id,
      isDefault: true,
    },
  })
  console.log('✅ 关联宝宝和用户')

  console.log('🎉 数据初始化完成!')
}

main()
  .catch((e) => {
    console.error('❌ 数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
