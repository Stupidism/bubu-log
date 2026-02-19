import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

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

export async function ensureInitialAdmin(
  prisma: PrismaClient,
  options: EnsureInitialAdminOptions = {}
): Promise<EnsureInitialAdminResult> {
  const username = process.env.ADMIN_INIT_USERNAME?.trim() || 'admin'
  const password = process.env.ADMIN_INIT_PASSWORD?.trim() || 'admin123456'
  const name = process.env.ADMIN_INIT_NAME?.trim() || '系统管理员'
  const email = process.env.ADMIN_INIT_EMAIL?.trim() || null

  if (password.length < 8) {
    throw new Error('ADMIN_INIT_PASSWORD must be at least 8 characters')
  }

  const existingUserByUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, email: true },
  })

  if (email) {
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true },
    })

    if (existingUserByEmail && existingUserByEmail.id !== existingUserByUsername?.id) {
      throw new Error(`ADMIN_INIT_EMAIL is already used by another account: ${email}`)
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const adminUser = existingUserByUsername
    ? await prisma.user.update({
        where: { id: existingUserByUsername.id },
        data: {
          name,
          password: hashedPassword,
          role: UserRole.ADMIN,
          ...(email ? { email } : {}),
        },
      })
    : await prisma.user.create({
        data: {
          username,
          name,
          email,
          password: hashedPassword,
          role: UserRole.ADMIN,
        },
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
    id: adminUser.id,
    username,
    password,
    name,
    email,
  }
}
