import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'

const createBabySchema = z.object({
  name: z.string().trim().min(1, '宝宝名称不能为空').max(40, '宝宝名称不能超过40个字符'),
  birthDate: z.string().trim().optional().nullable(),
})

function toBirthDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const input = value.trim()
  if (!input) {
    return null
  }

  const parsedDate = input.includes('T')
    ? new Date(input)
    : new Date(`${input}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('出生日期格式不正确')
  }

  return parsedDate
}

export async function GET() {
  try {
    await requireAdminUser()

    const babies = await prisma.baby.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    return NextResponse.json(
      babies.map((baby) => ({
        id: baby.id,
        name: baby.name,
        birthDate: baby.birthDate,
        createdAt: baby.createdAt,
        userCount: baby._count.users,
      }))
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.error('Failed to fetch babies in admin:', error)
    return NextResponse.json({ error: 'Failed to fetch babies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser()

    const body = await request.json()
    const parsed = createBabySchema.parse(body)
    const birthDate = toBirthDate(parsed.birthDate)

    const baby = await prisma.baby.create({
      data: {
        name: parsed.name,
        birthDate,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    return NextResponse.json(
      {
        id: baby.id,
        name: baby.name,
        birthDate: baby.birthDate,
        createdAt: baby.createdAt,
        userCount: baby._count.users,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? '参数错误' }, { status: 400 })
    }

    if (error instanceof Error && error.message === '出生日期格式不正确') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Failed to create baby in admin:', error)
    return NextResponse.json({ error: 'Failed to create baby' }, { status: 500 })
  }
}
