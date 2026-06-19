import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInsights } from '../hooks/useInsights'
import { insightsApi } from '../services/api'

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

const mockInsight = {
  footprintKg: 150,
  vsAveragePercent: 12,
  topCategory: 'transport' as const,
  monthlyChangePercent: -3,
  recommendations: [
    {
      id: 'r1',
      title: 'Walk more',
      description: 'Walk short distances',
      category: 'transport' as const,
      estimatedSavingKg: 20,
      difficulty: 'easy' as const,
    },
  ],
  achievements: [],
  generatedAt: '2026-01-01T00:00:00Z',
}

describe('useInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initial state: insight=null, loading=false', () => {
    const { result } = renderHook(() => useInsights())
    expect(result.current.insight).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('fetchInsights success: sets insight object, loading=false', async () => {
    vi.mocked(insightsApi.get).mockResolvedValue(mockInsight)

    const { result } = renderHook(() => useInsights())

    await act(async () => {
      await result.current.fetchInsights()
    })

    expect(result.current.insight).toEqual(mockInsight)
    expect(result.current.loading).toBe(false)
  })

  it('acknowledgeRecommendation calls insightsApi.acknowledge with id', async () => {
    vi.mocked(insightsApi.get).mockResolvedValue(mockInsight)
    vi.mocked(insightsApi.acknowledge).mockResolvedValue(undefined)

    const { result } = renderHook(() => useInsights())

    await act(async () => {
      await result.current.fetchInsights()
    })

    await act(async () => {
      await result.current.acknowledgeRecommendation('r1')
    })

    expect(insightsApi.acknowledge).toHaveBeenCalledWith('r1')
    expect(result.current.insight?.recommendations).toHaveLength(0)
  })

  it('fetchInsights error: sets error string', async () => {
    vi.mocked(insightsApi.get).mockRejectedValue(new Error('API down'))

    const { result } = renderHook(() => useInsights())

    await act(async () => {
      await result.current.fetchInsights()
    })

    expect(result.current.error).toBe('API down')
    expect(result.current.loading).toBe(false)
  })
})
