import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getUtcRangeForLocalDate, getUtcRangeForLocalDates } from '@/lib/date-range'
import { EntryType, InputMethod } from '@prisma/client'

const createEntrySchema = z.object({
  type: z.nativeEnum(EntryType),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  durationMinutes: z.number().int().nonnegative().optional(),
  notes: z.string().optional().nullable(),
  inputMethod: z.nativeEnum(InputMethod).optional(),
})

function parseDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }
  return date
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const tzOffset = Number(searchParams.get('tzOffset') ?? '0')

  let range: { startUtc: Date; endUtc: Date } | null = null
  if (date) {
    range = getUtcRangeForLocalDate(date, tzOffset)
  } else if (from && to) {
    range = getUtcRangeForLocalDates(from, to, tzOffset)
  }

  const where = range
    ? {
        startTime: { lte: range.endUtc },
        OR: [{ endTime: null }, { endTime: { gte: range.startUtc } }],
      }
    : undefined

  const entries = await prisma.timeEntry.findMany({
    where,
    orderBy: { startTime: 'asc' },
  })

  return NextResponse.json(entries)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createEntrySchema.parse(body)

    const startTime = parseDate(parsed.startTime)
    let endTime = parsed.endTime ? parseDate(parsed.endTime) : null

    if (!endTime && parsed.durationMinutes) {
      endTime = new Date(startTime.getTime() + parsed.durationMinutes * 60 * 1000)
    }

    if (!endTime) {
      endTime = startTime
    }

    if (endTime < startTime) {
      endTime = startTime
    }

    const entry = await prisma.timeEntry.create({
      data: {
        type: parsed.type,
        startTime,
        endTime,
        notes: parsed.notes ?? null,
        inputMethod: parsed.inputMethod ?? InputMethod.MANUAL,
      },
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
