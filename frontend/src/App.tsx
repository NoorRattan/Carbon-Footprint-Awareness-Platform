import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const LogActivity = lazy(() => import('./pages/LogActivity'))
const Insights = lazy(() => import('./pages/Insights'))
const Goals = lazy(() => import('./pages/Goals'))
const Learn = lazy(() => import('./pages/Learn'))
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const Privacy = lazy(() => import('./pages/Privacy'))
const NotFound = lazy(() => import('./pages/NotFound'))

/**
 * ProtectedRoute component that blocks access to unauthenticated sessions.
 * @returns React element for child routes or redirect.
 */
const ProtectedRoute: React.FC = () => {
  const authContext = useContext(AuthContext)

  if (!authContext) {
    throw new Error('ProtectedRoute must be used within an AuthProvider')
  }

  const { user, loading } = authContext

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50"
        role="status"
        aria-label="Loading session"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

/**
 * Main App component containing routing mapping.
 * @returns The main application router view.
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div
            className="min-h-screen flex items-center justify-center bg-slate-50"
            role="status"
            aria-label="Loading page"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:slug" element={<ArticleDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<Privacy />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/log" element={<LogActivity />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
