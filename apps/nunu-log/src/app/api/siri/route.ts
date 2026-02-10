import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { EntryType, InputMethod } from '@prisma/client'

const siriSchema = z.object({
  type: z.nativeEnum(EntryType).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
  text: z.string().optional(),
})

function parseDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }
  return date
}

function parseDurationMinutes(text: string) {
  let minutes = 0
  const hourMatches = text.match(/(\d+(?:\.\d+)?)\s*(小时|h|hr)/gi) || []
  const minuteMatches = text.match(/(\d+)\s*(分钟|分|min)/gi) || []

  for (const match of hourMatches) {
    const value = Number.parseFloat(match)
    if (!Number.isNaN(value)) minutes += Math.round(value * 60)
  }

  for (const match of minuteMatches) {
    const value = Number.parseInt(match, 10)
    if (!Number.isNaN(value)) minutes += value
  }

  return minutes || undefined
}

function guessTypeFromText(text: string) {
  if (/睡|午睡|睡觉|小憩/.test(text)) return EntryType.SLEEP
  if (/吃|吃饭|早餐|午餐|晚餐|加餐|宵夜/.test(text)) return EntryType.MEAL
  if (/工作|加班|会议|方案|写|文档|邮箱|办公/.test(text)) return EntryType.WORK
  if (/育儿|带娃|孩子|宝宝|哄|喂奶|陪/.test(text)) return EntryType.CHILDCARE
  if (/娱乐|放松|游戏|刷剧|电影|散步|健身|运动|阅读|看书/.test(text)) return EntryType.ENTERTAINMENT
  return EntryType.OTHER
}

export async function POST(request: NextRequest) {
  const expectedToken = process.env.NUNU_LOG_API_TOKEN
  if (expectedToken) {
    const token = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token || token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const body = await request.json()
    const parsed = siriSchema.parse(body)

    const text = parsed.text?.trim()
    const type = parsed.type ?? (text ? guessTypeFromText(text) : undefined)

    if (!type) {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 })
    }

    const now = new Date()
    const durationMinutes = parsed.durationMinutes ?? (text ? parseDurationMinutes(text) : undefined)

    let startTime = parsed.startTime ? parseDate(parsed.startTime) : now
    let endTime = parsed.endTime ? parseDate(parsed.endTime) : null

    if (!parsed.startTime && durationMinutes) {
      startTime = new Date(now.getTime() - durationMinutes * 60 * 1000)
      endTime = now
    }

    if (!endTime && durationMinutes) {
      endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)
    }

    if (!endTime) {
      endTime = startTime
    }

    if (endTime < startTime) {
      endTime = startTime
    }

    const entry = await prisma.timeEntry.create({
      data: {
        type,
        startTime,
        endTime,
        notes: parsed.notes ?? text ?? null,
        inputMethod: InputMethod.SIRI,
      },
    })

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.errors.map((err) => err.message).join(', ')
      : error instanceof Error
        ? error.message
        : 'Unknown error'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
