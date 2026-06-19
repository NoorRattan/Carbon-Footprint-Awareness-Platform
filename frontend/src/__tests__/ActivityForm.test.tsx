import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import ActivityForm from '../components/activity/ActivityForm'
import { activitiesApi, carbonApi } from '../services/api'
import React from 'react'
import type { Mock } from 'vitest'

vi.mock('../firebase', () => ({
  auth: { currentUser: null, signOut: vi.fn() },
  analytics: null,
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback(null)
    return vi.fn()
  }),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
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

function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <UserProvider>{ui}</UserProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('ActivityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders category selection step on mount', () => {
    renderWithProviders(<ActivityForm onSuccess={vi.fn()} />)
    expect(screen.getByText(/what type of activity\?/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /transport/i })).toBeInTheDocument()
  })

  it('selecting a category shows subcategory dropdown', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ActivityForm onSuccess={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /transport/i }))
    expect(screen.getByLabelText(/subcategory/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /subcategory/i })).toBeInTheDocument()
  })

  it('all visible inputs on step 3 have accessible names', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ActivityForm onSuccess={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /transport/i }))
    await user.selectOptions(screen.getByRole('combobox', { name: /subcategory/i }), 'car_petrol')
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
  })

  it('live estimate appears when amount is entered (carbonApi.calculate is called)', async () => {
    const user = userEvent.setup()
    ;(carbonApi.calculate as Mock).mockResolvedValue({ carbon_kg: 5.2 })

    renderWithProviders(<ActivityForm onSuccess={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /transport/i }))
    await user.selectOptions(screen.getByRole('combobox', { name: /subcategory/i }), 'car_petrol')
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.type(screen.getByLabelText(/amount/i), '10')

    await waitFor(
      () => {
        expect(carbonApi.calculate).toHaveBeenCalled()
      },
      { timeout: 2000 }
    )
  })

  it('submit calls activitiesApi.log with correct payload', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    ;(carbonApi.calculate as Mock).mockResolvedValue({ carbon_kg: 3.8 })
    ;(activitiesApi.log as Mock).mockResolvedValue({
      id: '1',
      userId: 'user1',
      category: 'transport',
      subcategory: 'car_petrol',
      amount: 10,
      unit: 'km',
      carbonKg: 3.8,
      date: '2026-01-01',
      createdAt: '2026-01-01T00:00:00Z',
    })

    renderWithProviders(<ActivityForm onSuccess={onSuccess} />)

    // Step 1
    await user.click(screen.getByRole('button', { name: /transport/i }))

    // Step 2
    await user.selectOptions(screen.getByRole('combobox', { name: /subcategory/i }), 'car_petrol')
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 3
    const amountInput = screen.getByLabelText(/amount/i)
    await user.clear(amountInput)
    await user.type(amountInput, '10')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()
    })
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 4
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 5
    await user.click(screen.getByRole('button', { name: /log activity/i }))

    await waitFor(() => {
      expect(activitiesApi.log).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'transport',
          subcategory: 'car_petrol',
          amount: 10,
        })
      )
    })
    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalled()
      },
      { timeout: 3000 }
    )
  })

  it('API error on submit displays role="alert" message', async () => {
    const user = userEvent.setup()
    ;(activitiesApi.log as Mock).mockRejectedValue(new Error('Server error'))

    renderWithProviders(<ActivityForm onSuccess={vi.fn()} />)

    // Step 1
    await user.click(screen.getByRole('button', { name: /transport/i }))

    // Step 2
    await user.selectOptions(screen.getByRole('combobox', { name: /subcategory/i }), 'car_petrol')
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 3
    const amountInput = screen.getByLabelText(/amount/i)
    await user.clear(amountInput)
    await user.type(amountInput, '10')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()
    })
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 4
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 5
    await user.click(screen.getByRole('button', { name: /log activity/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/server error/i)
    })
  })
})
