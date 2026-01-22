export enum ActivityType {
  SLEEP = 'SLEEP',
  DIAPER = 'DIAPER',
  BREASTFEED = 'BREASTFEED',
  BOTTLE = 'BOTTLE',
  HEAD_LIFT = 'HEAD_LIFT',
  PASSIVE_EXERCISE = 'PASSIVE_EXERCISE',
  GAS_EXERCISE = 'GAS_EXERCISE',
  BATH = 'BATH',
  OUTDOOR = 'OUTDOOR',
  EARLY_EDUCATION = 'EARLY_EDUCATION',
}

export enum PoopColor {
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  BROWN = 'BROWN',
  BLACK = 'BLACK',
  WHITE = 'WHITE',
  RED = 'RED',
}

export enum PeeAmount {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

// 乳房硬度（亲喂后）
const breastFirmnessTypes = ['SOFT', 'ELASTIC', 'HARD'] as const
export type BreastFirmness = typeof breastFirmnessTypes[number]

export interface Activity {
  id: string
  type: ActivityType
  recordTime: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  hasPoop?: boolean | null
  hasPee?: boolean | null
  poopColor?: PoopColor | null
  poopPhotoUrl?: string | null
  peeAmount?: PeeAmount | null
  burpSuccess?: boolean | null
  duration?: number | null
  milkAmount?: number | null
  notes?: string | null
}

export const ActivityTypeLabels: Record<ActivityType, string> = {
  [ActivityType.SLEEP]: '睡眠',
  [ActivityType.DIAPER]: '换尿布',
  [ActivityType.BREASTFEED]: '亲喂',
  [ActivityType.BOTTLE]: '瓶喂',
  [ActivityType.HEAD_LIFT]: '抬头',
  [ActivityType.PASSIVE_EXERCISE]: '被动操',
  [ActivityType.GAS_EXERCISE]: '排气操',
  [ActivityType.BATH]: '洗澡',
  [ActivityType.OUTDOOR]: '户外晒太阳',
  [ActivityType.EARLY_EDUCATION]: '早教',
}

export const PoopColorLabels: Record<PoopColor, string> = {
  [PoopColor.YELLOW]: '黄色',
  [PoopColor.GREEN]: '绿色',
  [PoopColor.BROWN]: '棕色',
  [PoopColor.BLACK]: '黑色',
  [PoopColor.WHITE]: '白色',
  [PoopColor.RED]: '红色',
}

export const PoopColorStyles: Record<PoopColor, string> = {
  [PoopColor.YELLOW]: 'bg-yellow-400',
  [PoopColor.GREEN]: 'bg-green-500',
  [PoopColor.BROWN]: 'bg-amber-700',
  [PoopColor.BLACK]: 'bg-gray-900',
  [PoopColor.WHITE]: 'bg-gray-100 border border-gray-300',
  [PoopColor.RED]: 'bg-red-500',
}

export const PeeAmountLabels: Record<PeeAmount, string> = {
  [PeeAmount.SMALL]: '少',
  [PeeAmount.MEDIUM]: '中',
  [PeeAmount.LARGE]: '多',
}

export const BreastFirmnessLabels: Record<BreastFirmness, string> = {
  SOFT: '软',
  ELASTIC: '弹',
  HARD: '硬',
}

// 活动图标名称映射（用于 Lucide React 图标）
export const ActivityIconNames: Record<ActivityType, string> = {
  [ActivityType.SLEEP]: 'Moon',
  [ActivityType.DIAPER]: 'Baby',
  [ActivityType.BREASTFEED]: 'Heart',
  [ActivityType.BOTTLE]: 'Milk',
  [ActivityType.HEAD_LIFT]: 'ArrowUp',
  [ActivityType.PASSIVE_EXERCISE]: 'Activity',
  [ActivityType.GAS_EXERCISE]: 'Wind',
  [ActivityType.BATH]: 'Bath',
  [ActivityType.OUTDOOR]: 'SunMedium',
  [ActivityType.EARLY_EDUCATION]: 'BookOpen',
}

// 活动分类（用于过滤）
export const ActivityCategories = {
  sleep: [ActivityType.SLEEP],
  feeding: [ActivityType.BREASTFEED, ActivityType.BOTTLE],
  diaper: [ActivityType.DIAPER],
  activities: [
    ActivityType.HEAD_LIFT,
    ActivityType.PASSIVE_EXERCISE,
    ActivityType.GAS_EXERCISE,
    ActivityType.BATH,
    ActivityType.OUTDOOR,
    ActivityType.EARLY_EDUCATION,
  ],
}
