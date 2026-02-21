import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/get-current-baby'
import { getPayloadClient } from '@/lib/payload/client'

export async function GET() {
  try {
    const { baby } = await requireAuth()

    return NextResponse.json({
      id: baby.id,
      name: baby.name,
      avatarUrl: baby.avatarUrl,
      birthDate: baby.birthDate,
    })
  } catch (error) {
    console.error('Failed to get baby profile:', error)
    return NextResponse.json({ error: 'Failed to get baby profile' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { baby } = await requireAuth()
    const payload = await getPayloadClient()

    const body = await request.json()
    const { name, avatarUrl, birthDate } = body

    const updatedBaby = await payload.update({
      collection: 'babies',
      id: baby.id,
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(birthDate !== undefined
          ? { birthDate: birthDate ? new Date(birthDate).toISOString() : null }
          : {}),
      },
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json(updatedBaby)
  } catch (error) {
    console.error('Failed to update baby profile:', error)
    return NextResponse.json({ error: 'Failed to update baby profile' }, { status: 500 })
  }
}
