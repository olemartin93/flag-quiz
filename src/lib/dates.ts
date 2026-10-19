/** Local calendar date as YYYY-MM-DD. */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  date.setDate(date.getDate() + days)
  return dateKey(date)
}

/** Day number since the first daily challenge, used in share text. */
export function dailyNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  const start = Date.UTC(2026, 0, 1)
  const day = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  return Math.round((day - start) / 86_400_000) + 1
}

export function msUntilTomorrow(now: Date = new Date()): number {
  const t = new Date(now)
  t.setHours(24, 0, 0, 0)
  return t.getTime() - now.getTime()
}
