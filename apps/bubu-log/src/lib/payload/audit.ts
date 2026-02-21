import type { Payload } from 'payload'

type CreateAuditInput = {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  resourceType?: 'ACTIVITY'
  resourceId?: string | null
  inputMethod: 'TEXT' | 'VOICE'
  inputText?: string | null
  description?: string | null
  success?: boolean
  errorMessage?: string | null
  beforeData?: unknown
  afterData?: unknown
  activityId?: string | null
  babyId?: string | null
  userId?: string | null
}

type JsonLike =
  | {
      [k: string]: unknown
    }
  | unknown[]
  | string
  | number
  | boolean
  | null

function normalizeJson(value: unknown): JsonLike {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'object') {
    return value as { [k: string]: unknown }
  }

  return String(value)
}

export async function createAuditLog(payload: Payload, input: CreateAuditInput) {
  return payload.create({
    collection: 'audit-logs',
    data: {
      action: input.action,
      resourceType: input.resourceType || 'ACTIVITY',
      resourceId: input.resourceId ?? null,
      inputMethod: input.inputMethod,
      inputText: input.inputText ?? null,
      description: input.description ?? null,
      success: input.success ?? true,
      errorMessage: input.errorMessage ?? null,
      beforeData: normalizeJson(input.beforeData),
      afterData: normalizeJson(input.afterData),
      activityId: input.activityId ?? null,
      babyId: input.babyId ?? null,
      userId: input.userId ?? null,
    },
    depth: 0,
    overrideAccess: true,
  })
}
