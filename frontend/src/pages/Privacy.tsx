import React from 'react'
import Card from '../components/ui/Card'

/**
 * Public privacy policy page explaining data collection, analytics, authentication, and deletion.
 * @returns The privacy policy page content.
 */
const Privacy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="text-slate-600">Last updated: 20 June 2026</p>
      </header>

      <Card>
        <div className="space-y-6 text-slate-700 leading-7">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">What EcoTrack Collects</h2>
            <p>
              EcoTrack stores the account details needed to run the service, including your email
              address, display name, region, diet type, household size, activities, goals,
              achievements, and generated carbon insights.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">How Your Data Is Used</h2>
            <p>
              Your data is used to calculate carbon estimates, show dashboard summaries, generate
              recommendations, track goals, and keep your profile settings available when you sign
              in.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Authentication</h2>
            <p>
              Sign-in is handled by Firebase Authentication. EcoTrack uses the Firebase ID token to
              protect your private activities, goals, insights, and profile endpoints.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Analytics</h2>
            <p>
              Analytics events are only sent when consent is enabled in the browser. Analytics are
              used to understand product usage and improve reliability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Deleting Your Data</h2>
            <p>
              The profile page includes a delete account action that removes your EcoTrack
              activities, goals, insights, and profile data from Firestore.
            </p>
          </section>
        </div>
      </Card>
    </div>
  )
}

export default Privacy
