import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/get-current-baby'
import { processVoiceInput } from '@/lib/voice-input/process'
import { verifyVoiceWebhookToken } from '@/lib/voice-input/webhook-token'

function extractApiKey(request: NextRequest): string | null {
  return request.headers.get('x-api-key')?.trim() || null
}

function extractBearerToken(request: NextRequest): string | null {
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

type ResolvedIdentity = {
  babyId: string
  userId: string | null
}

// POST: Parse voice input and create activity
// Auth modes (priority):
// 1) Signed user token (Authorization: Bearer <token>)
// 2) Session cookie (same as /api/voice-input)
// 3) Global API key (x-api-key / Bearer == VOICE_WEBHOOK_API_KEY)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const text = typeof body.text === 'string' ? body.text : ''
    const localTime = typeof body.localTime === 'string' ? body.localTime : null

    const apiKeyFromHeader = extractApiKey(request)
    const bearerToken = extractBearerToken(request)
    const configuredApiKey = process.env.VOICE_WEBHOOK_API_KEY?.trim() || null

    let identity: ResolvedIdentity | null = null

    // Mode 1: signed user token
    if (bearerToken) {
      const payload = verifyVoiceWebhookToken(bearerToken)
      if (payload) {
        identity = {
          babyId: payload.babyId,
          userId: payload.userId,
        }
      }
    }

    // Mode 2: current session
    if (!identity && !apiKeyFromHeader && !bearerToken) {
      try {
        const { baby, user } = await requireAuth()
        identity = {
          babyId: baby.id,
          userId: user.id,
        }
      } catch {
        // Continue to API-key mode check
      }
    }

    // Mode 3: global API key (backward compatibility)
    if (!identity && configuredApiKey) {
      const incomingApiKey = apiKeyFromHeader || bearerToken
      if (incomingApiKey && secureCompare(incomingApiKey, configuredApiKey)) {
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

        identity = {
          babyId: targetBabyId,
          userId: auditUserId,
        }
      }
    }

    if (!identity) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
          message: 'Use signed Bearer token, session cookie, or configured API key',
        },
        { status: 401 },
      )
    }

    const baby = await prisma.baby.findUnique({
      where: { id: identity.babyId },
      select: { id: true },
    })

    if (!baby) {
      return NextResponse.json(
        {
          error: `Baby not found: ${identity.babyId}`,
          code: 'BABY_NOT_FOUND',
        },
        { status: 404 },
      )
    }

    const result = await processVoiceInput({
      text,
      localTime,
      babyId: baby.id,
      userId: identity.userId,
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
