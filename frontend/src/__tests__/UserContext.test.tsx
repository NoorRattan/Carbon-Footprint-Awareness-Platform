/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UserProvider, UserContext } from '../contexts/UserContext'
import { userApi } from '../services/api'
import { AuthContext } from '../contexts/AuthContext'
import { useContext } from 'react'

vi.mock('../firebase', () => ({
  auth: { currentUser: null, signOut: vi.fn(), getIdToken: vi.fn() },
  analytics: null,
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback({ uid: '123', email: 'test@example.com' })
    return vi.fn()
  }),
}))

vi.mock('../services/api', () => ({
  userApi: {
    getProfile: vi.fn().mockResolvedValue({ uid: '123', displayName: 'Test' }),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
    syncProfile: vi.fn().mockResolvedValue({ uid: '123', displayName: 'Test' }),
  },
}))

const TestComponent = () => {
  const context = useContext(UserContext)
  if (!context) return null
  const { userProfile, loading, updateProfile } = context

  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="profile-name">{userProfile?.displayName}</span>
      <button onClick={() => updateProfile({ displayName: 'New Name' })}>Update</button>
    </div>
  )
}

describe('UserContext', () => {
  it('fetches profile when user is present', async () => {
    render(
      <AuthContext.Provider
        value={{
          user: { uid: '123' } as any,
          loading: false,
          signInWithGoogle: vi.fn(),
          signInWithEmail: vi.fn(),
          signOut: vi.fn(),
          getIdToken: vi.fn(),
        }}
      >
        <UserProvider>
          <TestComponent />
        </UserProvider>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Test')
    })

    screen.getByText('Update').click()
    expect(userApi.updateProfile).toHaveBeenCalledWith({ displayName: 'New Name' })
  })

  it('handles unauthenticated state', async () => {
    const { onAuthStateChanged } = await import('firebase/auth')
    vi.mocked(onAuthStateChanged).mockImplementationOnce((_auth, callback) => {
      const authCallback = callback as (user: unknown) => void
      authCallback(null)
      return vi.fn()
    })

    render(
      <AuthContext.Provider
        value={{
          user: null,
          loading: false,
          signInWithGoogle: vi.fn(),
          signInWithEmail: vi.fn(),
          signOut: vi.fn(),
          getIdToken: vi.fn(),
        }}
      >
        <UserProvider>
          <TestComponent />
        </UserProvider>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('profile-name')).toBeEmptyDOMElement()
    })
  })
})
