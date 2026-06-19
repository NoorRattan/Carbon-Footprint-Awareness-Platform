import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

/**
 * Login page supporting Google OAuth and email/password authentication.
 * Redirects to dashboard on successful sign-in.
 * @returns The sign-in page with Google and email/password options.
 */
const Login: React.FC = () => {
  const navigate = useNavigate()
  const { signInWithGoogle, signInWithEmail } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handles Google sign-in via popup.
   */
  const handleGoogleSignIn = useCallback(async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(message)
    } finally {
      setGoogleLoading(false)
    }
  }, [signInWithGoogle, navigate])

  /**
   * Handles email/password sign-in form submission.
   * @param e - The form submit event.
   */
  const handleEmailSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setEmailLoading(true)
      try {
        await signInWithEmail(email, password)
        navigate('/dashboard')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign-in failed'
        setError(message)
      } finally {
        setEmailLoading(false)
      }
    },
    [signInWithEmail, email, password, navigate]
  )

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Sign in to EcoTrack</h1>
        <p className="text-slate-500">Track your carbon footprint and make a difference</p>
      </div>

      <Card>
        <div className="space-y-6">
          {/* Google sign-in */}
          <Button onClick={handleGoogleSignIn} loading={googleLoading} variant="ghost" size="lg">
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4" aria-hidden="true">
            <hr className="flex-1 border-slate-200" />
            <span className="text-sm text-slate-400">or</span>
            <hr className="flex-1 border-slate-200" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <Button type="submit" loading={emailLoading} size="lg">
              Sign in
            </Button>
          </form>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm"
            >
              {error}
            </div>
          )}
        </div>
      </Card>

      <p className="text-center text-sm text-slate-400">
        By signing in you agree to our{' '}
        <a
          href="/privacy"
          className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          Privacy Policy
        </a>
      </p>
    </div>
  )
}

export default Login
