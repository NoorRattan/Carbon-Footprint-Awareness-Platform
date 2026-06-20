import { useState, useCallback } from 'react'
import { activitiesApi } from '../services/api'
import type {
  Activity,
  ActivityCreateRequest,
  ActivityFilterParams,
  ActivitiesSummary,
  DateRangeParams,
} from '../types'

/** State and actions returned by the useActivities hook. */
export interface UseActivitiesReturn {
  /** Loaded activity records. */
  readonly activities: Activity[]
  /** Total number of activities matching the last fetch. */
  readonly total: number
  /** Carbon summary for the selected date range. */
  readonly summary: ActivitiesSummary | null
  /** True while a fetch request is in progress. */
  readonly loading: boolean
  /** Last activity API error message, if present. */
  readonly error: string | null
  /** Fetches activities with optional filters. */
  readonly fetchActivities: (params?: ActivityFilterParams) => Promise<void>
  /** Fetches activity summary totals with optional date range filters. */
  readonly fetchSummary: (params?: DateRangeParams) => Promise<void>
  /** Logs a new activity and updates local state. */
  readonly logActivity: (data: ActivityCreateRequest) => Promise<Activity>
  /** Deletes an activity and updates local state. */
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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
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
    try {
      const activity = await activitiesApi.log(data)
      setActivities((prev) => [activity, ...prev])
      setTotal((prev) => prev + 1)
      return activity
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log activity'
      setError(message)
      throw err
    }
  }, [])

  /**
   * Deletes an activity and removes it from the local list.
   * @param id - The ID of the activity to delete.
   * @returns A promise that resolves when deletion is complete.
   */
  const deleteActivity = useCallback(async (id: string): Promise<void> => {
    setError(null)
    try {
      await activitiesApi.delete(id)
      setActivities((prev) => prev.filter((a) => a.id !== id))
      setTotal((prev) => Math.max(prev - 1, 0))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete activity'
      setError(message)
      throw err
    }
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
