import React from 'react'

interface ProgressBarProps {
  readonly value: number
  readonly max: number
  readonly label: string
  readonly showPercentage?: boolean
  readonly color?: string
  readonly className?: string
}

/**
 * An accessible progress bar component with ARIA attributes and optional percentage display.
 * @param props - Progress bar configuration props.
 * @returns A styled progress bar element with ARIA support.
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  showPercentage = true,
  color = 'bg-primary',
  className = '',
}) => {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0

  return (
    <div className={className}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-sm font-medium text-slate-500">{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden"
      >
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
