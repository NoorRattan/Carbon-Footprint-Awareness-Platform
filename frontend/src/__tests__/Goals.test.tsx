import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import Goals from '../pages/Goals'
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
    getAll: vi.fn(),
    log: vi.fn(),
    delete: vi.fn(),
    getSummary: vi.fn().mockResolvedValue({ total_carbon_kg: 0, by_category: {} }),
  },
  insightsApi: { get: vi.fn(), acknowledge: vi.fn() },
  goalsApi: {
    getAll: vi.fn().mockResolvedValue({ goals: [] }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
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

describe('Goals Page', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<Goals />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders the goals heading after loading', async () => {
    renderWithProviders(<Goals />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /My Reduction Goals/i })).toBeInTheDocument()
    })
  })
})
