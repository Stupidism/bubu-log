import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import weekday from 'dayjs/plugin/weekday'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/zh-cn'

// 扩展 dayjs
dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.extend(weekday)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('zh-cn')

// 中国时区
export const CHINA_TIMEZONE = 'Asia/Shanghai'

export { dayjs }

/**
 * 计算两个时间之间的持续时间（分钟）
 */
export function calculateDurationMinutes(startTime: Date | string, endTime: Date | string): number {
  const start = dayjs(startTime)
  const end = dayjs(endTime)
  return end.diff(start, 'minute')
}

/**
 * 根据开始时间和持续时间计算结束时间
 */
export function calculateEndTime(startTime: Date | string, durationMinutes: number): Date {
  return dayjs(startTime).add(durationMinutes, 'minute').toDate()
}

/**
 * 根据结束时间和持续时间计算开始时间
 */
export function calculateStartTime(endTime: Date | string, durationMinutes: number): Date {
  return dayjs(endTime).subtract(durationMinutes, 'minute').toDate()
}

/**
 * 格式化持续时间为可读字符串
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}小时`
  }
  return `${hours}小时${remainingMinutes}分钟`
}

/**
 * 格式化时间为 HH:mm
 */
export function formatTime(date: Date | string): string {
  return dayjs(date).format('HH:mm')
}

/**
 * 格式化时间为相对时间（如"5分钟前"）
 */
export function formatRelativeTime(date: Date | string): string {
  return dayjs(date).fromNow()
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm
 */
export function formatDateTime(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

/**
 * 格式化日期为中文格式 M月D日
 */
export function formatDateChinese(date: Date | string): string {
  return dayjs(date).format('M月D日')
}

/**
 * 格式化日期时间为中文格式 M月D日 HH:mm
 */
export function formatDateTimeChinese(date: Date | string): string {
  return dayjs(date).format('M月D日 HH:mm')
}

/**
 * 获取星期几（中文）
 */
export function formatWeekday(date: Date | string): string {
  return dayjs(date).format('dddd')
}

/**
 * 在指定时间上加分钟数
 */
export function addMinutes(date: Date | string, minutes: number): Date {
  return dayjs(date).add(minutes, 'minute').toDate()
}

/**
 * 计算两个时间的分钟差
 */
export function differenceInMinutes(later: Date | string, earlier: Date | string): number {
  return dayjs(later).diff(dayjs(earlier), 'minute')
}

/**
 * 判断是否为今天
 */
export function isToday(date: Date | string): boolean {
  return dayjs(date).isSame(dayjs(), 'day')
}

/**
 * 获取指定日期的开始时间（00:00:00）- 本地时区
 */
export function startOfDay(date: Date | string): Date {
  return dayjs(date).startOf('day').toDate()
}

/**
 * 获取指定日期的结束时间（23:59:59）- 本地时区
 */
export function endOfDay(date: Date | string): Date {
  return dayjs(date).endOf('day').toDate()
}

/**
 * 获取指定日期在中国时区的开始时间（00:00:00 CST）
 * 用于服务器端按中国时区过滤数据
 */
export function startOfDayChina(dateStr: string): Date {
  // 解析 YYYY-MM-DD 格式的日期字符串，按中国时区设置为当天 00:00:00
  return dayjs.tz(`${dateStr} 00:00:00`, CHINA_TIMEZONE).toDate()
}

/**
 * 获取指定日期在中国时区的结束时间（23:59:59.999 CST）
 * 用于服务器端按中国时区过滤数据
 */
export function endOfDayChina(dateStr: string): Date {
  // 解析 YYYY-MM-DD 格式的日期字符串，按中国时区设置为当天 23:59:59.999
  return dayjs.tz(`${dateStr} 23:59:59`, CHINA_TIMEZONE).millisecond(999).toDate()
}

/**
 * 获取指定日期前一天某个时间点（中国时区）
 * 用于获取"昨晚摘要"的开始时间
 */
export function previousDayTimeChina(dateStr: string, hour: number): Date {
  return dayjs.tz(`${dateStr} 00:00:00`, CHINA_TIMEZONE)
    .subtract(1, 'day')
    .hour(hour)
    .minute(0)
    .second(0)
    .millisecond(0)
    .toDate()
}

/**
 * 解析 ISO 时间字符串
 */
export function parseTime(timeString: string): Date {
  return dayjs(timeString).toDate()
}

/**
 * 转换为 ISO 字符串
 */
export function toISOString(date: Date | string): string {
  return dayjs(date).toISOString()
}

/**
 * 计算活动在指定日期范围内的持续时间（分钟）
 * 用于跨天活动（如睡眠）只计算当天的部分
 * 
 * @param activityStartTime 活动开始时间
 * @param activityEndTime 活动结束时间
 * @param dayDate 指定日期
 * @returns 在指定日期范围内的分钟数
 * 
 * @example
 * // 睡眠从昨天 23:00 到今天 7:00，只计算今天 0:00 到 7:00 的部分
 * calculateDurationInDay('2024-01-21T23:00:00', '2024-01-22T07:00:00', new Date('2024-01-22'))
 * // 返回 420 (7小时)
 */
export function calculateDurationInDay(
  activityStartTime: Date | string,
  activityEndTime: Date | string,
  dayDate: Date | string
): number {
  const dayStart = dayjs(dayDate).startOf('day')
  const dayEnd = dayjs(dayDate).endOf('day')
  
  const activityStart = dayjs(activityStartTime)
  const activityEnd = dayjs(activityEndTime)
  
  // 计算活动与当天的交集
  // 实际开始时间 = max(活动开始时间, 当天开始时间)
  const effectiveStart = activityStart.isBefore(dayStart) ? dayStart : activityStart
  // 实际结束时间 = min(活动结束时间, 当天结束时间)
  const effectiveEnd = activityEnd.isAfter(dayEnd) ? dayEnd : activityEnd
  
  // 如果没有交集，返回 0
  if (effectiveStart.isAfter(effectiveEnd)) {
    return 0
  }
  
  return effectiveEnd.diff(effectiveStart, 'minute')
}

