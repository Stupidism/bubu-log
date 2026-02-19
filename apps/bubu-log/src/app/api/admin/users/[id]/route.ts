import { UserRole } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'

const updateUserSchema = z
  .object({
    role: z.nativeEnum(UserRole).optional(),
    password: z.string().min(8, '密码至少 8 位').max(72, '密码最多 72 位').optional(),
  })
  .refine((value) => value.role !== undefined || value.password !== undefined, {
    message: '至少提供一个更新字段',
  })

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdminUser()
    const { id } = await params

    const body = await request.json()
    const parsed = updateUserSchema.parse(body)

    if (admin.id === id && parsed.role && parsed.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: '不能移除当前登录管理员自己的管理员权限' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const data: {
      role?: UserRole
      password?: string
    } = {}

    if (parsed.role) {
      data.role = parsed.role
    }

    if (parsed.password) {
      data.password = await bcrypt.hash(parsed.password, 12)
    }

    const user = await prisma.user.update({
      where: { id },
      data,
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

    const defaultBaby = user.babies.find((item) => item.isDefault)

    return NextResponse.json({
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
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? '参数错误' }, { status: 400 })
    }

    console.error('Failed to update user in admin:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
