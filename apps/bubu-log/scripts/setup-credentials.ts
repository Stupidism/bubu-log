import bcrypt from 'bcryptjs'
import { loadScriptEnv } from './utils/load-env'
import { getPayloadForScript } from './utils/payload-script'

loadScriptEnv({ preferPayloadDatabase: true })

async function main() {
  const payload = await getPayloadForScript()
  try {
    console.log('🔐 设置账号密码登录...')

    const hashedPassword = await bcrypt.hash('bubu20251030', 12)

    const defaultBabyResult = await payload.find({
      collection: 'babies',
      where: {
        name: {
          equals: '卜卜',
        },
      },
      limit: 1,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    const defaultBaby = defaultBabyResult.docs[0]
    if (!defaultBaby) {
      console.log('❌ 未找到默认宝宝（卜卜），请先运行数据迁移')
      return
    }

    const existingUsers = await payload.find({
      collection: 'app-users',
      where: {
        or: [
          {
            email: {
              equals: 'sunfeng32@qq.com',
            },
          },
          {
            username: {
              equals: 'sunfeng32',
            },
          },
        ],
      },
      limit: 1,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    let user = existingUsers.docs[0]
    if (user) {
      user = await payload.update({
        collection: 'app-users',
        id: String(user.id),
        data: {
          username: 'sunfeng32',
          password: hashedPassword,
        },
        depth: 0,
        overrideAccess: true,
      })
      console.log(`✅ 用户更新成功: ${user.username}`)
    } else {
      user = await payload.create({
        collection: 'app-users',
        data: {
          username: 'sunfeng32',
          name: 'dudu',
          email: 'sunfeng32@qq.com',
          password: hashedPassword,
          role: 'DAD',
        },
        depth: 0,
        overrideAccess: true,
      })
      console.log(`✅ 用户创建成功: ${user.username}`)
    }

    const bindingResult = await payload.find({
      collection: 'baby-users',
      where: {
        and: [
          {
            babyId: {
              equals: String(defaultBaby.id),
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

    if (bindingResult.docs[0]) {
      await payload.update({
        collection: 'baby-users',
        id: String(bindingResult.docs[0].id),
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
          babyId: String(defaultBaby.id),
          userId: String(user.id),
          isDefault: true,
        },
        depth: 0,
        overrideAccess: true,
      })
    }

    console.log(`✅ 用户已关联到宝宝: ${defaultBaby.name}`)
    console.log('\n🎉 设置完成！')
    console.log('📝 登录信息:')
    console.log('   用户名: sunfeng32')
    console.log('   密码: bubu20251030')
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
