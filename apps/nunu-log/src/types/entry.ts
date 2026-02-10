export enum EntryType {
  SLEEP = 'SLEEP',
  MEAL = 'MEAL',
  WORK = 'WORK',
  CHILDCARE = 'CHILDCARE',
  ENTERTAINMENT = 'ENTERTAINMENT',
  OTHER = 'OTHER',
}

export interface TimeEntry {
  id: string
  type: EntryType
  startTime: string | Date
  endTime?: string | Date | null
  notes?: string | null
  inputMethod?: 'MANUAL' | 'SIRI' | 'API'
  createdAt?: string | Date
  updatedAt?: string | Date
}

export const EntryTypeLabels: Record<EntryType, string> = {
  [EntryType.SLEEP]: '睡眠',
  [EntryType.MEAL]: '吃饭',
  [EntryType.WORK]: '工作',
  [EntryType.CHILDCARE]: '育儿',
  [EntryType.ENTERTAINMENT]: '娱乐',
  [EntryType.OTHER]: '其他',
}

export const EntryTypeDescriptions: Record<EntryType, string> = {
  [EntryType.SLEEP]: '休息和睡眠时间',
  [EntryType.MEAL]: '用餐与补充能量',
  [EntryType.WORK]: '工作与事务处理',
  [EntryType.CHILDCARE]: '陪伴、照护与育儿相关',
  [EntryType.ENTERTAINMENT]: '娱乐、放松与兴趣爱好',
  [EntryType.OTHER]: '其他无法归类的记录',
}

export const EntryTypeColors: Record<EntryType, { bg: string; border: string; text: string; divider?: string }> = {
  [EntryType.SLEEP]: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', border: 'border-indigo-400', text: 'text-indigo-700 dark:text-indigo-300' },
  [EntryType.MEAL]: { bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  [EntryType.WORK]: { bg: 'bg-slate-100 dark:bg-slate-900/40', border: 'border-slate-400', text: 'text-slate-700 dark:text-slate-300' },
  [EntryType.CHILDCARE]: { bg: 'bg-rose-100 dark:bg-rose-900/40', border: 'border-rose-400', text: 'text-rose-700 dark:text-rose-300' },
  [EntryType.ENTERTAINMENT]: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
  [EntryType.OTHER]: { bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-400', text: 'text-gray-700 dark:text-gray-300' },
}

export const EntryTypeShortcuts: Record<EntryType, number[]> = {
  [EntryType.SLEEP]: [30, 60, 90, 120],
  [EntryType.MEAL]: [20, 30, 45, 60],
  [EntryType.WORK]: [30, 60, 120, 180],
  [EntryType.CHILDCARE]: [30, 60, 90, 120],
  [EntryType.ENTERTAINMENT]: [30, 60, 90, 120],
  [EntryType.OTHER]: [15, 30, 60, 120],
}

export const EntryTypeChartColors: Record<EntryType, string> = {
  [EntryType.SLEEP]: '#818CF8',
  [EntryType.MEAL]: '#FBBF24',
  [EntryType.WORK]: '#64748B',
  [EntryType.CHILDCARE]: '#FB7185',
  [EntryType.ENTERTAINMENT]: '#34D399',
  [EntryType.OTHER]: '#9CA3AF',
}

export const EntryTypeHints: Record<EntryType, string> = {
  [EntryType.SLEEP]: '例如：午睡、夜间睡眠',
  [EntryType.MEAL]: '例如：早餐、午餐、加餐',
  [EntryType.WORK]: '例如：会议、写方案',
  [EntryType.CHILDCARE]: '例如：喂奶、陪玩、哄睡',
  [EntryType.ENTERTAINMENT]: '例如：刷剧、散步、健身',
  [EntryType.OTHER]: '例如：散心、就医、购物',
}
