import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import Goals from '../pages/Goals'
import React from 'react'
import { activitiesApi, goalsApi } from '../services/api'
import type { Goal } from '../types'

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
    getSummary: vi.fn().mockResolvedValue({
      totalCarbonKg: 0,
      byCategory: { transport: 0, food: 0, energy: 0, shopping: 0, waste: 0 },
      period: { start: '2026-06-01', end: '2026-06-20' },
    }),
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

  it('renders the goals heading after loading', async (): Promise<void> => {
    renderWithProviders(<Goals />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /My Reduction Goals/i })).toBeInTheDocument()
    })
  })

  it('creates a new goal from the form', async (): Promise<void> => {
    const user = userEvent.setup()
    const createdGoal: Goal = {
      id: 'goal-1',
      title: 'Reduce electricity',
      category: 'energy',
      targetReductionPercent: 25,
      baselineCarbonKg: 100,
      targetCarbonKg: 75,
      startDate: '2026-06-20',
      endDate: '2026-07-20',
      status: 'active',
      createdAt: '2026-06-20T00:00:00Z',
    }
    vi.mocked(goalsApi.create).mockResolvedValue(createdGoal)

    renderWithProviders(<Goals />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Set a New Goal/i })).toBeInTheDocument()
    })

    await user.selectOptions(screen.getByLabelText(/category/i), 'energy')
    await user.type(screen.getByLabelText(/goal title/i), 'Reduce electricity')
    await user.clear(screen.getByLabelText(/target date/i))
    await user.type(screen.getByLabelText(/target date/i), '2026-07-20')
    await user.click(screen.getByRole('button', { name: /set goal/i }))

    await waitFor(() => {
      expect(goalsApi.create).toHaveBeenCalledWith({
        title: 'Reduce electricity',
        category: 'energy',
        targetReductionPercent: 20,
        endDate: '2026-07-20',
      })
    })
  })

  it('deletes an active goal card', async (): Promise<void> => {
    const user = userEvent.setup()
    const activeGoal: Goal = {
      id: 'goal-delete',
      title: 'Reduce transport emissions',
      category: 'transport',
      targetReductionPercent: 20,
      baselineCarbonKg: 120,
      targetCarbonKg: 96,
      startDate: '2026-06-01',
      endDate: '2026-07-01',
      status: 'active',
      createdAt: '2026-06-01T00:00:00Z',
    }
    vi.mocked(goalsApi.getAll).mockResolvedValueOnce({ goals: [activeGoal] })
    vi.mocked(activitiesApi.getSummary).mockResolvedValueOnce({
      totalCarbonKg: 110,
      byCategory: { transport: 110, food: 0, energy: 0, shopping: 0, waste: 0 },
      period: { start: '2026-06-01', end: '2026-06-20' },
    })
    vi.mocked(goalsApi.delete).mockResolvedValue(undefined)

    renderWithProviders(<Goals />)

    await waitFor(() => {
      expect(screen.getByText('Reduce transport emissions')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /delete goal: reduce transport/i }))

    expect(goalsApi.delete).toHaveBeenCalledWith('goal-delete')
  })
})
