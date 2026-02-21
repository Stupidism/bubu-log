import { auth } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload/client'

export type AdminUser = {
  id: string
  name: string | null
  username: string | null
  email: string | null
}

type AppUserDoc = {
  id: string
  name?: string | null
  username?: string | null
  email?: string | null
  role?: string | null
}

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  let session
  try {
    session = await auth()
  } catch (error) {
    console.error('Session error:', error)
    return null
  }

  const userId = session?.user && (session.user as { id?: string }).id
  if (!userId) {
    return null
  }

  const payload = await getPayloadClient()

  let user: AppUserDoc | null = null
  try {
    const doc = await payload.findByID({
      collection: 'app-users',
      id: userId,
      depth: 0,
      overrideAccess: true,
    })

    user = doc as AppUserDoc
  } catch {
    user = null
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return {
    id: user.id,
    name: user.name ?? null,
    username: user.username ?? null,
    email: user.email ?? null,
  }
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getCurrentAdminUser()

  if (!user) {
    throw new Error('Forbidden')
  }

  return user
}
