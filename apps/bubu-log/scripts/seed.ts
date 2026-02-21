import type { Payload } from 'payload'
import { ensureInitialAdmin } from './ensure-initial-admin'
import { loadScriptEnv } from './utils/load-env'
import { getPayloadForScript } from './utils/payload-script'

loadScriptEnv({ preferPayloadDatabase: true })

async function upsertBaby(payload: Payload) {
  const existing = await payload.findByID({
    collection: 'babies',
    id: 'bubu-baby-id',
    depth: 0,
    overrideAccess: true,
  }).catch(() => null)

  if (existing) {
    return payload.update({
      collection: 'babies',
      id: 'bubu-baby-id',
      data: {
        name: '卜卜',
        birthDate: new Date('2025-01-01').toISOString(),
      },
      depth: 0,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection: 'babies',
    data: {
      id: 'bubu-baby-id',
      name: '卜卜',
      birthDate: new Date('2025-01-01').toISOString(),
      gender: 'OTHER',
    },
    depth: 0,
    overrideAccess: true,
  })
}

async function upsertDadUser(payload: Payload) {
  const existing = await payload.find({
    collection: 'app-users',
    where: {
      email: {
        equals: 'stupidism32@gmail.com',
      },
    },
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  const current = existing.docs[0]
  if (current) {
    const safeUsername = typeof current.username === 'string' && current.username ? current.username : 'dudu'
    return payload.update({
      collection: 'app-users',
      id: String(current.id),
      data: {
        username: safeUsername,
        name: 'dudu',
        role: 'DAD',
      },
      depth: 0,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection: 'app-users',
    data: {
      id: 'dudu-user-id',
      name: 'dudu',
      email: 'stupidism32@gmail.com',
      role: 'DAD',
      password: 'ChangeMe_123456',
    },
    depth: 0,
    overrideAccess: true,
  })
}

async function upsertBabyUserBinding(payload: Payload, babyId: string, userId: string) {
  const existing = await payload.find({
    collection: 'baby-users',
    where: {
      and: [
        {
          babyId: {
            equals: babyId,
          },
        },
        {
          userId: {
            equals: userId,
          },
        },
      ],
    },
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'baby-users',
      id: String(existing.docs[0].id),
      data: {
        isDefault: true,
      },
      depth: 0,
      overrideAccess: true,
    })
    return
  }

  await payload.create({
    collection: 'baby-users',
    data: {
      babyId,
      userId,
      isDefault: true,
    },
    depth: 0,
    overrideAccess: true,
  })
}

async function main() {
  const payload = await getPayloadForScript()
  try {
    console.log('🌱 开始初始化数据...')

    const baby = await upsertBaby(payload)
    console.log('✅ 创建宝宝:', baby.name)

    const user = await upsertDadUser(payload)
    console.log('✅ 创建用户:', user.name, '(', user.email, ')')

    await upsertBabyUserBinding(payload, String(baby.id), String(user.id))
    console.log('✅ 关联宝宝和用户')

    await ensureInitialAdmin(payload, { verbose: true })

    console.log('🎉 数据初始化完成!')
  } finally {
    await payload.destroy()
  }
}

main()
  .catch((error) => {
    console.error('❌ 数据初始化失败:', error)
    process.exitCode = 1
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0)
  })
