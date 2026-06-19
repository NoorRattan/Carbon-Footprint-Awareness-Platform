import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from '../components/ui/Modal'

vi.mock('../firebase', () => ({
  auth: { currentUser: null, signOut: vi.fn() },
  analytics: null,
}))

vi.mock('../services/api', () => ({
  activitiesApi: { getAll: vi.fn(), log: vi.fn(), delete: vi.fn(), getSummary: vi.fn() },
  insightsApi: { get: vi.fn(), acknowledge: vi.fn() },
  goalsApi: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  userApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
    syncProfile: vi.fn(),
  },
  educationApi: { getAll: vi.fn(), getBySlug: vi.fn() },
  carbonApi: { calculate: vi.fn() },
}))

describe('Modal', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog with title and children when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content here</p>
      </Modal>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content here')).toBeInTheDocument()
  })

  it('has aria-modal="true" and aria-labelledby', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Accessible Modal">
        <p>Content</p>
      </Modal>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })

  it('close button calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Close Test">
        <p>Content</p>
      </Modal>
    )
    await user.click(screen.getByRole('button', { name: /close dialog/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape key calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Escape Test">
        <button type="button">Focusable</button>
      </Modal>
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
