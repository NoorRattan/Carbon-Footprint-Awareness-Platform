import { memo } from 'react'
import type { ReactElement } from 'react'

/** Props for the Skeleton loading placeholder component. */
export interface SkeletonProps {
  /** Additional CSS classes to apply to the skeleton element. */
  readonly className?: string
}

/**
 * Decorative animated skeleton placeholder for content loading states.
 * @param props - Component props.
 * @returns An animated placeholder div.
 */
export const Skeleton = memo(function Skeleton({ className = '' }: SkeletonProps): ReactElement {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-slate-200 ${className}`} />
})

Skeleton.displayName = 'Skeleton'
