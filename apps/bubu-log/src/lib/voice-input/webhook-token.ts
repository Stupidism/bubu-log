import { createHmac, timingSafeEqual } from 'node:crypto'

const TOKEN_VERSION = 'v1'
const DEFAULT_TTL_SECONDS = 180 * 24 * 60 * 60

export interface VoiceWebhookTokenPayload {
  userId: string
  babyId: string
  exp: number
}

function getTokenSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET (or NEXTAUTH_SECRET) is required for webhook token signing')
  }
  return secret
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url')
}

export function createVoiceWebhookToken(params: {
  userId: string
  babyId: string
  ttlSeconds?: number
}): { token: string; expiresAt: string; payload: VoiceWebhookTokenPayload } {
  const secret = getTokenSecret()
  const ttlSeconds = params.ttlSeconds ?? DEFAULT_TTL_SECONDS
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds

  const payload: VoiceWebhookTokenPayload = {
    userId: params.userId,
    babyId: params.babyId,
    exp,
  }

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${TOKEN_VERSION}.${payloadEncoded}`
  const signature = sign(signingInput, secret)

  return {
    token: `${signingInput}.${signature}`,
    expiresAt: new Date(exp * 1000).toISOString(),
    payload,
  }
}

export function verifyVoiceWebhookToken(token: string): VoiceWebhookTokenPayload | null {
  const secret = getTokenSecret()
  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  const [version, payloadEncoded, signature] = parts
  if (version !== TOKEN_VERSION || !payloadEncoded || !signature) {
    return null
  }

  const signingInput = `${version}.${payloadEncoded}`
  const expected = sign(signingInput, secret)

  const actualBuffer = Buffer.from(signature, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')

  if (actualBuffer.length !== expectedBuffer.length) {
    return null
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as VoiceWebhookTokenPayload
    if (!payload.userId || !payload.babyId || !payload.exp) {
      return null
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
