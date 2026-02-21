import { auth } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload/client'
import { toDate } from '@/lib/payload/utils'

export type CurrentBaby = {
  id: string
  name: string
  avatarUrl: string | null
  birthDate: Date | null
}

export type CurrentUser = {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export type AuthContext = {
  user: CurrentUser
  baby: CurrentBaby
}

type BabyDoc = {
  id: string
  name: string
  avatarUrl?: string | null
  birthDate?: string | Date | null
}

type BabyUserDoc = {
  id: string
  babyId: string | BabyDoc
  isDefault?: boolean | null
}

async function resolveBabyFromBinding(binding: BabyUserDoc): Promise<BabyDoc | null> {
  if (typeof binding.babyId === 'object' && binding.babyId) {
    return binding.babyId
  }

  const babyId = typeof binding.babyId === 'string' ? binding.babyId : null
  if (!babyId) {
    return null
  }

  const payload = await getPayloadClient()
  const baby = await payload.findByID({
    collection: 'babies',
    id: babyId,
    depth: 0,
    overrideAccess: true,
  })

  return (baby as BabyDoc | null) || null
}

/**
 * 获取当前登录用户的默认宝宝
 * 如果用户未登录或没有关联的宝宝，返回 null
 */
export async function getCurrentBaby(): Promise<AuthContext | null> {
  let session
  try {
    session = await auth()
  } catch (error) {
    console.error('Session error:', error)
    return null
  }

  if (!session?.user || !(session.user as { id?: string }).id) {
    return null
  }

  const userId = (session.user as { id: string }).id
  const payload = await getPayloadClient()

  const defaultBinding = await payload.find({
    collection: 'baby-users',
    where: {
      and: [
        {
          userId: {
            equals: userId,
          },
        },
        {
          isDefault: {
            equals: true,
          },
        },
      ],
    },
    limit: 1,
    pagination: false,
    depth: 1,
    sort: 'createdAt',
    overrideAccess: true,
  })

  let binding = (defaultBinding.docs[0] as BabyUserDoc | undefined) ?? null

  if (!binding) {
    const firstBinding = await payload.find({
      collection: 'baby-users',
      where: {
        userId: {
          equals: userId,
        },
      },
      limit: 1,
      pagination: false,
      depth: 1,
      sort: 'createdAt',
      overrideAccess: true,
    })

    binding = (firstBinding.docs[0] as BabyUserDoc | undefined) ?? null
  }

  if (!binding) {
    return null
  }

  const babyDoc = await resolveBabyFromBinding(binding)
  if (!babyDoc) {
    return null
  }

  return {
    user: {
      id: userId,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
    baby: {
      id: babyDoc.id,
      name: babyDoc.name,
      avatarUrl: babyDoc.avatarUrl ?? null,
      birthDate: toDate(babyDoc.birthDate),
    },
  }
}

/**
 * 要求用户登录并有关联的宝宝
 * 如果不满足条件，抛出错误
 */
export async function requireAuth(): Promise<AuthContext> {
  const context = await getCurrentBaby()

  if (!context) {
    throw new Error('Unauthorized')
  }

  return context
}
