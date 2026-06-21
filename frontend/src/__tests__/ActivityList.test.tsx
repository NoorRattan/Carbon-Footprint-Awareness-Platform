import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivityList from '../components/activity/ActivityList'
import { activitiesApi } from '../services/api'

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

const mockActivity = {
  id: 'act-1',
  userId: 'user-1',
  category: 'transport' as const,
  subcategory: 'car_petrol',
  amount: 10,
  unit: 'km',
  carbonKg: 2,
  date: '2026-06-15T12:00:00Z',
  createdAt: '2026-06-15T12:00:00Z',
}

describe('ActivityList', () => {
  it('renders loading state initially', () => {
    // Return an unresolved promise to keep it in loading state
    vi.mocked(activitiesApi.getAll).mockReturnValue(new Promise(() => {}))
    render(<ActivityList />)
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
  })

  it('renders empty state when no activities returned', async (): Promise<void> => {
    vi.mocked(activitiesApi.getAll).mockResolvedValue({ activities: [], total: 0 })
    render(<ActivityList />)
    await waitFor(() => {
      expect(screen.getByText(/no activities logged yet/i)).toBeInTheDocument()
    })
  })

  it('renders error state on API failure', async (): Promise<void> => {
    vi.mocked(activitiesApi.getAll).mockRejectedValue(new Error('API failed'))
    render(<ActivityList />)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('API failed')
    })
  })

  it('renders activities grouped by date', async (): Promise<void> => {
    vi.mocked(activitiesApi.getAll).mockResolvedValue({ activities: [mockActivity], total: 1 })
    render(<ActivityList />)
    await waitFor(() => {
      // Should show the formatted date header
      expect(screen.getByText(/15 Jun 2026/i)).toBeInTheDocument()
      // Should show the subcategory (or its mapped label if available, here we just check if it renders the raw subcategory or the mapped one)
      // For car_petrol, the mapped label is usually something like "Petrol Car", let's check for the formatted carbon value
      expect(screen.getByText('2.0 kg CO₂e')).toBeInTheDocument()
    })
  })

  it('deletes an activity when delete button is clicked', async (): Promise<void> => {
    const user = userEvent.setup()
    vi.mocked(activitiesApi.getAll).mockResolvedValue({ activities: [mockActivity], total: 1 })
    vi.mocked(activitiesApi.delete).mockResolvedValue(undefined)

    render(<ActivityList />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(activitiesApi.delete).toHaveBeenCalledWith('act-1')

    await waitFor(() => {
      expect(screen.getByText(/no activities logged yet/i)).toBeInTheDocument()
    })
  })
})
