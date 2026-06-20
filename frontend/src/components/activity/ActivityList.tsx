import React, { useEffect, useState, useCallback } from 'react'
import { activitiesApi } from '../../services/api'
import { getCategoryIcon, formatCarbon } from '../../utils/carbonFormatter'
import { SUBCATEGORY_CONFIG } from '../../utils/categoryConfig'
import { formatDate } from '../../utils/dateUtils'
import Button from '../ui/Button'
import type { Activity } from '../../types'

/**
 * Displays a list of recent activities grouped by date with category icons and delete functionality.
 * Fetches activities for the last 7 days on mount.
 * @returns An activity list component with grouped entries and delete actions.
 */
const ActivityList: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecent = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        const response = await activitiesApi.getAll({
          start_date: sevenDaysAgo.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
        })
        setActivities(response.activities)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load activities'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    fetchRecent()
  }, [])

  /**
   * Handles deleting an activity by ID.
   * @param id - The activity ID to delete.
   */
  const handleDelete = useCallback(async (id: string): Promise<void> => {
    setDeletingId(id)
    try {
      await activitiesApi.delete(id)
      setActivities((prev) => prev.filter((a) => a.id !== id))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete activity'
      setError(message)
    } finally {
      setDeletingId(null)
    }
  }, [])

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="text-center py-8 text-slate-500">
        Loading recent activities...
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" aria-live="assertive" className="text-center py-8 text-red-600">
        {error}
      </div>
    )
  }

  if (activities.length === 0) {
    return <p className="text-center py-8 text-slate-500">No activities logged yet.</p>
  }

  /** Group activities by date string. */
  const grouped = activities.reduce<Record<string, Activity[]>>((acc, activity) => {
    const dateKey = activity.date.split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(activity)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {formatDate(dateKey)}
          </h3>
          <div className="space-y-2">
            {grouped[dateKey].map((activity) => {
              const subMeta = SUBCATEGORY_CONFIG[activity.subcategory]
              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span aria-hidden="true" className="text-xl flex-shrink-0">
                      {getCategoryIcon(activity.category)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {subMeta?.label || activity.subcategory}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activity.amount} {subMeta?.unit || activity.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                      {formatCarbon(activity.carbonKg)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(activity.id)}
                      loading={deletingId === activity.id}
                      ariaLabel={`Delete ${subMeta?.label || activity.subcategory} activity`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-slate-400 hover:text-red-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityList
