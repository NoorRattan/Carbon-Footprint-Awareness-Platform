import React, { useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'

/** Props for the Modal component. */
export interface ModalProps {
  /** Whether the modal is visible. */
  readonly isOpen: boolean
  /** Callback invoked when the modal should close. */
  readonly onClose: () => void
  /** Modal title used for the heading and accessible name. */
  readonly title: string
  /** Modal body contents. */
  readonly children: React.ReactNode
  /** Maximum modal width variant. */
  readonly size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

/**
 * Accessible modal dialog rendered via portal into document.body.
 * Supports focus trapping (Tab/Shift+Tab cycle), Escape key close,
 * and restores focus to the trigger element on close.
 * @param props - Modal configuration props.
 * @returns A portal-rendered modal dialog or null when closed.
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)
  const headingId = `modal-heading-${title.replace(/\s+/g, '-').toLowerCase()}`

  /**
   * Handles the Escape key press to close the modal.
   * @param e - The keyboard event.
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
        )

        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelector<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
          )
          focusable?.focus()
        }
      }, 0)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
        clearTimeout(timer)

        if (triggerRef.current instanceof HTMLElement) {
          triggerRef.current.focus()
        }
      }
    }
  }, [isOpen, handleKeyDown])

  /**
   * Handles clicks on the overlay background to close the modal.
   * @param e - The mouse event.
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
      onClick={handleOverlayClick}
      onKeyDown={() => undefined}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={`
          ${sizeClasses[size]} w-full mx-4
          bg-white rounded-xl shadow-xl
          animate-slide-up
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id={headingId} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export default Modal
