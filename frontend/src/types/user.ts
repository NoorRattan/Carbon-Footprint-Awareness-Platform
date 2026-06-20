/** Supported regional average buckets for footprint comparisons. */
export type UserRegion = 'UK' | 'US' | 'EU' | 'IN' | 'AU' | 'OTHER'

/** Supported diet profile options used for personalized recommendations. */
export type DietType = 'meat-heavy' | 'average' | 'vegetarian' | 'vegan'

/** User profile returned by the backend profile endpoint. */
export interface UserProfile {
  /** Firebase user identifier. */
  readonly uid: string
  /** User email address from Firebase Authentication. */
  readonly email: string
  /** Display name shown throughout the app. */
  readonly displayName: string
  /** Region used for average footprint comparisons. */
  readonly region: UserRegion
  /** Diet type used for recommendation personalization. */
  readonly dietType: DietType
  /** Number of people in the user's household. */
  readonly householdSize: number
  /** ISO timestamp when the profile was created. */
  readonly createdAt: string
  /** Current activity logging streak in days. */
  readonly streak: number
  /** Achievement badge identifiers earned by the user. */
  readonly badges: string[]
}

/** Payload for updating editable profile fields. */
export interface UserProfileUpdateRequest {
  /** Updated display name. */
  readonly displayName?: string
  /** Updated region bucket. */
  readonly region?: UserRegion
  /** Updated diet profile. */
  readonly dietType?: DietType
  /** Updated household size. */
  readonly householdSize?: number
}
