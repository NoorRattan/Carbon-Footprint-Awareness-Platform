/**
 * Formats an ISO date string to a localised display string.
 * @param isoDate - ISO 8601 date string
 * @param options - Optional Intl.DateTimeFormatOptions for customisation
 * @returns Formatted date string e.g. "19 Jun 2026"
 */
export function formatDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
  return new Date(isoDate).toLocaleDateString('en-GB', options)
}

/**
 * Returns a human-readable relative time string (e.g. "2 hours ago", "yesterday").
 * @param isoDate - ISO 8601 date string
 * @returns Relative time description
 */
export function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }
  if (seconds < 172800) return 'yesterday'

  const days = Math.floor(seconds / 86400)
  if (days < 30) return `${days} days ago`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months} month${months !== 1 ? 's' : ''} ago`
  }

  const years = Math.floor(days / 365)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns the ISO date string for the start of today (midnight local time).
 * @returns ISO date string for start of today
 */
export function startOfToday(): string {
  return toLocalDateString(new Date())
}

/**
 * Returns the ISO date string for the start of the current week (Monday).
 * @returns ISO date string for start of current week
 */
export function startOfWeek(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return toLocalDateString(d)
}

/**
 * Returns the ISO date string for the start of the current month.
 * @returns ISO date string for start of current month
 */
export function startOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  return toLocalDateString(d)
}

/**
 * Returns a date range object with ISO start and end date strings for a given period.
 * @param period - The time period: 'week', 'month', or 'year'
 * @returns Object with start_date and end_date ISO strings
 */
export function getDateRange(period: 'week' | 'month' | 'year'): {
  start_date: string
  end_date: string
} {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7)
      break
    case 'month':
      start.setMonth(end.getMonth() - 1)
      break
    case 'year':
      start.setFullYear(end.getFullYear() - 1)
      break
  }

  start.setHours(0, 0, 0, 0)

  return {
    start_date: toLocalDateString(start),
    end_date: toLocalDateString(end),
  }
}

/**
 * Formats an ISO date string to YYYY-MM-DD for use in HTML date inputs.
 * @param isoDate - ISO 8601 date string
 * @returns Date string in YYYY-MM-DD format
 */
export function toInputDate(isoDate: string): string {
  return new Date(isoDate).toISOString().split('T')[0]
}

/**
 * Returns today's date as a YYYY-MM-DD string for HTML date inputs.
 * @returns Today's date in YYYY-MM-DD format
 */
export function todayInputDate(): string {
  return toLocalDateString(new Date())
}
