import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Application footer with navigation links, attribution, and accessibility landmark.
 * @returns The footer component.
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-slate-200" role="contentinfo">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-lg text-primary">
              <span aria-hidden="true">🌿</span>
              EcoTrack
            </Link>
            <p className="mt-2 text-sm text-slate-500">
              Track, understand, and reduce your carbon footprint.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="text-sm text-slate-500 hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/log"
                  className="text-sm text-slate-500 hover:text-primary transition-colors"
                >
                  Log Activity
                </Link>
              </li>
              <li>
                <Link
                  to="/learn"
                  className="text-sm text-slate-500 hover:text-primary transition-colors"
                >
                  Learn
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/insights"
                  className="text-sm text-slate-500 hover:text-primary transition-colors"
                >
                  Insights
                </Link>
              </li>
              <li>
                <Link
                  to="/goals"
                  className="text-sm text-slate-500 hover:text-primary transition-colors"
                >
                  Goals
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-slate-500 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
          &copy; {currentYear} EcoTrack. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
