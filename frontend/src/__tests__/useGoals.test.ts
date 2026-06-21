import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGoals } from '../hooks/useGoals'
import { goalsApi } from '../services/api'

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

const mockGoal = {
  id: 'goal-1',
  userId: 'user-1',
  title: 'Reduce transport',
  category: 'transport' as const,
  targetReductionPercent: 50,
  targetCarbonKg: 50,
  baselineCarbonKg: 100,
  startDate: '2026-01-01',
  endDate: '2026-06-30',
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('useGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initial state: loading=false, goals=[], error=null', () => {
    const { result } = renderHook(() => useGoals())
    expect(result.current.loading).toBe(false)
    expect(result.current.goals).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('fetchGoals success: sets goals array, loading=false', async (): Promise<void> => {
    vi.mocked(goalsApi.getAll).mockResolvedValue({
      goals: [mockGoal],
    })

    const { result } = renderHook(() => useGoals())

    await act(async (): Promise<void> => {
      await result.current.fetchGoals()
    })

    expect(result.current.goals).toHaveLength(1)
    expect(result.current.goals[0].id).toBe('goal-1')
    expect(result.current.loading).toBe(false)
  })

  it('fetchGoals error: sets error string, loading=false', async (): Promise<void> => {
    vi.mocked(goalsApi.getAll).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useGoals())

    await act(async (): Promise<void> => {
      await result.current.fetchGoals()
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.loading).toBe(false)
  })

  it('createGoal calls goalsApi.create and adds to local state', async (): Promise<void> => {
    vi.mocked(goalsApi.create).mockResolvedValue(mockGoal)

    const { result } = renderHook(() => useGoals())

    await act(async (): Promise<void> => {
      await result.current.createGoal({
        title: 'Reduce transport',
        category: 'transport',
        targetReductionPercent: 50,
        endDate: '2026-06-30',
      })
    })

    expect(goalsApi.create).toHaveBeenCalled()
    expect(result.current.goals).toHaveLength(1)
  })

  it('updateGoal calls goalsApi.update and updates local state', async (): Promise<void> => {
    vi.mocked(goalsApi.getAll).mockResolvedValue({ goals: [mockGoal] })
    vi.mocked(goalsApi.update).mockResolvedValue(undefined)

    const { result } = renderHook(() => useGoals())

    await act(async (): Promise<void> => {
      await result.current.fetchGoals()
    })

    await act(async (): Promise<void> => {
      await result.current.updateGoal('goal-1', { title: 'Updated title' })
    })

    expect(goalsApi.update).toHaveBeenCalledWith('goal-1', { title: 'Updated title' })
    expect(result.current.goals[0].title).toBe('Updated title')
  })

  it('deleteGoal removes item from local state', async (): Promise<void> => {
    vi.mocked(goalsApi.getAll).mockResolvedValue({
      goals: [mockGoal, { ...mockGoal, id: 'goal-2' }],
    })
    vi.mocked(goalsApi.delete).mockResolvedValue(undefined)

    const { result } = renderHook(() => useGoals())

    await act(async (): Promise<void> => {
      await result.current.fetchGoals()
    })

    expect(result.current.goals).toHaveLength(2)

    await act(async (): Promise<void> => {
      await result.current.deleteGoal('goal-1')
    })

    expect(result.current.goals).toHaveLength(1)
    expect(result.current.goals[0].id).toBe('goal-2')
  })
})
