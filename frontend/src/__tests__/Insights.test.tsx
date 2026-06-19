import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import Insights from '../pages/Insights'
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
  activitiesApi: { getAll: vi.fn(), log: vi.fn(), delete: vi.fn(), getSummary: vi.fn() },
  insightsApi: {
    get: vi.fn().mockResolvedValue({
      current_month_carbon_kg: 0,
      comparison_to_last_month: 0,
      recommendations: [],
    }),
    acknowledge: vi.fn(),
  },
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

describe('Insights Page', () => {
  it('renders the insights heading', () => {
    renderWithProviders(<Insights />)
    expect(screen.getByRole('heading', { name: /Your Carbon Insights/i })).toBeInTheDocument()
  })
})
