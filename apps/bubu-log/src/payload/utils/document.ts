import crypto from 'node:crypto'

type MutableData = Record<string, unknown>

export function ensureTextId(input: MutableData): MutableData {
  if (!input.id || typeof input.id !== 'string') {
    input.id = crypto.randomUUID()
  }

  return input
}

export function touchTimestamps(
  input: MutableData,
  operation: 'create' | 'update'
): MutableData {
  const now = new Date().toISOString()

  if (operation === 'create' && !input.createdAt) {
    input.createdAt = now
  }

  input.updatedAt = now

  return input
}
