import { Prisma, UserRole } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'

const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, '用户名至少 3 位')
    .max(32, '用户名最多 32 位')
    .regex(/^[a-zA-Z0-9._-]+$/, '用户名仅支持字母、数字、点、下划线、横线'),
  password: z.string().min(8, '密码至少 8 位').max(72, '密码最多 72 位'),
  name: z.string().trim().max(40, '姓名最多 40 位').optional().nullable(),
  email: z.string().trim().email('邮箱格式不正确').optional().nullable(),
  role: z.nativeEnum(UserRole).optional(),
  defaultBabyId: z.string().trim().min(1).optional().nullable(),
})

export async function GET() {
  try {
    await requireAdminUser()

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json(
      users.map((user) => {
        const defaultBaby = user.babies.find((item) => item.isDefault)
        return {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          babyIds: user.babies.map((item) => item.baby.id),
          babyNames: user.babies.map((item) => item.baby.name),
          defaultBabyId: defaultBaby?.baby.id ?? null,
          defaultBabyName: defaultBaby?.baby.name ?? null,
        }
      })
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.error('Failed to fetch users in admin:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser()

    const body = await request.json()
    const parsed = createUserSchema.parse(body)

    const trimmedName = parsed.name?.trim() || null
    const trimmedEmail = parsed.email?.trim() || null

    if (parsed.defaultBabyId) {
      const baby = await prisma.baby.findUnique({
        where: { id: parsed.defaultBabyId },
        select: { id: true },
      })

      if (!baby) {
        return NextResponse.json({ error: '默认宝宝不存在' }, { status: 400 })
      }
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 12)

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: parsed.username,
          password: hashedPassword,
          name: trimmedName,
          email: trimmedEmail,
          role: parsed.role ?? UserRole.OTHER,
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })

      if (parsed.defaultBabyId) {
        await tx.babyUser.create({
          data: {
            userId: user.id,
            babyId: parsed.defaultBabyId,
            isDefault: true,
          },
        })
      }

      const userWithBabies = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          babies: {
            include: {
              baby: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      return userWithBabies
    })

    if (!created) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    const defaultBaby = created.babies.find((item) => item.isDefault)

    return NextResponse.json(
      {
        id: created.id,
        username: created.username,
        name: created.name,
        email: created.email,
        role: created.role,
        createdAt: created.createdAt,
        babyIds: created.babies.map((item) => item.baby.id),
        babyNames: created.babies.map((item) => item.baby.name),
        defaultBabyId: defaultBaby?.baby.id ?? null,
        defaultBabyName: defaultBaby?.baby.name ?? null,
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

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target
      const field = Array.isArray(target)
        ? String(target[0])
        : typeof target === 'string'
          ? target
          : '字段'
      return NextResponse.json({ error: `${field} 已被占用` }, { status: 409 })
    }

    console.error('Failed to create user in admin:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
