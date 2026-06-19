import { useState, useCallback } from 'react'
import { activitiesApi } from '../services/api'
import type {
  Activity,
  ActivityCreateRequest,
  ActivityFilterParams,
  ActivitiesSummary,
  DateRangeParams,
} from '../types'

interface UseActivitiesReturn {
  readonly activities: Activity[]
  readonly total: number
  readonly summary: ActivitiesSummary | null
  readonly loading: boolean
  readonly error: string | null
  readonly fetchActivities: (params?: ActivityFilterParams) => Promise<void>
  readonly fetchSummary: (params?: DateRangeParams) => Promise<void>
  readonly logActivity: (data: ActivityCreateRequest) => Promise<Activity>
  readonly deleteActivity: (id: string) => Promise<void>
}

/**
 * Custom hook for managing activity CRUD operations and summary data.
 * @returns Activity state and action methods.
 */
export function useActivities(): UseActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>([])
  const [total, setTotal] = useState<number>(0)
  const [summary, setSummary] = useState<ActivitiesSummary | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches activities from the API with optional filters.
   * @param params - Optional filter parameters for date range, category, and pagination.
   * @returns A promise that resolves when the fetch is complete.
   */
  const fetchActivities = useCallback(async (params?: ActivityFilterParams): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await activitiesApi.getAll(params)
      setActivities(response.activities)
      setTotal(response.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activities'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Fetches the carbon emissions summary from the API.
   * @param params - Optional date range parameters.
   * @returns A promise that resolves when the fetch is complete.
   */
  const fetchSummary = useCallback(async (params?: DateRangeParams): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const data = await activitiesApi.getSummary(params)
      setSummary(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch summary'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Logs a new activity and prepends it to the local list.
   * @param data - The activity data to submit.
   * @returns A promise resolving to the newly created activity.
   */
  const logActivity = useCallback(async (data: ActivityCreateRequest): Promise<Activity> => {
    setError(null)
    const activity = await activitiesApi.log(data)
    setActivities((prev) => [activity, ...prev])
    setTotal((prev) => prev + 1)
    return activity
  }, [])

  /**
   * Deletes an activity and removes it from the local list.
   * @param id - The ID of the activity to delete.
   * @returns A promise that resolves when deletion is complete.
   */
  const deleteActivity = useCallback(async (id: string): Promise<void> => {
    setError(null)
    await activitiesApi.delete(id)
    setActivities((prev) => prev.filter((a) => a.id !== id))
    setTotal((prev) => prev - 1)
  }, [])

  return {
    activities,
    total,
    summary,
    loading,
    error,
    fetchActivities,
    fetchSummary,
    logActivity,
    deleteActivity,
  }
}
