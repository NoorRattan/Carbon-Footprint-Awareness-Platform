/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import Navbar from '../components/layout/Navbar'
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

// We need to spy on useAuth to return different users
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

describe('Navbar', () => {
  it('renders logo and navigation links', () => {
    useAuthSpy.mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    })

    renderWithProviders(<Navbar />)
    expect(screen.getByText('EcoTrack')).toBeInTheDocument()
    // Links are duplicated in mobile menu, so use getAllByText or specific queries
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  })

  it('shows Sign In button when no user is logged in', () => {
    useAuthSpy.mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    })

    renderWithProviders(<Navbar />)
    const signInLinks = screen.getAllByRole('link', { name: /sign in/i })
    expect(signInLinks.length).toBeGreaterThan(0)
  })

  it('shows user menu button when user is logged in', () => {
    useAuthSpy.mockReturnValue({
      user: { uid: '123', email: 'test@example.com', displayName: 'Test User' } as any,
      loading: false,
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    })

    renderWithProviders(<Navbar />)
    expect(screen.getByRole('button', { name: /Test User/i, expanded: false })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument()
  })

  it('opens user menu when user button is clicked', async () => {
    const user = userEvent.setup()
    useAuthSpy.mockReturnValue({
      user: { uid: '123', email: 'test@example.com', displayName: 'Test User' } as any,
      loading: false,
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    })

    renderWithProviders(<Navbar />)
    const userButton = screen.getByRole('button', { name: /Test User/i })
    await user.click(userButton)

    // The menu should now be visible
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls signOut when sign out is clicked', async () => {
    const user = userEvent.setup()
    const mockSignOut = vi.fn().mockResolvedValue(undefined)
    useAuthSpy.mockReturnValue({
      user: { uid: '123', email: 'test@example.com', displayName: 'Test User' } as any,
      loading: false,
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signOut: mockSignOut,
      getIdToken: vi.fn(),
    })

    renderWithProviders(<Navbar />)
    await user.click(screen.getByRole('button', { name: /Test User/i }))
    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(mockSignOut).toHaveBeenCalled()
  })
})
