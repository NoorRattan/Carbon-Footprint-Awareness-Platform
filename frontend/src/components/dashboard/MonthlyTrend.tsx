import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCarbon } from '../../utils/carbonFormatter'

interface MonthlyDataPoint {
  readonly month: string
  readonly carbonKg: number
}

interface MonthlyTrendProps {
  readonly data: MonthlyDataPoint[]
}

/**
 * Renders a line chart showing monthly carbon footprint trend data.
 * @param props - Array of monthly data points with month label and carbon kg value.
 * @returns A Recharts LineChart visualising the monthly trend.
 */
const MonthlyTrend: React.FC<MonthlyTrendProps> = ({ data }) => {
  if (data.length === 0) {
    return <p className="text-slate-500 text-center py-8">Not enough data to show a trend yet.</p>
  }

  return (
    <div role="img" aria-label="Monthly carbon footprint trend">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(value: number) => `${value.toFixed(0)}`}
          />
          <Tooltip
            formatter={(value: number) => [formatCarbon(value), 'Carbon']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          />
          <Line
            type="monotone"
            dataKey="carbonKg"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MonthlyTrend
