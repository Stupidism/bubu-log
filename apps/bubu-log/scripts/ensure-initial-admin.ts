import bcrypt from 'bcryptjs'
import type { Payload } from 'payload'

type EnsureInitialAdminResult = {
  id: string
  username: string
  password: string
  name: string
  email: string | null
}

type EnsureInitialAdminOptions = {
  verbose?: boolean
}

async function findUserByUsername(payload: Payload, username: string) {
  const result = await payload.find({
    collection: 'app-users',
    where: {
      username: {
        equals: username,
      },
    },
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  return (result.docs[0] as { id: string } | undefined) ?? null
}

async function findUserByEmail(payload: Payload, email: string) {
  const result = await payload.find({
    collection: 'app-users',
    where: {
      email: {
        equals: email,
      },
    },
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  return (result.docs[0] as { id: string; username?: string | null } | undefined) ?? null
}

export async function ensureInitialAdmin(
  payload: Payload,
  options: EnsureInitialAdminOptions = {}
): Promise<EnsureInitialAdminResult> {
  const username = process.env.ADMIN_INIT_USERNAME?.trim() || 'admin'
  const password = process.env.ADMIN_INIT_PASSWORD?.trim() || 'admin123456'
  const name = process.env.ADMIN_INIT_NAME?.trim() || '系统管理员'
  const email = process.env.ADMIN_INIT_EMAIL?.trim() || null

  if (password.length < 8) {
    throw new Error('ADMIN_INIT_PASSWORD must be at least 8 characters')
  }

  const existingUserByUsername = await findUserByUsername(payload, username)

  if (email) {
    const existingUserByEmail = await findUserByEmail(payload, email)

    if (existingUserByEmail && existingUserByEmail.id !== existingUserByUsername?.id) {
      throw new Error(`ADMIN_INIT_EMAIL is already used by another account: ${email}`)
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const adminUser = existingUserByUsername
    ? await payload.update({
        collection: 'app-users',
        id: existingUserByUsername.id,
        data: {
          name,
          password: hashedPassword,
          role: 'ADMIN',
          ...(email ? { email } : {}),
        },
        depth: 0,
        overrideAccess: true,
      })
    : await payload.create({
        collection: 'app-users',
        data: {
          username,
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
        },
        depth: 0,
        overrideAccess: true,
      })

  if (options.verbose) {
    console.log('✅ 初始管理员账号已就绪')
    console.log(`   用户名: ${username}`)
    console.log(`   密码: ${password}`)
    if (email) {
      console.log(`   邮箱: ${email}`)
    }
  }

  return {
    id: String(adminUser.id),
    username,
    password,
    name,
    email,
  }
}
