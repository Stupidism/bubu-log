import { getPayload } from 'payload'

export async function getPayloadForScript() {
  const { default: config } = await import('../../payload.config.ts')
  return getPayload({ config })
}
