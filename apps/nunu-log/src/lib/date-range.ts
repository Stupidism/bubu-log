export function getUtcRangeForLocalDate(dateStr: string, tzOffsetMinutes: number) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const startUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) + tzOffsetMinutes * 60 * 1000)
  const endUtc = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) + tzOffsetMinutes * 60 * 1000)
  return { startUtc, endUtc }
}

export function getUtcRangeForLocalDates(fromDate: string, toDate: string, tzOffsetMinutes: number) {
  const from = getUtcRangeForLocalDate(fromDate, tzOffsetMinutes)
  const to = getUtcRangeForLocalDate(toDate, tzOffsetMinutes)
  return { startUtc: from.startUtc, endUtc: to.endUtc }
}
