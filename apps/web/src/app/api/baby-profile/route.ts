import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - 获取宝宝资料
export async function GET() {
  try {
    // 获取或创建默认的宝宝资料
    let profile = await prisma.babyProfile.findUnique({
      where: { id: 'default' },
    })

    if (!profile) {
      profile = await prisma.babyProfile.create({
        data: { id: 'default' },
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Failed to get baby profile:', error)
    return NextResponse.json(
      { error: 'Failed to get baby profile' },
      { status: 500 }
    )
  }
}

// PATCH - 更新宝宝资料
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, avatarUrl, birthDate } = body

    const profile = await prisma.babyProfile.upsert({
      where: { id: 'default' },
      update: {
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
      },
      create: {
        id: 'default',
        name,
        avatarUrl,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Failed to update baby profile:', error)
    return NextResponse.json(
      { error: 'Failed to update baby profile' },
      { status: 500 }
    )
  }
}

