import React, { memo } from 'react'
import { formatCarbon } from '../../utils/carbonFormatter'
import Badge from '../ui/Badge'

/** Props for the FootprintSummary component. */
export interface FootprintSummaryProps {
  /** Total carbon footprint in kg CO2e for the current period. */
  readonly totalCarbonKg: number
  /** Percentage difference versus regional average, where negative means below average. */
  readonly vsAveragePercent: number
  /** Month-over-month change percentage, where negative means improvement. */
  readonly monthlyChangePercent: number
  /** Region label used in average comparison text. */
  readonly region: string
}

/**
 * Displays the user's total carbon footprint with comparisons to regional averages and monthly change.
 * @param props - Footprint summary data including total, comparison percentages, and region.
 * @returns A summary card showing the user's carbon footprint status.
 */
export const FootprintSummary = memo(function FootprintSummary({
  totalCarbonKg,
  vsAveragePercent,
  monthlyChangePercent,
  region,
}: FootprintSummaryProps): React.ReactElement {
  return (
    <div className="text-center space-y-3">
      <p className="text-5xl font-bold text-slate-900">{formatCarbon(totalCarbonKg)}</p>
      <p className="text-slate-500 text-lg">this month</p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Badge variant={vsAveragePercent < 0 ? 'success' : 'warning'}>
          {Math.abs(vsAveragePercent).toFixed(0)}% {vsAveragePercent < 0 ? 'below' : 'above'}{' '}
          {region} average
        </Badge>
        <p className="text-sm text-slate-600">
          {monthlyChangePercent < 0 ? (
            <span className="text-green-600 font-medium" aria-label="decreasing trend">
              <span aria-hidden="true">↓</span> {Math.abs(monthlyChangePercent).toFixed(0)}% vs last
              month
            </span>
          ) : (
            <span className="text-red-600 font-medium" aria-label="increasing trend">
              <span aria-hidden="true">↑</span> {Math.abs(monthlyChangePercent).toFixed(0)}% vs last
              month
            </span>
          )}
        </p>
      </div>
    </div>
  )
})

FootprintSummary.displayName = 'FootprintSummary'

export default FootprintSummary
