import { describe, it, expect } from 'vitest'
import {
  formatCarbon,
  formatImpact,
  getCategoryColor,
  getCategoryIcon,
} from '../utils/carbonFormatter'

describe('carbonFormatter', () => {
  describe('formatCarbon', () => {
    it('formats values below 1 kg as grams', () => {
      expect(formatCarbon(0.5)).toBe('500g CO₂e')
    })

    it('formats values between 1 and 1000 as kg', () => {
      expect(formatCarbon(4.8)).toBe('4.8 kg CO₂e')
    })

    it('formats values above 1000 as tonnes', () => {
      expect(formatCarbon(1500)).toBe('1.50 t CO₂e')
    })

    it('formats 0 as 0g', () => {
      expect(formatCarbon(0)).toBe('0g CO₂e')
    })
  })

  describe('formatImpact', () => {
    it('returns driving equivalent string', () => {
      const result = formatImpact(19.2)
      expect(result).toContain('driving')
      expect(result).toContain('100 km')
    })
  })

  describe('getCategoryColor', () => {
    it('returns correct color for transport', () => {
      expect(getCategoryColor('transport')).toBe('bg-blue-500')
    })

    it('returns correct color for food', () => {
      expect(getCategoryColor('food')).toBe('bg-green-500')
    })

    it('returns correct color for energy', () => {
      expect(getCategoryColor('energy')).toBe('bg-amber-500')
    })

    it('returns correct color for shopping', () => {
      expect(getCategoryColor('shopping')).toBe('bg-purple-500')
    })

    it('returns correct color for waste', () => {
      expect(getCategoryColor('waste')).toBe('bg-slate-500')
    })
  })

  describe('getCategoryIcon', () => {
    it('returns correct icon for transport', () => {
      expect(getCategoryIcon('transport')).toBe('🚗')
    })

    it('returns correct icon for food', () => {
      expect(getCategoryIcon('food')).toBe('🍽️')
    })

    it('returns correct icon for energy', () => {
      expect(getCategoryIcon('energy')).toBe('⚡')
    })

    it('returns correct icon for shopping', () => {
      expect(getCategoryIcon('shopping')).toBe('🛍️')
    })

    it('returns correct icon for waste', () => {
      expect(getCategoryIcon('waste')).toBe('♻️')
    })
  })
})
