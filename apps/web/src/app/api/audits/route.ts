import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/get-current-baby'

// GET: 获取审计日志列表
export async function GET(request: NextRequest) {
  try {
    const { baby } = await requireAuth()
    
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action') as 'CREATE' | 'UPDATE' | 'DELETE' | null
    const resourceType = searchParams.get('resourceType') as 'ACTIVITY' | null
    const successParam = searchParams.get('success')

    const where: Record<string, unknown> = {
      babyId: baby.id,
    }

    if (action) {
      where.action = action
    }
    if (resourceType) {
      where.resourceType = resourceType
    }
    if (successParam !== null) {
      where.success = successParam === 'true'
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      hasMore: offset + data.length < total,
    })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
