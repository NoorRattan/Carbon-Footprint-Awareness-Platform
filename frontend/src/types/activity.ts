/** All valid activity category identifiers. */
export const ACTIVITY_CATEGORIES = ['transport', 'food', 'energy', 'shopping', 'waste'] as const

/** Union type of all valid activity categories. */
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]

/** Date range returned for summary queries. */
export interface ActivitySummaryPeriod {
  /** Start date for the summary range in YYYY-MM-DD format. */
  readonly start: string
  /** End date for the summary range in YYYY-MM-DD format. */
  readonly end: string
}

/** Carbon-emitting activity stored for a user. */
export interface Activity {
  /** Unique activity identifier. */
  readonly id: string
  /** Firebase user identifier that owns the activity. */
  readonly userId: string
  /** Top-level carbon activity category. */
  readonly category: ActivityCategory
  /** Subcategory key used by the carbon calculator. */
  readonly subcategory: string
  /** User-entered quantity for the selected subcategory. */
  readonly amount: number
  /** Unit label for the amount, such as km or kg. */
  readonly unit: string
  /** Calculated carbon impact in kg CO2e. */
  readonly carbonKg: number
  /** Activity date in YYYY-MM-DD format. */
  readonly date: string
  /** Optional user note for the activity. */
  readonly notes?: string
  /** ISO timestamp when the activity was created. */
  readonly createdAt: string
}

/** Local form state for the activity logging flow. */
export interface ActivityFormData {
  /** Selected category, or an empty value before the user chooses one. */
  readonly category: ActivityCategory | ''
  /** Selected calculator subcategory key. */
  readonly subcategory: string
  /** User-entered amount as input text. */
  readonly amount: string
  /** Activity date in YYYY-MM-DD input format. */
  readonly date: string
  /** Optional notes text. */
  readonly notes: string
}

/** Aggregated activity totals for a date range. */
export interface ActivitiesSummary {
  /** Total carbon emitted in kg CO2e. */
  readonly totalCarbonKg: number
  /** Carbon totals keyed by activity category. */
  readonly byCategory: Record<ActivityCategory, number>
  /** Date range covered by the summary. */
  readonly period: ActivitySummaryPeriod
}

/** Optional filters for the activities list endpoint. */
export interface ActivityFilterParams {
  /** Inclusive start date in YYYY-MM-DD format. */
  readonly start_date?: string
  /** Inclusive end date in YYYY-MM-DD format. */
  readonly end_date?: string
  /** Optional activity category filter. */
  readonly category?: ActivityCategory
  /** Optional maximum number of activities to return. */
  readonly limit?: number
}

/** Payload for creating a new activity. */
export interface ActivityCreateRequest {
  /** Top-level activity category. */
  readonly category: ActivityCategory
  /** Calculator subcategory key. */
  readonly subcategory: string
  /** Quantity entered by the user. */
  readonly amount: number
  /** Activity date in YYYY-MM-DD format. */
  readonly date: string
  /** Optional user note. */
  readonly notes?: string
}

/** Paginated activities endpoint response. */
export interface ActivitiesResponse {
  /** Returned activity records. */
  readonly activities: Activity[]
  /** Total number of matching activities. */
  readonly total: number
}

/** Shared optional date range query parameters. */
export interface DateRangeParams {
  /** Inclusive start date in YYYY-MM-DD format. */
  readonly start_date?: string
  /** Inclusive end date in YYYY-MM-DD format. */
  readonly end_date?: string
}
