import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import Login from '../pages/Login'
import React from 'react'
import * as authHook from '../hooks/useAuth'

vi.mock('../firebase', () => ({
  auth: { currentUser: null, signOut: vi.fn(), getIdToken: vi.fn() },
  analytics: null,
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback(null)
    return vi.fn()
  }),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  getIdToken: vi.fn(),
}))

vi.mock('../services/api', () => ({
  activitiesApi: { getAll: vi.fn(), log: vi.fn(), delete: vi.fn(), getSummary: vi.fn() },
  insightsApi: { get: vi.fn(), acknowledge: vi.fn() },
  goalsApi: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  userApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
    syncProfile: vi.fn(),
  },
  educationApi: { getAll: vi.fn(), getBySlug: vi.fn() },
  carbonApi: { calculate: vi.fn() },
}))

const useAuthSpy = vi.spyOn(authHook, 'useAuth')

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UserProvider>{ui}</UserProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Login', () => {
  it('renders sign in options', () => {
    useAuthSpy.mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    })

    renderWithProviders(<Login />)
    expect(screen.getByRole('heading', { name: /sign in to ecotrack/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('handles Google sign in', async (): Promise<void> => {
    const user = userEvent.setup()
    const mockSignInWithGoogle = vi.fn().mockResolvedValue(undefined)
    useAuthSpy.mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle: mockSignInWithGoogle,
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    })

    renderWithProviders(<Login />)
    await user.click(screen.getByRole('button', { name: /continue with google/i }))
    expect(mockSignInWithGoogle).toHaveBeenCalled()
  })

  it('handles Email sign in', async (): Promise<void> => {
    const user = userEvent.setup()
    const mockSignInWithEmail = vi.fn().mockResolvedValue(undefined)
    useAuthSpy.mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signInWithEmail: mockSignInWithEmail,
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    })

    renderWithProviders(<Login />)
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('displays error message on sign in failure', async (): Promise<void> => {
    const user = userEvent.setup()
    const mockSignInWithEmail = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
    useAuthSpy.mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signInWithEmail: mockSignInWithEmail,
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    })

    renderWithProviders(<Login />)
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    })
  })
})
