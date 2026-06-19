import React, { useEffect, useState, useCallback } from 'react'
import { useGoals } from '../hooks/useGoals'
import { useActivities } from '../hooks/useActivities'
import GoalCard from '../components/goals/GoalCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { CATEGORY_CONFIG } from '../utils/categoryConfig'
import type { ActivityCategory, GoalCategory } from '../types'

/** All categories available for goal setting, including 'total'. */
const GOAL_CATEGORIES: GoalCategory[] = [
  'total',
  'transport',
  'food',
  'energy',
  'shopping',
  'waste',
]

/**
 * Protected goals page for viewing active carbon reduction goals and creating new ones.
 * @returns The goals management page with active goal cards and a new goal creation form.
 */
const Goals: React.FC = () => {
  const { goals, loading, error, fetchGoals, createGoal, deleteGoal } = useGoals()
  const { summary, fetchSummary } = useActivities()
  const [title, setTitle] = useState('')
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('total')
  const [reduction, setReduction] = useState(20)
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  /** Minimum date for goal end date (tomorrow). */
  const minDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  useEffect(() => {
    fetchGoals()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    fetchSummary({
      start_date: startOfMonth.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    })
  }, [fetchGoals, fetchSummary])

  /**
   * Handles new goal form submission.
   * @param e - The form submit event.
   */
  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!title.trim() || !endDate) {
        setFormError('Please fill in all required fields.')
        return
      }

      setFormError(null)
      setCreating(true)
      try {
        await createGoal({
          title: title.trim(),
          category: goalCategory,
          targetReductionPercent: reduction,
          endDate,
        })
        setTitle('')
        setGoalCategory('total')
        setReduction(20)
        setEndDate('')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create goal'
        setFormError(message)
      } finally {
        setCreating(false)
      }
    },
    [title, goalCategory, reduction, endDate, createGoal]
  )

  /**
   * Handles goal deletion.
   * @param id - The goal ID to delete.
   */
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteGoal(id)
      } catch {
        // Error is managed by the hook
      }
    },
    [deleteGoal]
  )

  /**
   * Returns the current carbon kg for a goal's category.
   * @param category - The goal category.
   * @returns Current carbon kg for that category.
   */
  const getCurrentCarbon = (category: GoalCategory): number => {
    if (!summary) return 0
    if (category === 'total') return summary.totalCarbonKg
    return summary.byCategory[category as ActivityCategory] ?? 0
  }

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" aria-live="assertive" className="text-center py-12 text-red-600">
        {error}
      </div>
    )
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900">My Reduction Goals</h1>

      {/* Active goals */}
      {activeGoals.length > 0 ? (
        <div className="space-y-4">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currentCarbonKg={getCurrentCarbon(goal.category)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-center text-slate-500 py-6">
            You have no active goals yet. Set one below!
          </p>
        </Card>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Completed Goals</h2>
          <div className="space-y-3 opacity-70">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                currentCarbonKg={getCurrentCarbon(goal.category)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Set new goal form */}
      <section aria-labelledby="new-goal-heading">
        <h2 id="new-goal-heading" className="text-xl font-bold text-slate-800 mb-4">
          Set a New Goal
        </h2>
        <Card>
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label
                htmlFor="goal-category"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Category
              </label>
              <select
                id="goal-category"
                value={goalCategory}
                onChange={(e) => setGoalCategory(e.target.value as GoalCategory)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {GOAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'total'
                      ? 'Overall'
                      : CATEGORY_CONFIG[cat as ActivityCategory]?.label || cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="goal-title" className="block text-sm font-medium text-slate-700 mb-1">
                Goal title
              </label>
              <input
                id="goal-title"
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reduce transport emissions"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="goal-reduction"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Target reduction
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="goal-reduction"
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={reduction}
                  onChange={(e) => setReduction(parseInt(e.target.value, 10))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold text-primary w-12 text-right">
                  {reduction}%
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="goal-end-date"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Target date
              </label>
              <input
                id="goal-end-date"
                type="date"
                min={minDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {formError && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm"
              >
                {formError}
              </div>
            )}

            <Button type="submit" loading={creating}>
              Set Goal
            </Button>
          </form>
        </Card>
      </section>
    </div>
  )
}

export default Goals
