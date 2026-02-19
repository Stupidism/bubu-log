import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ authenticated: false, hasBaby: false }, { status: 401 })
    }

    const babyUser = await prisma.babyUser.findFirst({
      where: { userId: session.user.id },
      include: { baby: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({
      authenticated: true,
      hasBaby: Boolean(babyUser),
      baby: babyUser
        ? {
            id: babyUser.baby.id,
            name: babyUser.baby.name,
            avatarUrl: babyUser.baby.avatarUrl,
          }
        : null,
    })
  } catch (error) {
    console.error('Failed to fetch auth context:', error)
    return NextResponse.json(
      { authenticated: false, hasBaby: false, error: 'Failed to fetch auth context' },
      { status: 500 }
    )
  }
}
