import { useState, useCallback } from 'react'
import { insightsApi } from '../services/api'
import type { Insight } from '../types'

interface UseInsightsReturn {
  readonly insight: Insight | null
  readonly loading: boolean
  readonly error: string | null
  readonly fetchInsights: () => Promise<void>
  readonly acknowledgeRecommendation: (id: string) => Promise<void>
}

/**
 * Custom hook for fetching personalised carbon insights and acknowledging recommendations.
 * @returns Insight state and action methods.
 */
export function useInsights(): UseInsightsReturn {
  const [insight, setInsight] = useState<Insight | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches the user's personalised carbon insights.
   * @returns A promise that resolves when the fetch is complete.
   */
  const fetchInsights = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const data = await insightsApi.get()
      setInsight(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch insights'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Acknowledges a recommendation and removes it from the local list.
   * @param id - The ID of the recommendation to acknowledge.
   * @returns A promise that resolves when the acknowledgement is complete.
   */
  const acknowledgeRecommendation = useCallback(async (id: string): Promise<void> => {
    setError(null)
    await insightsApi.acknowledge(id)
    setInsight((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        recommendations: prev.recommendations.filter((r) => r.id !== id),
      }
    })
  }, [])

  return {
    insight,
    loading,
    error,
    fetchInsights,
    acknowledgeRecommendation,
  }
}
