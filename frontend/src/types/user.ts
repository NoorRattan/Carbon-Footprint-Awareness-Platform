export type UserRegion = 'UK' | 'US' | 'EU' | 'IN' | 'AU' | 'OTHER'
export type DietType = 'meat-heavy' | 'average' | 'vegetarian' | 'vegan'

export interface UserProfile {
  readonly uid: string
  readonly email: string
  readonly displayName: string
  readonly region: UserRegion
  readonly dietType: DietType
  readonly householdSize: number
  readonly createdAt: string
  readonly streak: number
  readonly badges: string[]
}

export interface UserProfileUpdateRequest {
  displayName?: string
  region?: UserRegion
  dietType?: DietType
  householdSize?: number
}
