import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { auth } from '../firebase'
import {
  Activity,
  ActivityCreateRequest,
  ActivityFilterParams,
  ActivitiesResponse,
  ActivitiesSummary,
  DateRangeParams,
  Insight,
  Recommendation,
  Goal,
  GoalCreateRequest,
  GoalUpdateRequest,
  GoalsResponse,
  GoalStatus,
  UserProfile,
  UserProfileUpdateRequest,
  EducationListResponse,
  EducationArticle,
  CarbonCalculateRequest,
  CarbonCalculateResponse,
  ACTIVITY_CATEGORIES,
} from '../types'

type RawActivity = Omit<Activity, 'userId' | 'carbonKg' | 'createdAt'> & {
  user_id?: string
  userId?: string
  carbon_kg?: number
  carbonKg?: number
  created_at?: string
  createdAt?: string
}

type RawActivitiesSummary = {
  total_carbon_kg?: number
  totalCarbonKg?: number
  by_category?: ActivitiesSummary['byCategory']
  byCategory?: ActivitiesSummary['byCategory']
  period: ActivitiesSummary['period']
}

type RawRecommendation = Omit<Recommendation, 'estimatedSavingKg'> & {
  estimated_saving_kg?: number
  estimatedSavingKg?: number
}

type RawInsight = Omit<
  Insight,
  'footprintKg' | 'vsAveragePercent' | 'topCategory' | 'monthlyChangePercent' | 'generatedAt'
> & {
  footprint_kg?: number
  footprintKg?: number
  vs_average_percent?: number
  vsAveragePercent?: number
  top_category?: Activity['category'] | null
  topCategory?: Activity['category'] | null
  monthly_change_percent?: number
  monthlyChangePercent?: number
  generated_at?: string
  generatedAt?: string
  recommendations: RawRecommendation[]
}

type RawGoal = Omit<
  Goal,
  | 'targetReductionPercent'
  | 'baselineCarbonKg'
  | 'targetCarbonKg'
  | 'startDate'
  | 'endDate'
  | 'createdAt'
> & {
  target_reduction_percent?: number
  targetReductionPercent?: number
  baseline_carbon_kg?: number
  baselineCarbonKg?: number
  target_carbon_kg?: number
  targetCarbonKg?: number
  start_date?: string
  startDate?: string
  end_date?: string
  endDate?: string
  created_at?: string
  createdAt?: string
}

type RawUserProfile = Omit<
  UserProfile,
  'displayName' | 'dietType' | 'householdSize' | 'createdAt'
> & {
  display_name?: string
  displayName?: string
  diet_type?: UserProfile['dietType']
  dietType?: UserProfile['dietType']
  household_size?: number
  householdSize?: number
  created_at?: string
  createdAt?: string
}

type RawEducationArticle = Omit<EducationArticle, 'content' | 'readTime' | 'updatedAt'> & {
  content?: string
  read_time?: number
  readTime?: number
  updated_at?: string
  updatedAt?: string
}

const DEFAULT_ACTIVITY_CATEGORY = ACTIVITY_CATEGORIES[0]

const EMPTY_CATEGORY_TOTALS = ACTIVITY_CATEGORIES.reduce<ActivitiesSummary['byCategory']>(
  (totals, category) => ({
    ...totals,
    [category]: 0,
  }),
  {} as ActivitiesSummary['byCategory']
)

const mapActivity = (activity: RawActivity): Activity => ({
  id: activity.id,
  userId: activity.userId ?? activity.user_id ?? '',
  category: activity.category,
  subcategory: activity.subcategory,
  amount: activity.amount,
  unit: activity.unit,
  carbonKg: activity.carbonKg ?? activity.carbon_kg ?? 0,
  date: activity.date,
  notes: activity.notes,
  createdAt: activity.createdAt ?? activity.created_at ?? '',
})

const mapActivitiesSummary = (summary: RawActivitiesSummary): ActivitiesSummary => ({
  totalCarbonKg: summary.totalCarbonKg ?? summary.total_carbon_kg ?? 0,
  byCategory: summary.byCategory ?? summary.by_category ?? EMPTY_CATEGORY_TOTALS,
  period: summary.period,
})

const mapRecommendation = (recommendation: RawRecommendation): Recommendation => ({
  id: recommendation.id,
  title: recommendation.title,
  description: recommendation.description,
  category: recommendation.category,
  estimatedSavingKg: recommendation.estimatedSavingKg ?? recommendation.estimated_saving_kg ?? 0,
  difficulty: recommendation.difficulty,
})

const mapInsight = (insight: RawInsight): Insight => ({
  footprintKg: insight.footprintKg ?? insight.footprint_kg ?? 0,
  vsAveragePercent: insight.vsAveragePercent ?? insight.vs_average_percent ?? 0,
  topCategory: insight.topCategory ?? insight.top_category ?? DEFAULT_ACTIVITY_CATEGORY,
  monthlyChangePercent: insight.monthlyChangePercent ?? insight.monthly_change_percent ?? 0,
  recommendations: (insight.recommendations ?? []).map(mapRecommendation),
  achievements: insight.achievements ?? [],
  generatedAt: insight.generatedAt ?? insight.generated_at ?? '',
})

