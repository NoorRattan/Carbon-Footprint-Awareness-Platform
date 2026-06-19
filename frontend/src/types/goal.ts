import { ActivityCategory } from './activity'

export type GoalCategory = ActivityCategory | 'total'
export type GoalStatus = 'active' | 'completed' | 'failed'

export interface Goal {
  readonly id: string
  readonly title: string
  readonly category: GoalCategory
  readonly targetReductionPercent: number
  readonly baselineCarbonKg: number
  readonly targetCarbonKg: number
  readonly startDate: string
  readonly endDate: string
  readonly status: GoalStatus
  readonly createdAt: string
}

export interface GoalCreateRequest {
  title: string
  category: GoalCategory
  targetReductionPercent: number
  endDate: string
}

export interface GoalUpdateRequest {
  title?: string
  endDate?: string
  status?: GoalStatus
}

export interface GoalsResponse {
  goals: Goal[]
}
