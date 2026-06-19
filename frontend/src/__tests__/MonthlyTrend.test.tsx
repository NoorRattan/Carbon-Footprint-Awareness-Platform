import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MonthlyTrend from '../components/dashboard/MonthlyTrend'
import React from 'react'

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

// Mock recharts to avoid complex SVG rendering in jsdom
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
  }
})

describe('MonthlyTrend', () => {
  it('renders a line chart when data is provided', () => {
    const data = [
      { month: 'Jan', carbonKg: 100 },
      { month: 'Feb', carbonKg: 80 },
    ]
    render(<MonthlyTrend data={data} />)
    expect(screen.getByRole('img', { name: 'Monthly carbon footprint trend' })).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders empty state message when data is empty', () => {
    render(<MonthlyTrend data={[]} />)
    expect(screen.getByText(/not enough data/i)).toBeInTheDocument()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })
})
