import React from 'react'

/** Props for the Card component. */
export interface CardProps {
  /** Card body contents. */
  readonly children: React.ReactNode
  /** Optional additional class names for the card wrapper. */
  readonly className?: string
  /** Padding density for the card content. */
  readonly padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Whether hover shadow styles are enabled. */
  readonly hoverable?: boolean
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

/**
 * A container card component with rounded corners, shadow, and optional hover effect.
 * @param props - Card configuration props.
 * @returns A styled card container element.
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-slate-200
        ${paddingClasses[padding]}
        ${hoverable ? 'transition-shadow duration-200 hover:shadow-md' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export default Card