const mapGoal = (goal: RawGoal): Goal => ({
  id: goal.id,
  title: goal.title,
  category: goal.category,
  targetReductionPercent: goal.targetReductionPercent ?? goal.target_reduction_percent ?? 0,
  baselineCarbonKg: goal.baselineCarbonKg ?? goal.baseline_carbon_kg ?? 0,
  targetCarbonKg: goal.targetCarbonKg ?? goal.target_carbon_kg ?? 0,
  startDate: goal.startDate ?? goal.start_date ?? '',
  endDate: goal.endDate ?? goal.end_date ?? '',
  status: goal.status,
  createdAt: goal.createdAt ?? goal.created_at ?? '',
})

const mapUserProfile = (profile: RawUserProfile): UserProfile => ({
  uid: profile.uid,
  email: profile.email,
  displayName: profile.displayName ?? profile.display_name ?? '',
  region: profile.region,
  dietType: profile.dietType ?? profile.diet_type ?? 'average',
  householdSize: profile.householdSize ?? profile.household_size ?? 1,
  createdAt: profile.createdAt ?? profile.created_at ?? '',
  streak: profile.streak,
  badges: profile.badges,
})

const mapEducationArticle = (article: RawEducationArticle): EducationArticle => ({
  slug: article.slug,
  title: article.title,
  content: article.content ?? '',
  category: article.category,
  readTime: article.readTime ?? article.read_time ?? 0,
  updatedAt: article.updatedAt ?? article.updated_at ?? '',
})

const toGoalCreatePayload = (data: GoalCreateRequest) => ({
  title: data.title,
  category: data.category,
  target_reduction_percent: data.targetReductionPercent,
  end_date: data.endDate,
})

const toGoalUpdatePayload = (data: GoalUpdateRequest) => ({
  ...(data.title !== undefined ? { title: data.title } : {}),
  ...(data.endDate !== undefined ? { end_date: data.endDate } : {}),
  ...(data.status !== undefined ? { status: data.status } : {}),
})

const toUserProfileUpdatePayload = (data: UserProfileUpdateRequest) => ({
  ...(data.displayName !== undefined ? { display_name: data.displayName } : {}),
  ...(data.region !== undefined ? { region: data.region } : {}),
  ...(data.dietType !== undefined ? { diet_type: data.dietType } : {}),
  ...(data.householdSize !== undefined ? { household_size: data.householdSize } : {}),
})

const getApiBaseUrl = (): string => {
  if (
    typeof window !== 'undefined' &&
    ['ecotrack-app-2026-1.web.app', 'ecotrack-app-2026-1.firebaseapp.com'].includes(
      window.location.hostname
    )
  ) {
    return '/api/v1'
  }

  return import.meta.env.VITE_API_BASE_URL || '/api/v1'
}

