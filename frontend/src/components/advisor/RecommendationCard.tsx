import React, { memo } from 'react'
import { formatCarbon } from '../../utils/carbonFormatter'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import type { Recommendation, Difficulty } from '../../types'
import type { BadgeVariant } from '../ui/Badge'

/** Props for the RecommendationCard component. */
export interface RecommendationCardProps {
  /** Recommendation to render. */
  readonly recommendation: Recommendation
  /** Callback invoked when the user marks the recommendation as done. */
  readonly onAcknowledge: (id: string) => void
}

/** Maps difficulty levels to badge variant styles. */
const DIFFICULTY_VARIANTS: Record<Difficulty, BadgeVariant> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
}

/**
 * Displays a single personalised recommendation with difficulty badge, estimated saving, and acknowledge action.
 * @param props - The recommendation data and acknowledge callback.
 * @returns A styled recommendation card with fade-out transition support.
 */
export const RecommendationCard = memo(function RecommendationCard({
  recommendation,
  onAcknowledge,
}: RecommendationCardProps): React.ReactElement {
  return (
    <Card hoverable className="transition-opacity duration-300">
      <div aria-label={`Recommendation: ${recommendation.title}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-semibold text-slate-800">{recommendation.title}</h3>
              <Badge variant={DIFFICULTY_VARIANTS[recommendation.difficulty]}>
                {recommendation.difficulty}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mb-3">{recommendation.description}</p>
            <p className="text-sm font-medium text-green-600">
              {formatCarbon(recommendation.estimatedSavingKg)} CO₂e/year saved
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onAcknowledge(recommendation.id)}>
            Mark as done
          </Button>
        </div>
      </div>
    </Card>
  )
})

RecommendationCard.displayName = 'RecommendationCard'

export default RecommendationCard
