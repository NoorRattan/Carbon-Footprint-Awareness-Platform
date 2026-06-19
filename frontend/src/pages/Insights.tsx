import React from 'react'
import SmartAdvisor from '../components/advisor/SmartAdvisor'

/**
 * Protected insights page displaying the personalised SmartAdvisor component.
 * SmartAdvisor handles its own data fetching and recommendation management.
 * @returns The carbon insights page wrapping the SmartAdvisor hero component.
 */
const Insights: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900">Your Carbon Insights</h1>
      <SmartAdvisor />
    </div>
  )
}

export default Insights
