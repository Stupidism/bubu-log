import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { EntryType } from '@prisma/client'

const updateEntrySchema = z.object({
  type: z.nativeEnum(EntryType).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional().nullable(),
  durationMinutes: z.number().int().nonnegative().optional(),
  notes: z.string().optional().nullable(),
})

function parseDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }
  return date
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const parsed = updateEntrySchema.parse(body)

    const data: Record<string, unknown> = {}

    if (parsed.type) data.type = parsed.type
    if (parsed.notes !== undefined) data.notes = parsed.notes

    if (parsed.startTime) {
      data.startTime = parseDate(parsed.startTime)
    }

    if (parsed.endTime !== undefined) {
      data.endTime = parsed.endTime ? parseDate(parsed.endTime) : null
    }

    if (!parsed.endTime && parsed.durationMinutes && parsed.startTime) {
      const startTime = parseDate(parsed.startTime)
      data.endTime = new Date(startTime.getTime() + parsed.durationMinutes * 60 * 1000)
    }

    const entry = await prisma.timeEntry.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(entry)
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.errors.map((err) => err.message).join(', ')
      : error instanceof Error
        ? error.message
        : 'Unknown error'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.timeEntry.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
