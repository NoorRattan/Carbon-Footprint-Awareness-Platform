import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

/** Props for the ErrorBoundary component. */
export interface ErrorBoundaryProps {
  /** The child components to render inside the error boundary. */
  readonly children: ReactNode
  /** Optional custom fallback UI to render when an error is caught. */
  readonly fallback?: ReactNode
}

/** Internal state for the ErrorBoundary component. */
interface ErrorBoundaryState {
  /** Whether a descendant component has thrown. */
  readonly hasError: boolean
  /** The last captured error, if one exists. */
  readonly error: Error | null
}

/**
 * Catches JavaScript errors in the child component tree and renders fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  /**
   * Updates boundary state after a descendant throws.
   * @param error - Error thrown by a descendant component.
   * @returns New boundary state.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  /**
   * Receives component stack information for application monitoring.
   * @param error - Error thrown by a descendant component.
   * @param info - React component stack details.
   */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    void error
    void info
  }

  /**
   * Renders fallback UI after an error, otherwise renders children.
   * @returns Boundary fallback or child tree.
   */
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center"
          >
            <p className="mb-2 text-lg font-semibold text-slate-900">Something went wrong</p>
            <p className="mb-4 text-slate-600">
              An unexpected error occurred. Please refresh the page to try again.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Try again
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
