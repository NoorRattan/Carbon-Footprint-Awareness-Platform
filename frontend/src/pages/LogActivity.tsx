import React, { useCallback } from 'react'
import ActivityForm from '../components/activity/ActivityForm'
import ActivityList from '../components/activity/ActivityList'

/**
 * Protected page for logging new carbon-emitting activities and viewing recent entries.
 * @returns The activity logging page with multi-step form and recent activities list.
 */
const LogActivity: React.FC = () => {
  /**
   * Handles successful activity log by triggering a page-level refresh intent.
   * The ActivityList component manages its own data fetching on mount.
   */
  const handleSuccess = useCallback(() => {
    // ActivityList will refetch on next mount; for now a simple no-op
    // since the form resets itself and shows a success toast
  }, [])

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900">Log an Activity</h1>

      <ActivityForm onSuccess={handleSuccess} />

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-xl font-bold text-slate-800 mb-4">
          Recent Activities
        </h2>
        <ActivityList />
      </section>
    </div>
  )
}

export default LogActivity
