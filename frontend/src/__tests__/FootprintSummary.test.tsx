import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FootprintSummary from '../components/dashboard/FootprintSummary'

vi.mock('../firebase', () => ({
  auth: { currentUser: null, signOut: vi.fn() },
  analytics: null,
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

describe('FootprintSummary', () => {
  it('renders formatted carbon value', () => {
    render(
      <FootprintSummary
        totalCarbonKg={125.3}
        vsAveragePercent={10}
        monthlyChangePercent={-5}
        region="UK"
      />
    )
    expect(screen.getByText('125.3 kg CO₂e')).toBeInTheDocument()
  })

  it('shows "above average" badge when vsAveragePercent > 0', () => {
    render(
      <FootprintSummary
        totalCarbonKg={200}
        vsAveragePercent={15}
        monthlyChangePercent={3}
        region="UK"
      />
    )
    expect(screen.getByText(/above.*uk.*average/i)).toBeInTheDocument()
  })

  it('shows "below average" badge when vsAveragePercent < 0', () => {
    render(
      <FootprintSummary
        totalCarbonKg={80}
        vsAveragePercent={-20}
        monthlyChangePercent={-8}
        region="UK"
      />
    )
    expect(screen.getByText(/below.*uk.*average/i)).toBeInTheDocument()
  })

  it('displays monthly change percentage', () => {
    render(
      <FootprintSummary
        totalCarbonKg={100}
        vsAveragePercent={5}
        monthlyChangePercent={-12}
        region="US"
      />
    )
    expect(screen.getByText(/12%.*vs last/i)).toBeInTheDocument()
  })
})
