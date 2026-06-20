import { ActivityCategory } from './activity'

/** Recommendation implementation difficulty shown in UI badges. */
export type Difficulty = 'easy' | 'medium' | 'hard'

/** Personalized recommendation returned as part of an insight. */
export interface Recommendation {
  /** Unique recommendation identifier. */
  readonly id: string
  /** Short recommendation title. */
  readonly title: string
  /** Explanation of the recommended action. */
  readonly description: string
  /** Activity category the recommendation targets. */
  readonly category: ActivityCategory
  /** Estimated annual carbon saving in kg CO2e. */
  readonly estimatedSavingKg: number
  /** Estimated difficulty for the user to complete. */
  readonly difficulty: Difficulty
}

/** Personalized carbon insight summary for a user. */
export interface Insight {
  /** Total footprint for the current period in kg CO2e. */
  readonly footprintKg: number
  /** Difference from regional average, where negative means below average. */
  readonly vsAveragePercent: number
  /** Highest-impact activity category. */
  readonly topCategory: ActivityCategory
  /** Month-over-month footprint change percentage. */
  readonly monthlyChangePercent: number
  /** Personalized recommendations for reducing emissions. */
  readonly recommendations: Recommendation[]
  /** Achievement labels generated with the insight. */
  readonly achievements: string[]
  /** ISO timestamp when the insight was generated. */
  readonly generatedAt: string
}
