import React from 'react'

/** Visual variants supported by the Badge component. */
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

/** Props for the Badge component. */
export interface BadgeProps {
  /** Badge text or inline content. */
  readonly children: React.ReactNode
  /** Visual badge variant. */
  readonly variant?: BadgeVariant
  /** Optional additional class names. */
  readonly className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-slate-100 text-slate-700',
}

/**
 * A small status badge component with coloured variants for labelling and categorisation.
 * @param props - Badge configuration props.
 * @returns A styled inline badge element.
 */
const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export default Badge
