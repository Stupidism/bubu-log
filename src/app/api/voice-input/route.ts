import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ActivityType, PoopColor, PeeAmount } from '@/types/activity'

// Deepseek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

// System prompt for parsing baby activity from natural language
const SYSTEM_PROMPT = `你是一个宝宝活动记录助手。用户会用自然语言描述宝宝的活动，你需要解析并返回结构化的 JSON 数据。

可用的活动类型 (type):
- SLEEP: 睡眠/睡觉/入睡/睡醒/睡着/醒了
- DIAPER: 换尿布/尿布/大便/小便/拉屎/拉粑粑/尿尿/便便
- BREASTFEED: 亲喂/母乳/吃奶（妈妈喂）/喂奶（非奶瓶）
  【语音识别纠错】：清胃/青喂/亲为/青为/亲味/清味/清位/亲位/青位 → 都是"亲喂"的误识别，应解析为 BREASTFEED
- BOTTLE: 瓶喂/奶瓶/喝奶/吃奶（奶瓶）/配方奶
- HEAD_LIFT: 抬头/趴着/俯卧/趴趴
- PASSIVE_EXERCISE: 被动操/体操/运动操
- GAS_EXERCISE: 排气操/排气/蹬腿
- BATH: 洗澡/沐浴/泡澡
- OUTDOOR: 户外/晒太阳/出门/外面/遛弯
- EARLY_EDUCATION: 早教/读书/讲故事/玩耍/游戏/听音乐

便便颜色 (poopColor):
- YELLOW: 黄色
- GREEN: 绿色
- BROWN: 棕色/褐色
- BLACK: 黑色
- WHITE: 白色
- RED: 红色

小便量 (peeAmount):
- SMALL: 少/一点点
- MEDIUM: 中/一般/正常
- LARGE: 多/很多

请根据用户输入返回以下 JSON 格式（只返回 JSON，不要其他内容）：
{
  "type": "活动类型",
  "recordTime": "ISO 8601 时间字符串，这是活动开始的时间",
  "duration": 活动时长（分钟），如果没提到返回 null,
  "milkAmount": 奶量（毫升），如果没提到返回 null,
  "hasPoop": 是否有大便（布尔值），如果没提到返回 null,
  "hasPee": 是否有小便（布尔值），如果没提到返回 null,
  "poopColor": "便便颜色"，如果没提到返回 null,
  "peeAmount": "小便量"，如果没提到返回 null,
  "notes": "用户提到的其他备注信息",
  "confidence": 0-1 之间的置信度，表示你对解析结果的信心
}

重要规则：
1. 如果无法确定活动类型，返回 {"error": "无法识别活动类型", "originalText": "用户原文"}
2. 【睡眠记录的特殊规则 - 非常重要】：
   - 当用户说"睡了X分钟"、"睡了X小时"、"刚睡了X分钟"时，表示宝宝刚刚睡醒，这是一个已完成的睡眠记录
   - 此时 recordTime 应该是睡眠开始时间 = 当前时间 - duration
   - 例如：用户在 10:00 说"睡了30分钟"，recordTime 应该是 09:30，duration 是 30
   - 只有当用户明确说"入睡"、"开始睡"、"睡着了"时，才是记录入睡时间（此时 duration 为 null）
3. 时间解析规则：
   - "刚才"、"刚刚" = 当前时间往前 5 分钟
   - "X分钟前" = 当前时间往前 X 分钟
   - "X小时前" = 当前时间往前 X 小时
   - 对于有 duration 的活动，recordTime 是活动开始时间，不是结束时间
   - 【时间范围解析 - 非常重要】：
     * 格式 "A到B" 或 "A至B"：A 是开始时间，B 是结束时间，recordTime = A，duration = B - A
     * 例如："一点到一点半" → recordTime = 13:00, duration = 30（不是 12:30 到 13:00！）
     * 例如："8点10分到9点" → recordTime = 08:10, duration = 50
     * 例如："下午3点到4点半" → recordTime = 15:00, duration = 90
     * 注意：第一个时间是开始时间，第二个时间是结束时间，不要搞反！
   - 【具体时间解析】：
     * 解析具体时间时，根据当前时间选择最近的过去时间点
     * 例如：当前 14:20，用户说"一点"，应该是 13:00（今天下午一点），不是 01:00（凌晨一点）
     * 例如：当前 14:20，用户说"一点到一点半"，应该是 13:00 到 13:30
   - 【时段默认值】：
     * 如果用户没说"上午/下午/晚上"，根据当前时间推断最近的时间点
     * 1-6点没有修饰词时，如果当前是白天，通常指下午13:00-18:00
     * 7-11点没有修饰词时，如果当前是下午，通常指上午7:00-11:00
4. 如果用户说"喝奶"但没说是亲喂还是瓶喂，默认为 BOTTLE（瓶喂）
5. 如果用户说"换尿布"但没说大小便情况，hasPoop 和 hasPee 都设为 null
6. 【置信度规则 - 非常重要】：
   - 置信度范围 0-1，表示你对解析结果的信心
   - 高置信度 (0.8-1.0)：信息完整明确，如"喝了80毫升奶瓶"、"亲喂15分钟"、"换尿布有大便黄色"
   - 中等置信度 (0.6-0.8)：部分信息缺失但能推断，如"瓶喂了"（没说奶量）、"睡了一会"（没说具体时长）
   - 低置信度 (0.3-0.6)：信息模糊需要确认，如：
     * "喝奶"、"吃奶" - 没说亲喂/瓶喂，没说奶量
     * "换尿布" - 没说大小便情况
     * "睡觉" - 没说入睡还是睡醒，没说时长
   - 很低置信度 (<0.3)：无法准确判断活动类型
7. 【语音识别纠错 - 重要】：
   - 用户输入来自语音转文字，可能有同音字/近音字错误
   - 常见误识别：
     * "清胃"/"青喂"/"亲为"/"亲味" → "亲喂" (BREASTFEED)
     * "平喂"/"瓶为"/"瓶味" → "瓶喂" (BOTTLE)
     * "排起操"/"排弃操" → "排气操" (GAS_EXERCISE)
     * "被动草"/"被懂操" → "被动操" (PASSIVE_EXERCISE)
     * "洗脚"（在宝宝语境下）→ 可能是"洗澡" (BATH)
   - 请智能纠正这些语音识别错误，正确理解用户意图`

