import { CATEGORY_CONFIG } from './categoryConfig'
import type { ActivityCategory } from '../types/activity'

/**
 * Formats a carbon value in kg CO₂e into a human-readable string.
 * @param kg - Carbon value in kilograms
 * @returns Formatted string e.g. "450g CO₂e", "4.8 kg CO₂e", "1.23 t CO₂e"
 */
export function formatCarbon(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)}g CO₂e`
  if (kg < 1000) return `${kg.toFixed(1)} kg CO₂e`
  return `${(kg / 1000).toFixed(2)} t CO₂e`
}

/**
 * Returns a human-equivalent description of a carbon amount.
 * @param kg - Carbon value in kilograms
 * @returns Human-readable equivalent string
 */
export function formatImpact(kg: number): string {
  // 0.192 kg CO₂e per km by petrol car (UK DESNZ 2024)
  const km = Math.round(kg / 0.192)
  return `equivalent to driving ${km} km by petrol car`
}

/**
 * Returns the Tailwind background colour class for a given activity category.
 * @param category - The activity category
 * @returns Tailwind bg class string
 */
export function getCategoryColor(category: ActivityCategory): string {
  return CATEGORY_CONFIG[category].color
}

/**
 * Returns the emoji icon for a given activity category.
 * @param category - The activity category
 * @returns Emoji string
 */
export function getCategoryIcon(category: ActivityCategory): string {
  return CATEGORY_CONFIG[category].icon
}
