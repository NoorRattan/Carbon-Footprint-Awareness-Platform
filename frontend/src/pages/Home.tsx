import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'

/**
 * Public landing page for EcoTrack. Showcases the platform's purpose, how it works,
 * and why carbon footprint awareness matters. All illustrations use inline SVG.
 * @returns The home landing page component.
 */
const Home: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-20">
      {/* Hero section */}
      <section className="text-center py-16 space-y-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Understand and Reduce Your Carbon Footprint
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Track daily activities, get AI-powered personalised insights, and take simple actions
            that make a real difference.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/login')}>
              Get Started Free
            </Button>
            <a
              href="#how-it-works"
              className="text-primary hover:text-primary-dark font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Hero illustration — inline SVG */}
        <div className="flex justify-center" aria-hidden="true">
          <svg
            width="320"
            height="200"
            viewBox="0 0 320 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            <rect
              x="20"
              y="40"
              width="280"
              height="130"
              rx="16"
              fill="#f0fdf4"
              stroke="#86efac"
              strokeWidth="2"
            />
            <circle cx="80" cy="100" r="35" fill="#bbf7d0" />
            <circle cx="80" cy="100" r="20" fill="#22c55e" />
            <text x="80" y="105" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              CO₂
            </text>
            <rect x="140" y="70" width="40" height="60" rx="4" fill="#3b82f6" opacity="0.8" />
            <rect x="190" y="85" width="40" height="45" rx="4" fill="#10b981" opacity="0.8" />
            <rect x="240" y="55" width="40" height="75" rx="4" fill="#f59e0b" opacity="0.8" />
            <line x1="135" y1="135" x2="285" y2="135" stroke="#cbd5e1" strokeWidth="1.5" />
            <path
              d="M140 120 L190 105 L240 75"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="max-w-4xl mx-auto"
      >
        <h2
          id="how-it-works-heading"
          className="text-3xl font-bold text-slate-900 text-center mb-12"
        >
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1: Log */}
          <div className="text-center space-y-4 p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-center" aria-hidden="true">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="32" cy="32" r="30" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
                <rect
                  x="22"
                  y="18"
                  width="20"
                  height="28"
                  rx="3"
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <line x1="26" y1="26" x2="38" y2="26" stroke="#93c5fd" strokeWidth="1.5" />
                <line x1="26" y1="31" x2="38" y2="31" stroke="#93c5fd" strokeWidth="1.5" />
                <line x1="26" y1="36" x2="34" y2="36" stroke="#93c5fd" strokeWidth="1.5" />
                <path
                  d="M28 41 L31 44 L37 38"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Log Your Activities</h3>
            <p className="text-sm text-slate-600">
              Track transport, food, energy, shopping, and waste in under 30 seconds.
            </p>
          </div>

          {/* Step 2: Analyse */}
          <div className="text-center space-y-4 p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-center" aria-hidden="true">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="32" cy="32" r="30" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
                <path
                  d="M32 16 L32 32 L44 38"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="32" cy="32" r="14" stroke="#86efac" strokeWidth="2" fill="none" />
                <circle cx="32" cy="32" r="3" fill="#22c55e" />
                <path d="M18 46 L22 42" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                <circle cx="16" cy="48" r="6" stroke="#22c55e" strokeWidth="2" fill="#f0fdf4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Analyse Your Impact</h3>
            <p className="text-sm text-slate-600">
              See breakdowns by category and compare against regional averages.
            </p>
          </div>

          {/* Step 3: Reduce */}
          <div className="text-center space-y-4 p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-center" aria-hidden="true">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="32" cy="32" r="30" fill="#fefce8" stroke="#f59e0b" strokeWidth="2" />
                <path
                  d="M22 42 L28 32 L34 36 L42 22"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <polygon points="42,18 46,24 38,24" fill="#f59e0b" />
                <circle cx="22" cy="42" r="2.5" fill="#f59e0b" />
                <path d="M18 48 L46 48" stroke="#fcd34d" strokeWidth="1.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Reduce Your Footprint</h3>
            <p className="text-sm text-slate-600">
              Get personalised recommendations and set reduction goals that stick.
            </p>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section aria-labelledby="stats-heading" className="bg-slate-50 -mx-4 px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 id="stats-heading" className="text-3xl font-bold text-slate-900">
            Why It Matters
          </h2>
          <p className="text-xl text-slate-700">
            The average person produces <strong>7 tonnes of CO₂e per year</strong>
          </p>
          <p className="text-lg text-slate-600">
            EcoTrack helps you see exactly where yours comes from
          </p>
          <small className="text-slate-400 block">Source: World Bank 2023</small>
        </div>
      </section>
    </div>
  )
}

export default Home
