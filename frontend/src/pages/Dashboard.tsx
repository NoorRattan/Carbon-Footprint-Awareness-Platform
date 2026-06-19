import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useActivities } from '../hooks/useActivities'
import { useInsights } from '../hooks/useInsights'
import FootprintSummary from '../components/dashboard/FootprintSummary'
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown'
import MonthlyTrend from '../components/dashboard/MonthlyTrend'
import RecommendationCard from '../components/advisor/RecommendationCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { insightsApi } from '../services/api'
import type { Recommendation } from '../types'

/**
 * Protected dashboard page showing the user's carbon footprint overview, trends,
 * top recommendations, streak, and quick-log shortcut.
 * @returns The authenticated user dashboard view.
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    summary,
    loading: activitiesLoading,
    error: activitiesError,
    fetchSummary,
  } = useActivities()
  const { insight, loading: insightsLoading, error: insightsError, fetchInsights } = useInsights()
  const [localRecs, setLocalRecs] = useState<Recommendation[]>([])

  useEffect(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    fetchSummary({
      start_date: startOfMonth.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    })
    fetchInsights()
  }, [fetchSummary, fetchInsights])

  useEffect(() => {
    if (insight?.recommendations) {
      setLocalRecs(insight.recommendations.slice(0, 2))
    }
  }, [insight])

  /**
   * Acknowledges a recommendation and removes it from the dashboard preview.
   * @param id - The recommendation ID to acknowledge.
   */
  const handleAcknowledge = useCallback(async (id: string) => {
    try {
      await insightsApi.acknowledge(id)
      setLocalRecs((prev) => prev.filter((r) => r.id !== id))
    } catch {
      // Silently handle — user can retry from insights page
    }
  }, [])

  /** Determine greeting based on time of day. */
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }, [])

  const displayName = user?.displayName?.split(' ')[0] || 'there'
  const totalCarbonKg = summary?.totalCarbonKg ?? 0
  const loading = activitiesLoading || insightsLoading
  const error = activitiesError || insightsError
  const streak = insight?.achievements?.length ?? 0

  /** Generate mock monthly trend data from summary. */
  const monthlyTrendData = useMemo(() => {
    const months: { month: string; carbonKg: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = d.toLocaleDateString('en-GB', {
        month: 'short',
        year: '2-digit',
      })
      months.push({
        month: monthLabel,
        carbonKg: i === 0 ? totalCarbonKg : 0,
      })
    }
    return months
  }, [totalCarbonKg])

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" aria-live="assertive" className="text-center py-12 text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Good {timeOfDay}, {displayName}
      </h1>

      {/* Empty state */}
      {totalCarbonKg === 0 && (
        <Card>
          <div className="text-center space-y-4 py-8">
            <p className="text-lg text-slate-600">
              Welcome to EcoTrack! Log your first activity to see your carbon footprint.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => navigate('/log')}>Log an Activity</Button>
              <Link
                to="/learn"
                className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
              >
                Or explore how it works
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Data state */}
      {totalCarbonKg > 0 && (
        <>
          <Card>
            <FootprintSummary
              totalCarbonKg={totalCarbonKg}
              vsAveragePercent={insight?.vsAveragePercent ?? 0}
              monthlyChangePercent={insight?.monthlyChangePercent ?? 0}
              region="UK"
            />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Breakdown by Category</h2>
              {summary?.byCategory && <CategoryBreakdown data={summary.byCategory} />}
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Monthly Trend</h2>
              <MonthlyTrend data={monthlyTrendData} />
            </Card>
          </div>

          {/* Top 2 recommendations preview */}
          {localRecs.length > 0 && (
            <section aria-labelledby="recommendations-heading">
              <h2 id="recommendations-heading" className="text-xl font-bold text-slate-800 mb-4">
                Top Recommendations
              </h2>
              <div className="space-y-4">
                {localRecs.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onAcknowledge={handleAcknowledge}
                  />
                ))}
              </div>
              <div className="mt-4">
                <Link
                  to="/insights"
                  className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
                >
                  See all insights →
                </Link>
              </div>
            </section>
          )}

          {/* Streak */}
          {streak > 0 && (
            <Card>
              <div
                className="flex items-center gap-2 text-lg font-semibold text-slate-800"
                aria-label={`${streak} day streak`}
              >
                <span aria-hidden="true">🔥</span> {streak}-day streak
              </div>
            </Card>
          )}

          {/* Quick log */}
          <section aria-labelledby="quick-log-heading">
            <h2 id="quick-log-heading" className="text-xl font-bold text-slate-800 mb-4">
              Log Today&apos;s Activities
            </h2>
            <Button onClick={() => navigate('/log')}>Log an Activity</Button>
          </section>
        </>
      )}
    </div>
  )
}

export default Dashboard
