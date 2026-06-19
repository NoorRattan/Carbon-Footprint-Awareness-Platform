import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { userApi } from '../services/api'
import { UserProfile, UserProfileUpdateRequest } from '../types'

export interface UserContextType {
  readonly userProfile: UserProfile | null
  readonly loading: boolean
  readonly refreshProfile: () => Promise<void>
  readonly updateProfile: (data: UserProfileUpdateRequest) => Promise<void>
}

export const UserContext = createContext<UserContextType | null>(null)

interface UserProviderProps {
  readonly children: ReactNode
}

/**
 * React Context Provider for managing the logged-in user's profile state and updates.
 * @param props Contains child components.
 * @returns The context provider component.
 */
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  /**
   * Fetches the user profile from the backend API.
   * @returns A promise that resolves when the profile fetch is complete.
   */
  const fetchProfile = async (): Promise<void> => {
    setLoading(true)
    try {
      const profile = await userApi.getProfile()
      setUserProfile(profile)
    } catch {
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchProfile()
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  /**
   * Updates the user profile and refreshes local state.
   * @param data The fields to update on the profile.
   * @returns A promise that resolves when the update is complete.
   */
  const updateProfile = async (data: UserProfileUpdateRequest): Promise<void> => {
    await userApi.updateProfile(data)
    await fetchProfile()
  }

  const value: UserContextType = {
    userProfile,
    loading,
    refreshProfile: fetchProfile,
    updateProfile,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
