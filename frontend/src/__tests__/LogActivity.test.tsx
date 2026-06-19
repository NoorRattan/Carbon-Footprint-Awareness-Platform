import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import LogActivity from '../pages/LogActivity'
import React from 'react'

vi.mock('../firebase', () => ({
  auth: { currentUser: null, signOut: vi.fn() },
  analytics: null,
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback(null)
    return vi.fn()
  }),
}))

vi.mock('../services/api', () => ({
  activitiesApi: {
    getAll: vi.fn().mockResolvedValue({ activities: [], total: 0 }),
    log: vi.fn(),
    delete: vi.fn(),
    getSummary: vi.fn(),
  },
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

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UserProvider>{ui}</UserProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LogActivity Page', () => {
  it('renders the log activity heading', () => {
    renderWithProviders(<LogActivity />)
    expect(screen.getByRole('heading', { name: /Log an Activity/i })).toBeInTheDocument()
  })

  it('renders the recent activities section', () => {
    renderWithProviders(<LogActivity />)
    expect(screen.getByRole('heading', { name: /Recent Activities/i })).toBeInTheDocument()
  })
})
