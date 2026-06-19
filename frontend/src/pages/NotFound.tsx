import React from 'react'
import { Link } from 'react-router-dom'

/**
 * 404 Not Found page displayed for unmatched routes.
 * Provides navigation links back to home and dashboard.
 * @returns The not found error page.
 */
const NotFound: React.FC = () => {
  return (
    <div className="text-center py-20 space-y-6">
      <div className="space-y-2">
        <p className="text-6xl font-bold text-slate-300">404</p>
        <h1 className="text-3xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-lg text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/"
          className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
        >
          Go home
        </Link>
        <Link
          to="/dashboard"
          className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFound
