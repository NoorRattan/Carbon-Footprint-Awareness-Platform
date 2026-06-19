import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import GoalCard from '../components/goals/GoalCard'
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

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UserProvider>{ui}</UserProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

const mockGoal = {
  id: 'goal-1',
  userId: 'user-1',
  title: 'Reduce transport emissions',
  category: 'transport' as const,
  targetCarbonKg: 50,
  targetReductionPercent: 50,
  baselineCarbonKg: 100,
  startDate: '2026-01-01',
  endDate: '2027-06-30',
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('GoalCard', () => {
  it('renders goal title', () => {
    renderWithProviders(<GoalCard goal={mockGoal} currentCarbonKg={75} onDelete={vi.fn()} />)
    expect(screen.getByText('Reduce transport emissions')).toBeInTheDocument()
  })

  it('shows status badge', () => {
    renderWithProviders(<GoalCard goal={mockGoal} currentCarbonKg={75} onDelete={vi.fn()} />)
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('shows progress bar with label', () => {
    renderWithProviders(<GoalCard goal={mockGoal} currentCarbonKg={75} onDelete={vi.fn()} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows days remaining for active goals', () => {
    renderWithProviders(<GoalCard goal={mockGoal} currentCarbonKg={75} onDelete={vi.fn()} />)
    expect(screen.getByText(/remaining/i)).toBeInTheDocument()
  })

  it('has a delete button with accessible label', () => {
    renderWithProviders(<GoalCard goal={mockGoal} currentCarbonKg={75} onDelete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /delete goal/i })).toBeInTheDocument()
  })
})
