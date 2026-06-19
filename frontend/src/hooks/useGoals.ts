import { useState, useCallback } from 'react'
import { goalsApi } from '../services/api'
import type { Goal, GoalCreateRequest, GoalUpdateRequest, GoalStatus } from '../types'

interface UseGoalsReturn {
  readonly goals: Goal[]
  readonly loading: boolean
  readonly error: string | null
  readonly fetchGoals: (status?: GoalStatus) => Promise<void>
  readonly createGoal: (data: GoalCreateRequest) => Promise<Goal>
  readonly updateGoal: (id: string, data: GoalUpdateRequest) => Promise<void>
  readonly deleteGoal: (id: string) => Promise<void>
}

/**
 * Custom hook for managing carbon reduction goals with CRUD operations.
 * @returns Goal state and action methods.
 */
export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches goals from the API with an optional status filter.
   * @param status - Optional goal status filter.
   * @returns A promise that resolves when the fetch is complete.
   */
  const fetchGoals = useCallback(async (status?: GoalStatus): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await goalsApi.getAll(status)
      setGoals(response.goals)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch goals'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Creates a new carbon reduction goal and appends it to the local list.
   * @param data - The goal creation payload.
   * @returns A promise resolving to the newly created goal.
   */
  const createGoal = useCallback(async (data: GoalCreateRequest): Promise<Goal> => {
    setError(null)
    const goal = await goalsApi.create(data)
    setGoals((prev) => [...prev, goal])
    return goal
  }, [])

  /**
   * Updates a goal and refreshes the local list.
   * @param id - The ID of the goal to update.
   * @param data - The update payload.
   * @returns A promise that resolves when the update is complete.
   */
  const updateGoal = useCallback(async (id: string, data: GoalUpdateRequest): Promise<void> => {
    setError(null)
    await goalsApi.update(id, data)
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)))
  }, [])

  /**
   * Deletes a goal and removes it from the local list.
   * @param id - The ID of the goal to delete.
   * @returns A promise that resolves when deletion is complete.
   */
  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    setError(null)
    await goalsApi.delete(id)
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }, [])

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  }
}
