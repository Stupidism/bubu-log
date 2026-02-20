import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { processVoiceInput } from '@/lib/voice-input/process'

function extractApiKey(request: NextRequest): string | null {
  const headerKey = request.headers.get('x-api-key')?.trim()
  if (headerKey) {
    return headerKey
  }

  const authorization = request.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice(7).trim()
  }

  return null
}

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

// POST: Parse voice input and create activity (API-key authenticated webhook)
export async function POST(request: NextRequest) {
  const configuredApiKey = process.env.VOICE_WEBHOOK_API_KEY
  if (!configuredApiKey) {
    return NextResponse.json(
      {
        error: 'Webhook API key is not configured',
        code: 'WEBHOOK_API_KEY_NOT_CONFIGURED',
      },
      { status: 500 },
    )
  }

  const incomingApiKey = extractApiKey(request)
  if (!incomingApiKey || !secureCompare(incomingApiKey, configuredApiKey)) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        code: 'INVALID_API_KEY',
      },
      { status: 401 },
    )
  }

  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const text = typeof body.text === 'string' ? body.text : ''
    const localTime = typeof body.localTime === 'string' ? body.localTime : null

    const bodyBabyId = typeof body.babyId === 'string' ? body.babyId : null
    const targetBabyId = bodyBabyId || process.env.VOICE_WEBHOOK_DEFAULT_BABY_ID || null

    if (!targetBabyId) {
      return NextResponse.json(
        {
          error: 'Missing babyId. Provide body.babyId or VOICE_WEBHOOK_DEFAULT_BABY_ID',
          code: 'MISSING_BABY_ID',
        },
        { status: 400 },
      )
    }

    const baby = await prisma.baby.findUnique({
      where: { id: targetBabyId },
      select: { id: true },
    })

    if (!baby) {
      return NextResponse.json(
        {
          error: `Baby not found: ${targetBabyId}`,
          code: 'BABY_NOT_FOUND',
        },
        { status: 404 },
      )
    }

    const auditUserId = process.env.VOICE_WEBHOOK_AUDIT_USER_ID ?? null
    if (auditUserId) {
      const user = await prisma.user.findUnique({
        where: { id: auditUserId },
        select: { id: true },
      })

      if (!user) {
        return NextResponse.json(
          {
            error: `Invalid VOICE_WEBHOOK_AUDIT_USER_ID: ${auditUserId}`,
            code: 'INVALID_AUDIT_USER_ID',
          },
          { status: 500 },
        )
      }
    }

    const result = await processVoiceInput({
      text,
      localTime,
      babyId: baby.id,
      userId: auditUserId,
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Voice webhook processing failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: '处理语音输入失败',
        details: errorMessage,
        code: 'PROCESSING_ERROR',
      },
      { status: 500 },
    )
  }
}