interface DeepseekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepseekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface ParsedActivity {
  type: ActivityType
  recordTime: string | null
  duration: number | null
  milkAmount: number | null
  hasPoop: boolean | null
  hasPee: boolean | null
  poopColor: PoopColor | null
  peeAmount: PeeAmount | null
  notes: string | null
  confidence: number
}

interface ParseError {
  error: string
  originalText: string
}

async function callDeepseek(text: string, userLocalTime: string): Promise<ParsedActivity | ParseError> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable is not set')
  }

  const messages: DeepseekMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `用户当前本地时间: ${userLocalTime}\n用户输入: ${text}` }
  ]

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.1, // Low temperature for more consistent parsing
      max_tokens: 500
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Deepseek API error: ${response.status} - ${errorText}`)
  }

  const data: DeepseekResponse = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('Empty response from Deepseek')
  }

  // Parse the JSON response
  try {
    // Remove markdown code blocks if present
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(jsonStr)
  } catch {
    throw new Error(`Failed to parse Deepseek response: ${content}`)
  }
}

// Confidence threshold - below this, require user confirmation
const CONFIDENCE_THRESHOLD = 0.75

// POST: Parse voice input and create activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, localTime } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '请提供语音文本内容', code: 'MISSING_TEXT' },
        { status: 400 }
      )
    }

    // Use provided localTime or fallback to server time
    // localTime should be in format like "2024-01-22 15:30" (user's local time)
    const userLocalTime = localTime || new Date().toISOString()

    // Parse the text using Deepseek
    const parsed = await callDeepseek(text, userLocalTime)

    // Check if parsing failed
    if ('error' in parsed) {
      return NextResponse.json(
        { 
          error: parsed.error, 
          originalText: parsed.originalText,
          code: 'PARSE_FAILED'
        },
        { status: 400 }
      )
    }

    // Validate activity type
    if (!Object.values(ActivityType).includes(parsed.type)) {
      return NextResponse.json(
        { 
          error: `无效的活动类型: ${parsed.type}`,
          code: 'INVALID_TYPE'
        },
        { status: 400 }
      )
    }

    // Use current time if not specified
    const recordTime = parsed.recordTime 
      ? new Date(parsed.recordTime)
      : new Date()

    // If confidence is low, return parsed data for confirmation
    if (parsed.confidence < CONFIDENCE_THRESHOLD) {
      return NextResponse.json({
        success: true,
        needConfirmation: true,
        parsed: {
          type: parsed.type,
          recordTime: recordTime.toISOString(),
          duration: parsed.duration,
          milkAmount: parsed.milkAmount,
          hasPoop: parsed.hasPoop,
          hasPee: parsed.hasPee,
          poopColor: parsed.poopColor,
          peeAmount: parsed.peeAmount,
          notes: parsed.notes,
          confidence: parsed.confidence,
          originalText: text
        },
        message: `识别为: ${generateConfirmationMessage(parsed)}，请确认`
      }, { status: 200 })
    }

    // Create the activity
    const activity = await prisma.activity.create({
      data: {
        type: parsed.type,
        recordTime,
        duration: parsed.duration,
        milkAmount: parsed.milkAmount,
        hasPoop: parsed.hasPoop,
        hasPee: parsed.hasPee,
        poopColor: parsed.poopColor,
        peeAmount: parsed.peeAmount,
        notes: parsed.notes,
      },
    })

    // Return success with activity details and parse info
    return NextResponse.json({
      success: true,
      needConfirmation: false,
      activity,
      parsed: {
        confidence: parsed.confidence,
        originalText: text
      },
      message: generateConfirmationMessage(parsed)
    }, { status: 201 })

  } catch (error) {
    console.error('Voice input processing failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: '处理语音输入失败',
        details: errorMessage,
        code: 'PROCESSING_ERROR'
      },
      { status: 500 }
    )
  }
}

// Generate a human-readable confirmation message
function generateConfirmationMessage(parsed: ParsedActivity): string {
  const typeLabels: Record<ActivityType, string> = {
    [ActivityType.SLEEP]: '睡眠',
    [ActivityType.DIAPER]: '换尿布',
    [ActivityType.BREASTFEED]: '亲喂',
    [ActivityType.BOTTLE]: '瓶喂',
    [ActivityType.HEAD_LIFT]: '抬头',
    [ActivityType.PASSIVE_EXERCISE]: '被动操',
    [ActivityType.GAS_EXERCISE]: '排气操',
    [ActivityType.BATH]: '洗澡',
    [ActivityType.OUTDOOR]: '户外',
    [ActivityType.EARLY_EDUCATION]: '早教',
  }

  let message = `已记录: ${typeLabels[parsed.type]}`

  if (parsed.duration) {
    message += `，时长 ${parsed.duration} 分钟`
  }

  if (parsed.milkAmount) {
    message += `，${parsed.milkAmount} 毫升`
  }

  if (parsed.hasPoop || parsed.hasPee) {
    const parts = []
    if (parsed.hasPoop) parts.push('大便')
    if (parsed.hasPee) parts.push('小便')
    message += `，有${parts.join('和')}`
  }

  return message
}

