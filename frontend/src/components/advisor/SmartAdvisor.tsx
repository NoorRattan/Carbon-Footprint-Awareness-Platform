import React, { useEffect, useState, useCallback } from 'react'
import { useInsights } from '../../hooks/useInsights'
import { formatCarbon } from '../../utils/carbonFormatter'
import { CATEGORY_CONFIG } from '../../utils/categoryConfig'
import { insightsApi } from '../../services/api'
import RecommendationCard from './RecommendationCard'
import type { Recommendation } from '../../types'

/**
 * The hero personalised carbon advisor component. Fetches and displays user insights,
 * top category breakdown, and actionable recommendations with acknowledge/dismiss support.
 * @returns The smart advisor section with personalised insights and recommendation cards.
 */
const SmartAdvisor: React.FC = () => {
  const { insight, loading, error, fetchInsights } = useInsights()
  const [localRecommendations, setLocalRecommendations] = useState<Recommendation[]>([])
  const [fadingId, setFadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  useEffect(() => {
    if (insight?.recommendations) {
      setLocalRecommendations(
        [...insight.recommendations].sort((a, b) => b.estimatedSavingKg - a.estimatedSavingKg)
      )
    }
  }, [insight])

  /**
   * Acknowledges a recommendation with a fade-out animation before removing it.
   * @param id - The recommendation ID to acknowledge.
   */
  const handleAcknowledge = useCallback(async (id: string): Promise<void> => {
    setFadingId(id)
    try {
      await insightsApi.acknowledge(id)
      setTimeout(() => {
        setLocalRecommendations((prev) => prev.filter((r) => r.id !== id))
        setFadingId(null)
      }, 300)
    } catch (err: unknown) {
      void (err instanceof Error ? err.message : err)
      setFadingId(null)
    }
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading recommendations"
        className="space-y-4"
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-slate-200 rounded w-full mb-2" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div role="alert" aria-live="assertive" className="text-center py-8 text-red-600">
        {error}
      </div>
    )
  }

  // Empty state — no insight data yet
  if (!insight || insight.footprintKg === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <h2 className="text-2xl font-bold text-slate-800">Your Personalised Carbon Advisor</h2>
        <p className="text-slate-500 text-lg">
          Start logging activities to get personalised advice
        </p>
      </div>
    )
  }

  const topCategory = insight.topCategory
  const topCategoryLabel = CATEGORY_CONFIG[topCategory]?.label || topCategory
  const region = 'your region'

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Your Personalised Carbon Advisor</h2>

      {/* Insight banner */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-5 border border-primary/20">
        <p className="text-slate-800 text-lg">
          Your footprint is <strong>{formatCarbon(insight.footprintKg)}</strong> this month &mdash;{' '}
          {insight.vsAveragePercent > 0 ? (
            <span className="text-red-600">
              above {region} average{' '}
              <span aria-label="increasing trend">
                <span aria-hidden="true">↑</span>
              </span>
            </span>
          ) : (
            <span className="text-green-600">
              below {region} average{' '}
              <span aria-label="decreasing trend">
                <span aria-hidden="true">↓</span>
              </span>
            </span>
          )}
        </p>
        {insight.monthlyChangePercent !== 0 && (
          <p className="text-sm text-slate-600 mt-1">
            {insight.monthlyChangePercent < 0 ? (
              <span className="text-green-600 font-medium">
                <span aria-hidden="true">↓</span>{' '}
                {Math.abs(insight.monthlyChangePercent).toFixed(0)}% decrease from last month
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                <span aria-hidden="true">↑</span>{' '}
                {Math.abs(insight.monthlyChangePercent).toFixed(0)}% increase from last month
              </span>
            )}
          </p>
        )}
      </div>

      {/* Top category callout */}
      <p className="text-slate-700 font-medium">
        <span aria-hidden="true">{CATEGORY_CONFIG[topCategory]?.icon || '📊'}</span>{' '}
        {topCategoryLabel} is your biggest impact area.
      </p>

      {/* Recommendations */}
      {localRecommendations.length > 0 ? (
        <div className="space-y-4">
          {localRecommendations.map((rec) => (
            <div
              key={rec.id}
              className={`transition-opacity duration-300 ${
                fadingId === rec.id ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <RecommendationCard recommendation={rec} onAcknowledge={handleAcknowledge} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-center py-4">
          You have completed all current recommendations. Great job!
        </p>
      )}
    </div>
  )
}

export default SmartAdvisor
