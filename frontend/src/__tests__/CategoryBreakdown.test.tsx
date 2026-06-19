import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown'

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

vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: () => <div data-testid="pie" />,
    Cell: () => <div data-testid="cell" />,
    Legend: () => <div data-testid="legend" />,
    Tooltip: () => <div data-testid="tooltip" />,
  }
})

import React from 'react'

const fiveCategoryData = {
  transport: 50,
  food: 30,
  energy: 25,
  shopping: 15,
  waste: 10,
}

describe('CategoryBreakdown', () => {
  it('chart wrapper div has aria-label="Carbon footprint by category"', () => {
    render(<CategoryBreakdown data={fiveCategoryData} />)
    expect(screen.getByRole('img', { name: 'Carbon footprint by category' })).toBeInTheDocument()
  })

  it('sr-only table is present in the DOM', () => {
    render(<CategoryBreakdown data={fiveCategoryData} />)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    expect(table).toHaveClass('sr-only')
  })

  it('renders one row per category (5 rows)', () => {
    render(<CategoryBreakdown data={fiveCategoryData} />)
    const rows = screen.getAllByRole('row')
    // 1 header row + 5 data rows = 6
    expect(rows).toHaveLength(6)
  })

  it('shows empty state when all category values are zero', () => {
    const emptyData = { transport: 0, food: 0, energy: 0, shopping: 0, waste: 0 }
    render(<CategoryBreakdown data={emptyData} />)
    expect(screen.getByText(/no category data available/i)).toBeInTheDocument()
  })
})
