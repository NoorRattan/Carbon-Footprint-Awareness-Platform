import { useState, useCallback } from 'react'
import { insightsApi } from '../services/api'
import type { Insight } from '../types'

/** State and actions returned by the useInsights hook. */
export interface UseInsightsReturn {
  /** Current personalized insight, or null before loading. */
  readonly insight: Insight | null
  /** True while insights are being fetched. */
  readonly loading: boolean
  /** Last insights API error message, if present. */
  readonly error: string | null
  /** Fetches or regenerates the current insight. */
  readonly fetchInsights: () => Promise<void>
  /** Acknowledges a recommendation and removes it from local state. */
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
    } catch (err: unknown) {
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
    try {
      await insightsApi.acknowledge(id)
      setInsight((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          recommendations: prev.recommendations.filter((r) => r.id !== id),
        }
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to acknowledge recommendation'
      setError(message)
      throw err
    }
  }, [])

  return {
    insight,
    loading,
    error,
    fetchInsights,
    acknowledgeRecommendation,
  }
}
