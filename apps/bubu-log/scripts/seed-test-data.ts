import bcrypt from 'bcryptjs'
import { loadScriptEnv } from './utils/load-env'
import { getPayloadForScript } from './utils/payload-script'

loadScriptEnv({ preferPayloadDatabase: true })

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
  const payload = await getPayloadForScript()
  try {
    console.log('🧪 开始创建测试数据...')

    const existingBaby = await payload
      .findByID({
        collection: 'babies',
        id: TEST_BABY.id,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null)

    const baby = existingBaby
      ? await payload.update({
          collection: 'babies',
          id: TEST_BABY.id,
          data: {
            name: TEST_BABY.name,
            birthDate: new Date('2025-01-01').toISOString(),
          },
          depth: 0,
          overrideAccess: true,
        })
      : await payload.create({
          collection: 'babies',
          data: {
            id: TEST_BABY.id,
            name: TEST_BABY.name,
            birthDate: new Date('2025-01-01').toISOString(),
            gender: 'OTHER',
          },
          depth: 0,
          overrideAccess: true,
        })
    console.log('✅ 创建测试宝宝:', baby.name)

    const hashedPassword = await bcrypt.hash(TEST_USER.password, 12)
    const existingUser = await payload.find({
      collection: 'app-users',
      where: {
        or: [
          {
            email: {
              equals: TEST_USER.email,
            },
          },
          {
            username: {
              equals: TEST_USER.username,
            },
          },
        ],
      },
      limit: 1,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    const user = existingUser.docs[0]
      ? await payload.update({
          collection: 'app-users',
          id: String(existingUser.docs[0].id),
          data: {
            username: TEST_USER.username,
            password: hashedPassword,
            name: TEST_USER.name,
            email: TEST_USER.email,
            role: 'DAD',
          },
          depth: 0,
          overrideAccess: true,
        })
      : await payload.create({
          collection: 'app-users',
          data: {
            username: TEST_USER.username,
            name: TEST_USER.name,
            email: TEST_USER.email,
            password: hashedPassword,
            role: 'DAD',
          },
          depth: 0,
          overrideAccess: true,
        })
    console.log(`✅ ${existingUser.docs[0] ? '更新' : '创建'}测试用户: ${user.username}`)

    const existingBinding = await payload.find({
      collection: 'baby-users',
      where: {
        and: [
          {
            babyId: {
              equals: String(baby.id),
            },
          },
          {
            userId: {
              equals: String(user.id),
            },
          },
        ],
      },
      limit: 1,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    if (existingBinding.docs[0]) {
      await payload.update({
        collection: 'baby-users',
        id: String(existingBinding.docs[0].id),
        data: {
          isDefault: true,
        },
        depth: 0,
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'baby-users',
        data: {
          babyId: String(baby.id),
          userId: String(user.id),
          isDefault: true,
        },
        depth: 0,
        overrideAccess: true,
      })
    }
    console.log('✅ 关联测试用户和测试宝宝')

    const now = new Date()
    const startTime = new Date(now)
    startTime.setHours(now.getHours() - 2, 0, 0, 0)
    const endTime = new Date(startTime)
    endTime.setMinutes(startTime.getMinutes() + 17)

    const existingActivity = await payload
      .findByID({
        collection: 'activities',
        id: 'e2e-test-activity-id',
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null)

    const activity = existingActivity
      ? await payload.update({
          collection: 'activities',
          id: 'e2e-test-activity-id',
          data: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            babyId: String(baby.id),
          },
          depth: 0,
          overrideAccess: true,
        })
      : await payload.create({
          collection: 'activities',
          data: {
            id: 'e2e-test-activity-id',
            babyId: String(baby.id),
            type: 'BOTTLE',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            milkAmount: 30,
            notes: 'E2E测试活动',
          },
          depth: 0,
          overrideAccess: true,
        })
    console.log('✅ 创建测试活动:', activity.id, '时间:', startTime.toLocaleString())

    console.log('\n🎉 测试数据创建完成！')
    console.log('📝 测试账户信息:')
    console.log(`   用户名: ${TEST_USER.username}`)
    console.log(`   密码: ${TEST_USER.password}`)
  } finally {
    await payload.destroy()
  }
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error)
    process.exitCode = 1
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0)
  })
