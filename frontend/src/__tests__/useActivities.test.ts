import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useActivities } from '../hooks/useActivities'
import { activitiesApi } from '../services/api'

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

const mockActivity = {
  id: 'act-1',
  userId: 'user-1',
  category: 'transport' as const,
  subcategory: 'car_petrol',
  amount: 25,
  unit: 'km',
  carbonKg: 4.8,
  date: '2026-01-15',
  createdAt: '2026-01-15T10:00:00Z',
}

describe('useActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initial state: loading=false, activities=[], error=null', () => {
    const { result } = renderHook(() => useActivities())
    expect(result.current.loading).toBe(false)
    expect(result.current.activities).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('fetchActivities success: sets activities array, loading=false', async () => {
    vi.mocked(activitiesApi.getAll).mockResolvedValue({
      activities: [mockActivity],
      total: 1,
    })

    const { result } = renderHook(() => useActivities())

    await act(async () => {
      await result.current.fetchActivities()
    })

    expect(result.current.activities).toHaveLength(1)
    expect(result.current.activities[0].id).toBe('act-1')
    expect(result.current.loading).toBe(false)
  })

  it('fetchActivities error: sets error string, loading=false', async () => {
    vi.mocked(activitiesApi.getAll).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useActivities())

    await act(async () => {
      await result.current.fetchActivities()
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.loading).toBe(false)
  })

  it('logActivity calls activitiesApi.log with correct data', async () => {
    vi.mocked(activitiesApi.log).mockResolvedValue(mockActivity)

    const { result } = renderHook(() => useActivities())

    const payload = {
      category: 'transport' as const,
      subcategory: 'car_petrol',
      amount: 25,
      date: '2026-01-15',
    }

    await act(async () => {
      await result.current.logActivity(payload)
    })

    expect(activitiesApi.log).toHaveBeenCalledWith(payload)
    expect(result.current.activities).toHaveLength(1)
  })

  it('deleteActivity removes item from local state', async () => {
    vi.mocked(activitiesApi.getAll).mockResolvedValue({
      activities: [mockActivity, { ...mockActivity, id: 'act-2' }],
      total: 2,
    })
    vi.mocked(activitiesApi.delete).mockResolvedValue(undefined)

    const { result } = renderHook(() => useActivities())

    await act(async () => {
      await result.current.fetchActivities()
    })

    expect(result.current.activities).toHaveLength(2)

    await act(async () => {
      await result.current.deleteActivity('act-1')
    })

    expect(result.current.activities).toHaveLength(1)
    expect(result.current.activities[0].id).toBe('act-2')
  })

  it('fetchSummary sets summary data', async () => {
    const summaryData = {
      totalCarbonKg: 100,
      byCategory: {
        transport: 40,
        food: 25,
        energy: 20,
        shopping: 10,
        waste: 5,
      },
      period: { start: '2026-01-01', end: '2026-01-31' },
    }
    vi.mocked(activitiesApi.getSummary).mockResolvedValue(summaryData)

    const { result } = renderHook(() => useActivities())

    await act(async () => {
      await result.current.fetchSummary()
    })

    expect(result.current.summary).toEqual(summaryData)
    expect(result.current.loading).toBe(false)
  })
})
