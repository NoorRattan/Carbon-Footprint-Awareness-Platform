import { ActivityCategory } from './activity'

/** Categories that can be targeted by a reduction goal. */
export type GoalCategory = ActivityCategory | 'total'

/** Lifecycle states for carbon reduction goals. */
export type GoalStatus = 'active' | 'completed' | 'failed'

/** Carbon reduction goal stored for a user. */
export interface Goal {
  /** Unique goal identifier. */
  readonly id: string
  /** User-facing goal title. */
  readonly title: string
  /** Category covered by the goal. */
  readonly category: GoalCategory
  /** Target reduction percentage from the baseline. */
  readonly targetReductionPercent: number
  /** Baseline carbon footprint in kg CO2e. */
  readonly baselineCarbonKg: number
  /** Target carbon footprint in kg CO2e. */
  readonly targetCarbonKg: number
  /** Goal start date in YYYY-MM-DD format. */
  readonly startDate: string
  /** Goal target date in YYYY-MM-DD format. */
  readonly endDate: string
  /** Current goal lifecycle status. */
  readonly status: GoalStatus
  /** ISO timestamp when the goal was created. */
  readonly createdAt: string
}

/** Payload for creating a carbon reduction goal. */
export interface GoalCreateRequest {
  /** User-facing goal title. */
  readonly title: string
  /** Category covered by the goal. */
  readonly category: GoalCategory
  /** Target reduction percentage from the baseline. */
  readonly targetReductionPercent: number
  /** Goal target date in YYYY-MM-DD format. */
  readonly endDate: string
}

/** Payload for updating an existing carbon reduction goal. */
export interface GoalUpdateRequest {
  /** Updated goal title. */
  readonly title?: string
  /** Updated target date in YYYY-MM-DD format. */
  readonly endDate?: string
  /** Updated lifecycle status. */
  readonly status?: GoalStatus
}

/** Goals list endpoint response. */
export interface GoalsResponse {
  /** Returned goal records. */
  readonly goals: Goal[]
}
