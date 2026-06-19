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
} from '../types'

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — get token from firebase directly (NOT useAuth)
apiClient.interceptors.request.use(
  /**
   * Request interceptor to attach Firebase ID Token to outgoing requests.
   * @param config The Axios request config.
   * @returns The modified Axios request config.
   */
  async (config: InternalAxiosRequestConfig) => {
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
  async (error: AxiosError) => {
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
    apiClient.get<ActivitiesResponse>('/activities', { params }).then((r) => r.data),

  /**
   * Logs a new carbon-emitting activity.
   * @param data The activity payload.
   * @returns A promise resolving to the newly created activity.
   */
  log: (data: ActivityCreateRequest): Promise<Activity> =>
    apiClient.post<Activity>('/activities', data).then((r) => r.data),

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
    apiClient.get<ActivitiesSummary>('/activities/summary', { params }).then((r) => r.data),
}

/**
 * API service group for managing recommendations and insights.
 */
export const insightsApi = {
  /**
   * Fetches or triggers regeneration of personalized insights.
   * @returns A promise resolving to the user's carbon footprint insights.
   */
  get: (): Promise<Insight> => apiClient.get<Insight>('/insights').then((r) => r.data),

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
    apiClient.get<GoalsResponse>('/goals', { params: { status } }).then((r) => r.data),

  /**
   * Creates a new carbon reduction goal.
   * @param data The goal configuration details.
   * @returns A promise resolving to the created goal.
   */
  create: (data: GoalCreateRequest): Promise<Goal> =>
    apiClient.post<Goal>('/goals', data).then((r) => r.data),

  /**
   * Updates an existing goal's title, end date, or status.
   * @param id The ID of the goal to update.
   * @param data The update payload.
   * @returns A promise resolving when the update completes.
   */
  update: (id: string, data: GoalUpdateRequest): Promise<void> =>
    apiClient.put(`/goals/${id}`, data).then((r) => r.data),

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
    apiClient.get<UserProfile>('/user/profile').then((r) => r.data),

  /**
   * Updates fields on the user's profile.
   * @param data The profile updates payload.
   * @returns A promise resolving when the update completes.
   */
  updateProfile: (data: UserProfileUpdateRequest): Promise<void> =>
    apiClient.put('/user/profile', data).then((r) => r.data),

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
    apiClient.get<UserProfile>('/user/profile').then((r) => r.data),
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
      .get<EducationListResponse>('/education', { params: { category } })
      .then((r) => r.data),

  /**
   * Fetches a full educational article by its slug.
   * @param slug Alphanumeric and hyphen-only slug identifier.
   * @returns A promise resolving to the full article details.
   */
  getBySlug: (slug: string): Promise<EducationArticle> =>
    apiClient.get<EducationArticle>(`/education/${slug}`).then((r) => r.data),
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
