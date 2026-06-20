import React from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'
import { formatCarbon } from '../../utils/carbonFormatter'
import type { ActivityCategory } from '../../types'

/** Chart-ready category data point for the Recharts pie series. */
export interface CategoryDataPoint {
  /** Human-readable category label. */
  readonly name: string
  /** Carbon total in kg CO2e. */
  readonly value: number
  /** Category identifier for color lookup. */
  readonly category: ActivityCategory
  /** Percentage of total emissions. */
  readonly percent: number
}

/** Props for the CategoryBreakdown component. */
export interface CategoryBreakdownProps {
  /** Carbon totals keyed by activity category. */
  readonly data: Record<ActivityCategory, number>
}

/** Hex colours for Recharts SVG cells (Tailwind classes do not work inside SVG). */
const RECHARTS_COLORS: Record<ActivityCategory, string> = {
  transport: '#3b82f6',
  food: '#22c55e',
  energy: '#f59e0b',
  shopping: '#a855f7',
  waste: '#64748b',
}

/** Human-readable labels for each category. */
const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  transport: 'Transport',
  food: 'Food',
  energy: 'Home Energy',
  shopping: 'Shopping',
  waste: 'Waste',
}

/**
 * Renders a pie chart breakdown of carbon emissions by category with an accessible screen-reader table.
 * @param props - Category breakdown data keyed by ActivityCategory.
 * @returns A Recharts PieChart with a visually-hidden accessibility table.
 */
const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ data }) => {
  const total = Object.values(data).reduce((sum, v) => sum + v, 0)

  const chartData: CategoryDataPoint[] = (Object.entries(data) as [ActivityCategory, number][])
    .filter(([, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_LABELS[category],
      value,
      category,
      percent: total > 0 ? (value / total) * 100 : 0,
    }))

  if (chartData.length === 0) {
    return <p className="text-slate-500 text-center py-8">No category data available yet.</p>
  }

  return (
    <div>
      <div role="img" aria-label="Carbon footprint by category" className="flex justify-center">
        <PieChart width={300} height={300}>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={RECHARTS_COLORS[entry.category]} />
            ))}
          </Pie>
          <Legend />
          <Tooltip formatter={(value: number) => formatCarbon(value)} />
        </PieChart>
      </div>

      {/* Screen-reader table — visually hidden but accessible */}
      <table className="sr-only">
        <caption>Carbon footprint by category</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">CO₂e</th>
            <th scope="col">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{formatCarbon(row.value)}</td>
              <td>{row.percent.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CategoryBreakdown
