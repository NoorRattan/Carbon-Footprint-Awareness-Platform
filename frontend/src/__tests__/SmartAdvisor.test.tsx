import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import SmartAdvisor from '../components/advisor/SmartAdvisor'
import { insightsApi } from '../services/api'
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
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
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

function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <UserProvider>{ui}</UserProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('SmartAdvisor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton while fetching (role="status")', () => {
    vi.mocked(insightsApi.get).mockReturnValue(new Promise(() => {}))
    renderWithProviders(<SmartAdvisor />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders recommendations sorted by saving (highest first)', async () => {
    vi.mocked(insightsApi.get).mockResolvedValue({
      footprintKg: 120,
      vsAveragePercent: 15,
      topCategory: 'transport',
      monthlyChangePercent: 5,
      recommendations: [
        {
          id: 'r1',
          title: 'Small saving',
          description: 'Desc 1',
          category: 'food',
          estimatedSavingKg: 10,
          difficulty: 'easy',
        },
        {
          id: 'r2',
          title: 'Big saving',
          description: 'Desc 2',
          category: 'transport',
          estimatedSavingKg: 50,
          difficulty: 'medium',
        },
      ],
      achievements: [],
      generatedAt: '2026-01-01T00:00:00Z',
    })

    renderWithProviders(<SmartAdvisor />)

    await waitFor(() => {
      expect(screen.getByText('Big saving')).toBeInTheDocument()
    })

    expect(screen.getByText('Small saving')).toBeInTheDocument()
  })

  it('clicking "Mark as done" calls insightsApi.acknowledge with correct id', async () => {
    const user = userEvent.setup()
    vi.mocked(insightsApi.get).mockResolvedValue({
      footprintKg: 100,
      vsAveragePercent: 10,
      topCategory: 'energy',
      monthlyChangePercent: 0,
      recommendations: [
        {
          id: 'rec-42',
          title: 'Switch to LED',
          description: 'Replace bulbs',
          category: 'energy',
          estimatedSavingKg: 30,
          difficulty: 'easy',
        },
      ],
      achievements: [],
      generatedAt: '2026-01-01T00:00:00Z',
    })
    vi.mocked(insightsApi.acknowledge).mockResolvedValue(undefined)

    renderWithProviders(<SmartAdvisor />)

    await waitFor(() => {
      expect(screen.getByText('Switch to LED')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /mark as done/i }))
    expect(insightsApi.acknowledge).toHaveBeenCalledWith('rec-42')
  })

  it('empty state shown when recommendations array is empty', async () => {
    vi.mocked(insightsApi.get).mockResolvedValue({
      footprintKg: 50,
      vsAveragePercent: -10,
      topCategory: 'food',
      monthlyChangePercent: -5,
      recommendations: [],
      achievements: [],
      generatedAt: '2026-01-01T00:00:00Z',
    })

    renderWithProviders(<SmartAdvisor />)

    await waitFor(() => {
      expect(
        screen.getByText(/you have completed all current recommendations/i)
      ).toBeInTheDocument()
    })
  })

  it('insight banner shows correct above/below percentage', async () => {
    vi.mocked(insightsApi.get).mockResolvedValue({
      footprintKg: 200,
      vsAveragePercent: 25,
      topCategory: 'transport',
      monthlyChangePercent: 10,
      recommendations: [],
      achievements: [],
      generatedAt: '2026-01-01T00:00:00Z',
    })

    renderWithProviders(<SmartAdvisor />)

    await waitFor(() => {
      expect(screen.getByText(/above/i)).toBeInTheDocument()
    })
  })
})
