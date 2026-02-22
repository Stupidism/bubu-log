import { NextRequest, NextResponse } from 'next/server'
import { authFailureResponse, getRequestedBabyId, requireAuth } from '@/lib/auth/get-current-baby'
import { createVoiceWebhookToken } from '@/lib/voice-input/webhook-token'

// GET: Create a signed webhook token bound to current user + scoped baby
export async function GET(request: NextRequest) {
  try {
    const { user, baby } = await requireAuth({ babyId: getRequestedBabyId(request) })

    const daysParam = request.nextUrl.searchParams.get('days')
    const days = daysParam ? Number.parseInt(daysParam, 10) : 180
    const normalizedDays = Number.isFinite(days) ? Math.min(Math.max(days, 1), 365) : 180

    // In preview deployments, request.nextUrl.origin may be protected by Vercel auth.
    // Allow overriding to a public/custom domain for Shortcuts webhook calls.
    const configuredBaseUrl = process.env.VOICE_WEBHOOK_PUBLIC_BASE_URL?.trim()
    let webhookUrl: string
    try {
      webhookUrl = new URL('/api/webhooks/voice-input', configuredBaseUrl || request.nextUrl.origin).toString()
    } catch {
      webhookUrl = `${request.nextUrl.origin}/api/webhooks/voice-input`
    }

    const { token, expiresAt } = createVoiceWebhookToken({
      userId: user.id,
      babyId: baby.id,
      ttlSeconds: normalizedDays * 24 * 60 * 60,
    })

    return NextResponse.json({
      token,
      expiresAt,
      webhookUrl,
      babyId: baby.id,
      babyName: baby.name,
      userId: user.id,
    })
  } catch (error) {
    const authError = authFailureResponse(error)
    if (authError) {
      return authError
    }

    console.error('Failed to create voice webhook token:', error)

    return NextResponse.json(
      {
        error: 'Failed to create webhook token',
        code: 'TOKEN_CREATE_FAILED',
      },
      { status: 500 },
    )
  }
}
