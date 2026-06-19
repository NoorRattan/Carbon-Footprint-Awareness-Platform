import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import type { AuthContextType } from '../contexts/AuthContext'

/**
 * Custom hook for consuming the AuthContext. Throws if used outside AuthProvider.
 * @returns The current authentication state and methods.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
