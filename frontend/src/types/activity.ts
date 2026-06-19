export type ActivityCategory = 'transport' | 'food' | 'energy' | 'shopping' | 'waste'

export interface Activity {
  readonly id: string
  readonly userId: string
  readonly category: ActivityCategory
  readonly subcategory: string
  readonly amount: number
  readonly unit: string
  readonly carbonKg: number
  readonly date: string
  readonly notes?: string
  readonly createdAt: string
}

export interface ActivityFormData {
  category: ActivityCategory | ''
  subcategory: string
  amount: string
  date: string
  notes: string
}

export interface ActivitiesSummary {
  totalCarbonKg: number
  byCategory: Record<ActivityCategory, number>
  period: {
    start: string
    end: string
  }
}

export interface ActivityFilterParams {
  start_date?: string
  end_date?: string
  category?: ActivityCategory
  limit?: number
}

export interface ActivityCreateRequest {
  category: ActivityCategory
  subcategory: string
  amount: number
  date: string
  notes?: string
}

export interface ActivitiesResponse {
  activities: Activity[]
  total: number
}

export interface DateRangeParams {
  start_date?: string
  end_date?: string
}
