import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload/client'

type BabyUserDoc = {
  babyId: string | {
    id: string
    name: string
    avatarUrl?: string | null
  }
}

export async function GET() {
  let session

  try {
    session = await auth()
  } catch (error) {
    console.error('Failed to parse auth session for auth context:', error)
    return NextResponse.json({ authenticated: false, hasBaby: false }, { status: 401 })
  }

  try {
    const userId = session?.user && (session.user as { id?: string }).id

    if (!userId) {
      return NextResponse.json({ authenticated: false, hasBaby: false }, { status: 401 })
    }

    const payload = await getPayloadClient()

    const result = await payload.find({
      collection: 'baby-users',
      where: {
        userId: {
          equals: userId,
        },
      },
      sort: '-isDefault,createdAt',
      limit: 1,
      pagination: false,
      depth: 1,
      overrideAccess: true,
    })

    const babyUser = (result.docs[0] as BabyUserDoc | undefined) ?? null

    if (!babyUser) {
      return NextResponse.json({
        authenticated: true,
        hasBaby: false,
        baby: null,
      })
    }

    let baby: { id: string; name: string; avatarUrl: string | null } | null = null

    if (typeof babyUser.babyId === 'object' && babyUser.babyId) {
      baby = {
        id: babyUser.babyId.id,
        name: babyUser.babyId.name,
        avatarUrl: babyUser.babyId.avatarUrl ?? null,
      }
    } else if (typeof babyUser.babyId === 'string') {
      try {
        const babyDoc = await payload.findByID({
          collection: 'babies',
          id: babyUser.babyId,
          depth: 0,
          overrideAccess: true,
        })

        baby = {
          id: String(babyDoc.id),
          name: String((babyDoc as { name?: string }).name || ''),
          avatarUrl: ((babyDoc as { avatarUrl?: string | null }).avatarUrl ?? null),
        }
      } catch {
        baby = null
      }
    }

    return NextResponse.json({
      authenticated: true,
      hasBaby: Boolean(baby),
      baby,
    })
  } catch (error) {
    console.error('Failed to fetch auth context:', error)
    return NextResponse.json(
      { authenticated: false, hasBaby: false, error: 'Failed to fetch auth context' },
      { status: 500 }
    )
  }
}
