import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext'
import { useAuth } from '../hooks/useAuth'
import { signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth'

vi.mock('../firebase', () => ({
  auth: { currentUser: null, signOut: vi.fn() },
  analytics: null,
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback({ uid: '123', email: 'test@example.com' })
    return vi.fn()
  }),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn().mockResolvedValue({ user: { uid: '123' } }),
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: { uid: '123' } }),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

const TestComponent = () => {
  const { user, signInWithGoogle, signInWithEmail, signOut: contextSignOut } = useAuth()

  return (
    <div>
      <span data-testid="user-email">{user?.email}</span>
      <button onClick={signInWithGoogle}>Google Sign In</button>
      <button onClick={() => signInWithEmail('test@example.com', 'pass')}>Email Sign In</button>
      <button onClick={contextSignOut}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  it('provides user state and auth methods', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })

    screen.getByText('Google Sign In').click()
    expect(signInWithPopup).toHaveBeenCalled()

    screen.getByText('Email Sign In').click()
    expect(signInWithEmailAndPassword).toHaveBeenCalled()

    screen.getByText('Sign Out').click()
    expect(signOut).toHaveBeenCalled()
  })
})
