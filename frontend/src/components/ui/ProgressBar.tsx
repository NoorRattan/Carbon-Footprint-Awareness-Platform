import React from 'react'

/** Props for the ProgressBar component. */
export interface ProgressBarProps {
  /** Current progress value. */
  readonly value: number
  /** Maximum progress value. */
  readonly max: number
  /** Accessible progress label. */
  readonly label: string
  /** Whether to display the computed percentage text. */
  readonly showPercentage?: boolean
  /** Tailwind background class used for the filled bar. */
  readonly color?: string
  /** Optional additional wrapper class names. */
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
