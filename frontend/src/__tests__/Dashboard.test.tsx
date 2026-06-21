import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import Dashboard from '../pages/Dashboard'
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
    getSummary: vi.fn().mockResolvedValue({ total_carbon_kg: 0, by_category: {} }),
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

// Mock recharts in MonthlyTrend to avoid svg issues
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
    LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Line: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
  }
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UserProvider>{ui}</UserProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Dashboard Page', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders dashboard content after loading', async (): Promise<void> => {
    renderWithProviders(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Good/i })).toBeInTheDocument()
    })
  })
})
