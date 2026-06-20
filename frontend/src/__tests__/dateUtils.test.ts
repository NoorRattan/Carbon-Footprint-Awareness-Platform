import { describe, it, expect } from 'vitest'
import {
  formatDate,
  timeAgo,
  startOfToday,
  startOfWeek,
  startOfMonth,
  getDateRange,
  toInputDate,
  todayInputDate,
} from '../utils/dateUtils'

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
const parseDateOnly = (date: string) => new Date(`${date}T00:00:00Z`)

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats ISO date to localised display string', () => {
      const result = formatDate('2026-06-15T00:00:00Z')
      expect(result).toContain('Jun')
      expect(result).toContain('2026')
    })
  })

  describe('timeAgo', () => {
    it('returns "just now" for recent timestamps', () => {
      const now = new Date().toISOString()
      expect(timeAgo(now)).toBe('just now')
    })

    it('returns minutes ago for timestamps within the hour', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      expect(timeAgo(fiveMinAgo)).toBe('5 minutes ago')
    })

    it('returns hours ago for timestamps within the day', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      expect(timeAgo(twoHoursAgo)).toBe('2 hours ago')
    })

    it('returns "yesterday" for timestamps from yesterday', () => {
      const yesterday = new Date(Date.now() - 30 * 3600 * 1000).toISOString()
      expect(timeAgo(yesterday)).toBe('yesterday')
    })

    it('returns days ago for timestamps within a month', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 86400 * 1000).toISOString()
      expect(timeAgo(fiveDaysAgo)).toBe('5 days ago')
    })

    it('returns months ago for timestamps within a year', () => {
      const threeMonthsAgo = new Date(Date.now() - 90 * 86400 * 1000).toISOString()
      expect(timeAgo(threeMonthsAgo)).toBe('3 months ago')
    })

    it('returns years ago for old timestamps', () => {
      const twoYearsAgo = new Date(Date.now() - 730 * 86400 * 1000).toISOString()
      expect(timeAgo(twoYearsAgo)).toBe('2 years ago')
    })

    it('returns singular form for 1 minute ago', () => {
      const oneMinAgo = new Date(Date.now() - 61 * 1000).toISOString()
      expect(timeAgo(oneMinAgo)).toBe('1 minute ago')
    })

    it('returns singular form for 1 hour ago', () => {
      const oneHourAgo = new Date(Date.now() - 3601 * 1000).toISOString()
      expect(timeAgo(oneHourAgo)).toBe('1 hour ago')
    })
  })

  describe('startOfToday', () => {
    it('returns today as a YYYY-MM-DD date string', () => {
      const result = startOfToday()
      expect(result).toMatch(dateOnlyPattern)
    })
  })

  describe('startOfWeek', () => {
    it('returns the week start as a YYYY-MM-DD date string', () => {
      const result = startOfWeek()
      expect(result).toMatch(dateOnlyPattern)
    })
  })

  describe('startOfMonth', () => {
    it('returns a YYYY-MM-DD date string with day set to 1', () => {
      const result = startOfMonth()
      const parsed = parseDateOnly(result)
      expect(result).toMatch(dateOnlyPattern)
      expect(parsed.getUTCDate()).toBe(1)
    })
  })

  describe('getDateRange', () => {
    it('returns week range with start_date 7 days before end_date', () => {
      const range = getDateRange('week')
      const start = parseDateOnly(range.start_date)
      const end = parseDateOnly(range.end_date)
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(7)
    })

    it('returns month range', () => {
      const range = getDateRange('month')
      expect(range.start_date).toMatch(dateOnlyPattern)
      expect(range.end_date).toMatch(dateOnlyPattern)
    })

    it('returns year range', () => {
      const range = getDateRange('year')
      const start = parseDateOnly(range.start_date)
      const end = parseDateOnly(range.end_date)
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBeGreaterThanOrEqual(364)
    })
  })

  describe('toInputDate', () => {
    it('converts ISO date to YYYY-MM-DD format', () => {
      const result = toInputDate('2026-06-15T14:30:00Z')
      expect(result).toBe('2026-06-15')
    })
  })

  describe('todayInputDate', () => {
    it('returns today in YYYY-MM-DD format', () => {
      const result = todayInputDate()
      expect(result).toMatch(dateOnlyPattern)
    })
  })
})
