import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Input from '../components/ui/Input'

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

describe('Input', () => {
  it('renders label associated with input (getByLabelText works)', () => {
    render(<Input id="email" label="Email" value="" onChange={vi.fn()} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('error prop displays error message with role="alert"', () => {
    render(<Input id="name" label="Name" value="" onChange={vi.fn()} error="Name is required" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Name is required')
  })

  it('onChange fires correctly', async (): Promise<void> => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Input id="city" label="City" value="" onChange={handleChange} />)
    await user.type(screen.getByLabelText(/city/i), 'a')
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('required=true sets aria-required on the input', () => {
    render(<Input id="pw" label="Password" value="" onChange={vi.fn()} required />)
    const input = screen.getByLabelText(/password/i)
    expect(input).toBeRequired()
  })

  it('helpText is rendered when no error is present', () => {
    render(
      <Input id="phone" label="Phone" value="" onChange={vi.fn()} helpText="Include country code" />
    )
    expect(screen.getByText('Include country code')).toBeInTheDocument()
  })

  it('suffix is rendered next to the input', () => {
    render(<Input id="weight" label="Weight" value="" onChange={vi.fn()} suffix="kg" />)
    expect(screen.getByText('kg')).toBeInTheDocument()
  })
})
