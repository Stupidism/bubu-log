import { NextRequest, NextResponse } from 'next/server'
import { type Where } from 'payload'
import { requireAuth } from '@/lib/auth/get-current-baby'
import { getPayloadClient } from '@/lib/payload/client'

export async function GET(request: NextRequest) {
  try {
    const { baby } = await requireAuth()
    const payload = await getPayloadClient()

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const action = searchParams.get('action') as 'CREATE' | 'UPDATE' | 'DELETE' | null
    const resourceType = searchParams.get('resourceType') as 'ACTIVITY' | null
    const successParam = searchParams.get('success')

    const conditions: Where[] = [
      {
        babyId: {
          equals: baby.id,
        },
      },
    ]

    if (action) {
      conditions.push({
        action: {
          equals: action,
        },
      })
    }

    if (resourceType) {
      conditions.push({
        resourceType: {
          equals: resourceType,
        },
      })
    }

    if (successParam !== null) {
      conditions.push({
        success: {
          equals: successParam === 'true',
        },
      })
    }

    const requestedCount = offset + limit

    const result = await payload.find({
      collection: 'audit-logs',
      where: {
        and: conditions,
      },
      sort: '-createdAt',
      limit: requestedCount,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    const docs = result.docs.slice(offset, offset + limit)

    return NextResponse.json({
      data: docs,
      total: result.totalDocs,
      hasMore: offset + docs.length < result.totalDocs,
    })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
