import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressBar from '../components/ui/ProgressBar'

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

describe('ProgressBar', () => {
  it('renders with correct ARIA attributes', () => {
    render(<ProgressBar value={50} max={100} label="Goal progress" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '50')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-label', 'Goal progress')
  })

  it('displays percentage text when showPercentage is true', () => {
    render(<ProgressBar value={75} max={100} label="Test" showPercentage />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('hides percentage text when showPercentage is false', () => {
    render(<ProgressBar value={75} max={100} label="Test" showPercentage={false} />)
    expect(screen.queryByText('75%')).not.toBeInTheDocument()
  })

  it('clamps percentage at 100 when value exceeds max', () => {
    render(<ProgressBar value={200} max={100} label="Over" />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('returns 0% when max is 0', () => {
    render(<ProgressBar value={50} max={0} label="Zero max" />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
