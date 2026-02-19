import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type AdminUser = {
  id: string
  name: string | null
  username: string | null
  email: string | null
}

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  let session
  try {
    session = await auth()
  } catch (error) {
    console.error('Session error:', error)
    return null
  }

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
    },
  })

  if (!user || user.role !== UserRole.ADMIN) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
  }
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getCurrentAdminUser()

  if (!user) {
    throw new Error('Forbidden')
  }

  return user
}
