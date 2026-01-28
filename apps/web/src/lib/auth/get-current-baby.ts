import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

/**
 * 获取当前登录用户的默认宝宝
 * 如果用户未登录或没有关联的宝宝，返回 null
 */
export async function getCurrentBaby(): Promise<AuthContext | null> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  // 查找用户的默认宝宝
  const babyUser = await prisma.babyUser.findFirst({
    where: {
      userId: session.user.id,
      isDefault: true,
    },
    include: {
      baby: true,
    },
  })

  // 如果没有默认宝宝，查找第一个关联的宝宝
  if (!babyUser) {
    const firstBabyUser = await prisma.babyUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        baby: true,
      },
    })

    if (!firstBabyUser) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      },
      baby: {
        id: firstBabyUser.baby.id,
        name: firstBabyUser.baby.name,
        avatarUrl: firstBabyUser.baby.avatarUrl,
        birthDate: firstBabyUser.baby.birthDate,
      },
    }
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
    baby: {
      id: babyUser.baby.id,
      name: babyUser.baby.name,
      avatarUrl: babyUser.baby.avatarUrl,
      birthDate: babyUser.baby.birthDate,
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
    throw new Error("Unauthorized")
  }

  return context
}
