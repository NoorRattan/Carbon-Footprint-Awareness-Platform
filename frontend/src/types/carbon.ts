import type { ActivityCategory } from './activity'

/** Payload for requesting a one-off carbon calculation preview. */
export interface CarbonCalculateRequest {
  /** Top-level activity category. */
  readonly category: ActivityCategory
  /** Calculator subcategory key. */
  readonly subcategory: string
  /** Quantity to calculate against the selected subcategory. */
  readonly amount: number
}

/** Response from the carbon calculator preview endpoint. */
export interface CarbonCalculateResponse {
  /** Calculated carbon impact in kg CO2e. */
  readonly carbon_kg: number
  /** Unit label used by the calculator. */
  readonly unit: string
  /** Human-readable calculator description. */
  readonly description: string
}
