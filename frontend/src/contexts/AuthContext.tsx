import React, { createContext, useState, useEffect, ReactNode } from 'react'
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  UserCredential,
} from 'firebase/auth'
import { auth } from '../firebase'
import { userApi } from '../services/api'

export interface AuthContextType {
  readonly user: User | null
  readonly loading: boolean
  readonly signInWithGoogle: () => Promise<UserCredential>
  readonly signInWithEmail: (email: string, password: string) => Promise<UserCredential>
  readonly signOut: () => Promise<void>
  readonly getIdToken: () => Promise<string | null>
}

export const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  readonly children: ReactNode
}

/**
 * React Context Provider for managing Firebase Authentication state.
 * @param props Contains child components.
 * @returns The context provider component.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          await userApi.syncProfile()
        } catch {
          // Silent catch to avoid throwing in effect, profile will be fetched on dashboard mount
        }
      }
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  /**
   * Signs in a user using Google OAuth popup.
   * @returns A promise resolving to the user credential.
   */
  const signInWithGoogle = async (): Promise<UserCredential> => {
    const provider = new GoogleAuthProvider()
    const credential = await signInWithPopup(auth, provider)
    try {
      await userApi.syncProfile()
    } catch {
      // Profile sync fallback
    }
    return credential
  }

  /**
   * Signs in a user using email and password.
   * @param email The user's email.
   * @param password The user's password.
   * @returns A promise resolving to the user credential.
   */
  const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    try {
      await userApi.syncProfile()
    } catch {
      // Profile sync fallback
    }
    return credential
  }

  /**
   * Signs the current user out of Firebase and EcoTrack.
   * @returns A promise resolving when sign out is complete.
   */
  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth)
  }

  /**
   * Retrieves the current user's Firebase JWT ID Token.
   * @returns A promise resolving to the token string, or null if not authed.
   */
  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) {
      return null
    }
    return auth.currentUser.getIdToken()
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    getIdToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