// Create axios instance
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — get token from firebase directly (NOT useAuth)
apiClient.interceptors.request.use(
  /**
   * Request interceptor to attach Firebase ID Token to outgoing requests.
   * @param config The Axios request config.
   * @returns The modified Axios request config.
   */
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  /**
   * Request interceptor error handler.
   * @param error The request error.
   * @returns Rejected promise with the error.
   */
  (error: unknown) => {
    return Promise.reject(error)
  }
)

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  /**
   * Response interceptor pass-through.
   * @param response The Axios response.
   * @returns The Axios response.
   */
  (response) => response,
  /**
   * Response interceptor error handler, routing 401s to /login.
   * @param error The response error.
   * @returns Rejected promise with the error.
   */
  async (error: AxiosError<unknown>): Promise<never> => {
    if (error.response?.status === 401) {
      await auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Export typed API groups

/**
 * API service group for managing user logged activities.
 */
export const activitiesApi = {
  /**
   * Fetches logged activities within the specified filter parameters.
   * @param params Optional filters for pagination, categories, and date ranges.
   * @returns A promise resolving to the list of activities and total count.
   */
  getAll: (params?: ActivityFilterParams): Promise<ActivitiesResponse> =>
    apiClient
      .get<{ activities: RawActivity[]; total: number }>('/activities', { params })
      .then((r) => ({
        activities: r.data.activities.map(mapActivity),
        total: r.data.total,
      })),

  /**
   * Logs a new carbon-emitting activity.
   * @param data The activity payload.
   * @returns A promise resolving to the newly created activity.
   */
  log: (data: ActivityCreateRequest): Promise<Activity> =>
    apiClient.post<RawActivity>('/activities', data).then((r) => mapActivity(r.data)),

  /**
   * Deletes a logged activity.
   * @param id The ID of the activity to delete.
   * @returns A promise resolving when the deletion is completed.
   */
  delete: (id: string): Promise<void> => apiClient.delete(`/activities/${id}`).then((r) => r.data),

  /**
   * Fetches a summary of carbon emissions grouped by category.
   * @param params Optional date range constraints.
   * @returns A promise resolving to the activities summary data.
   */
  getSummary: (params?: DateRangeParams): Promise<ActivitiesSummary> =>
    apiClient
      .get<RawActivitiesSummary>('/activities/summary', { params })
      .then((r) => mapActivitiesSummary(r.data)),
}

/**
 * API service group for managing recommendations and insights.
 */
export const insightsApi = {
  /**
   * Fetches or triggers regeneration of personalized insights.
   * @returns A promise resolving to the user's carbon footprint insights.
   */
  get: (): Promise<Insight> =>
    apiClient.get<RawInsight>('/insights').then((r) => mapInsight(r.data)),

  /**
   * Acknowledges a specific recommendation to filter it from future lists.
   * @param id The ID of the recommendation to acknowledge.
   * @returns A promise resolving when acknowledgment completes.
   */
  acknowledge: (id: string): Promise<void> =>
    apiClient.post(`/insights/acknowledge/${id}`).then((r) => r.data),
}

/**
 * API service group for managing user goals.
 */
export const goalsApi = {
  /**
   * Fetches user goals, optionally filtered by status.
   * @param status Optional goal status filter.
   * @returns A promise resolving to the list of goals.
   */
  getAll: (status?: GoalStatus): Promise<GoalsResponse> =>
    apiClient.get<{ goals: RawGoal[] }>('/goals', { params: { status } }).then((r) => ({
      goals: r.data.goals.map(mapGoal),
    })),

  /**
   * Creates a new carbon reduction goal.
   * @param data The goal configuration details.
   * @returns A promise resolving to the created goal.
   */
  create: (data: GoalCreateRequest): Promise<Goal> =>
    apiClient.post<RawGoal>('/goals', toGoalCreatePayload(data)).then((r) => mapGoal(r.data)),

  /**
   * Updates an existing goal's title, end date, or status.
   * @param id The ID of the goal to update.
   * @param data The update payload.
   * @returns A promise resolving when the update completes.
   */
  update: (id: string, data: GoalUpdateRequest): Promise<void> =>
    apiClient.put(`/goals/${id}`, toGoalUpdatePayload(data)).then((r) => r.data),

  /**
   * Deletes a goal.
   * @param id The ID of the goal to delete.
   * @returns A promise resolving when the deletion is completed.
   */
  delete: (id: string): Promise<void> => apiClient.delete(`/goals/${id}`).then((r) => r.data),
}

/**
 * API service group for managing user profiles and account cleanup.
 */
export const userApi = {
  /**
   * Fetches the logged-in user's profile.
   * @returns A promise resolving to the user profile document.
   */
  getProfile: (): Promise<UserProfile> =>
    apiClient.get<RawUserProfile>('/user/profile').then((r) => mapUserProfile(r.data)),

  /**
   * Updates fields on the user's profile.
   * @param data The profile updates payload.
   * @returns A promise resolving when the update completes.
   */
  updateProfile: (data: UserProfileUpdateRequest): Promise<void> =>
    apiClient.put('/user/profile', toUserProfileUpdatePayload(data)).then((r) => r.data),

  /**
   * Wipes all user data (activities, goals, insights, profile) under GDPR compliance.
   * @returns A promise resolving when account deletion is complete.
   */
  deleteAccount: (): Promise<void> => apiClient.delete('/user/account').then((r) => r.data),

  /**
   * Synchronizes or auto-creates the user's backend profile on login.
   * @returns A promise resolving to the synced user profile document.
   */
  syncProfile: (): Promise<UserProfile> =>
    apiClient.get<RawUserProfile>('/user/profile').then((r) => mapUserProfile(r.data)),
}

/**
 * API service group for accessing educational articles.
 */
export const educationApi = {
  /**
   * Fetches a list of educational articles, optionally filtered by category.
   * @param category Optional category filter.
   * @returns A promise resolving to the list of articles.
   */
  getAll: (category?: string): Promise<EducationListResponse> =>
    apiClient
      .get<{ articles: RawEducationArticle[] }>('/education', { params: { category } })
      .then((r) => ({ articles: r.data.articles.map(mapEducationArticle) })),

  /**
   * Fetches a full educational article by its slug.
   * @param slug Alphanumeric and hyphen-only slug identifier.
   * @returns A promise resolving to the full article details.
   */
  getBySlug: (slug: string): Promise<EducationArticle> =>
    apiClient
      .get<RawEducationArticle>(`/education/${slug}`)
      .then((r) => mapEducationArticle(r.data)),
}

/**
 * API service group for public carbon calculator previews.
 */
export const carbonApi = {
  /**
   * Performs an ephemeral carbon footprint calculation.
   * @param data The calculation parameters.
   * @returns A promise resolving to the carbon estimation.
   */
  calculate: (data: CarbonCalculateRequest): Promise<CarbonCalculateResponse> =>
    apiClient.post<CarbonCalculateResponse>('/calculate', data).then((r) => r.data),
}
