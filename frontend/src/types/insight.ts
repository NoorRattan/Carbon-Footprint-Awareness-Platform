import { ActivityCategory } from './activity'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Recommendation {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly category: ActivityCategory
  readonly estimatedSavingKg: number
  readonly difficulty: Difficulty
}

export interface Insight {
  readonly footprintKg: number
  readonly vsAveragePercent: number
  readonly topCategory: ActivityCategory
  readonly monthlyChangePercent: number
  readonly recommendations: Recommendation[]
  readonly achievements: string[]
  readonly generatedAt: string
}
