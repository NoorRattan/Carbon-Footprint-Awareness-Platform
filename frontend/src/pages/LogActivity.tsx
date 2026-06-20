import React, { useCallback, useState } from 'react'
import ActivityForm from '../components/activity/ActivityForm'
import ActivityList from '../components/activity/ActivityList'

/**
 * Protected page for logging new carbon-emitting activities and viewing recent entries.
 * @returns The activity logging page with multi-step form and recent activities list.
 */
const LogActivity: React.FC = () => {
  const [activityListVersion, setActivityListVersion] = useState(0)

  /**
   * Remounts the recent activity list after a successful submission.
   */
  const handleSuccess = useCallback(() => {
    setActivityListVersion((version) => version + 1)
  }, [])

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900">Log an Activity</h1>

      <ActivityForm onSuccess={handleSuccess} />

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-xl font-bold text-slate-800 mb-4">
          Recent Activities
        </h2>
        <ActivityList key={activityListVersion} />
      </section>
    </div>
  )
}

export default LogActivity
