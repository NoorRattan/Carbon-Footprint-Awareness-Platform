import React from 'react'
import { formatCarbon } from '../../utils/carbonFormatter'
import { CATEGORY_CONFIG } from '../../utils/categoryConfig'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'
import type { Goal, GoalCategory, GoalStatus } from '../../types'
import type { BadgeVariant } from '../ui/Badge'

/** Props for the GoalCard component. */
export interface GoalCardProps {
  /** Goal record to display. */
  readonly goal: Goal
  /** Current carbon footprint in kg CO2e for the goal category. */
  readonly currentCarbonKg: number
  /** Callback invoked when the user deletes the goal. */
  readonly onDelete: (id: string) => void
}

/** Maps goal status to badge variants. */
const STATUS_VARIANT: Record<GoalStatus, BadgeVariant> = {
  active: 'info',
  completed: 'success',
  failed: 'error',
}

/** Returns human-readable label for goal category. */
function getCategoryLabel(category: GoalCategory): string {
  if (category === 'total') return 'Overall'
  return CATEGORY_CONFIG[category]?.label || category
}

/**
 * Displays a single carbon reduction goal with progress bar, category badge, days remaining, and delete action.
 * @param props - The goal data, current carbon emissions, and delete callback.
 * @returns A styled goal card with progress tracking.
 */
const GoalCard: React.FC<GoalCardProps> = ({ goal, currentCarbonKg, onDelete }) => {
  const progressRange = goal.baselineCarbonKg - goal.targetCarbonKg
  const progressValue = goal.baselineCarbonKg - currentCarbonKg
  const progressPercent =
    progressRange > 0 ? Math.min(Math.max((progressValue / progressRange) * 100, 0), 100) : 0

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  return (
    <Card hoverable className="relative">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-800 truncate">{goal.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="neutral">{getCategoryLabel(goal.category)}</Badge>
            <Badge variant={STATUS_VARIANT[goal.status]}>{goal.status}</Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(goal.id)}
          ariaLabel={`Delete goal: ${goal.title}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-400 hover:text-red-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </div>

      <ProgressBar
        value={progressPercent}
        max={100}
        label={`${goal.title} progress`}
        color={progressPercent >= 100 ? 'bg-green-500' : 'bg-primary'}
        className="mb-3"
      />

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {formatCarbon(currentCarbonKg)} / {formatCarbon(goal.targetCarbonKg)} target
        </span>
        {goal.status === 'active' && (
          <span>
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
          </span>
        )}
      </div>
    </Card>
  )
}

export default GoalCard
