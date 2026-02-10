import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 测试账户信息
export const TEST_USER = {
  username: 'e2e-test-user',
  password: 'test123456',
  email: 'e2e-test@example.com',
  name: 'E2E Test User',
}

export const TEST_BABY = {
  id: 'e2e-test-baby-id',
  name: '测试宝宝',
}

async function main() {
  console.log('🧪 开始创建测试数据...')

  // 1. 创建测试宝宝
  const baby = await prisma.baby.upsert({
    where: { id: TEST_BABY.id },
    update: {},
    create: {
      id: TEST_BABY.id,
      name: TEST_BABY.name,
      birthDate: new Date('2025-01-01'),
    },
  })
  console.log('✅ 创建测试宝宝:', baby.name)

  // 2. 创建测试用户
  const hashedPassword = await bcrypt.hash(TEST_USER.password, 12)
  
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: TEST_USER.email },
        { username: TEST_USER.username },
      ],
    },
  })

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: TEST_USER.username,
        password: hashedPassword,
        name: TEST_USER.name,
        email: TEST_USER.email,
      },
    })
    console.log(`✅ 更新测试用户: ${user.username}`)
  } else {
    user = await prisma.user.create({
      data: {
        username: TEST_USER.username,
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: hashedPassword,
        role: UserRole.DAD,
      },
    })
    console.log(`✅ 创建测试用户: ${user.username}`)
  }

  // 3. 关联测试用户和测试宝宝
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
  console.log('✅ 关联测试用户和测试宝宝')

  // 4. 创建一些测试活动数据（使用当前时间，确保活动在"今天"的时间线上显示）
  const now = new Date()
  const startTime = new Date(now)
  startTime.setHours(now.getHours() - 2, 0, 0, 0) // 2小时前
  const endTime = new Date(startTime)
  endTime.setMinutes(startTime.getMinutes() + 17)

  const activity = await prisma.activity.upsert({
    where: { id: 'e2e-test-activity-id' },
    update: {
      startTime: startTime,
      endTime: endTime,
      babyId: baby.id,
    },
    create: {
      id: 'e2e-test-activity-id',
      babyId: baby.id,
      type: 'BOTTLE',
      startTime: startTime,
      endTime: endTime,
      milkAmount: 30,
      notes: 'E2E测试活动',
    },
  })
  console.log('✅ 创建测试活动:', activity.id, '时间:', startTime.toLocaleString())

  console.log('\n🎉 测试数据创建完成！')
  console.log('📝 测试账户信息:')
  console.log(`   用户名: ${TEST_USER.username}`)
  console.log(`   密码: ${TEST_USER.password}`)
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
