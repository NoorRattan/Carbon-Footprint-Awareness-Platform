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

/** Authentication state and actions exposed to the React tree. */
export interface AuthContextType {
  /** Current Firebase user, or null when signed out. */
  readonly user: User | null
  /** True while Firebase resolves the current auth session. */
  readonly loading: boolean
  /** Starts Google popup sign-in. */
  readonly signInWithGoogle: () => Promise<UserCredential>
  /** Starts email/password sign-in. */
  readonly signInWithEmail: (email: string, password: string) => Promise<UserCredential>
  /** Signs the current user out. */
  readonly signOut: () => Promise<void>
  /** Returns the current Firebase ID token, or null when signed out. */
  readonly getIdToken: () => Promise<string | null>
}

/** React context containing authentication state and actions. */
export const AuthContext = createContext<AuthContextType | null>(null)

/** Props for the AuthProvider component. */
export interface AuthProviderProps {
  /** Child React tree that can consume authentication state. */
  readonly children: ReactNode
}

/**
 * Synchronizes a Firebase-authenticated user profile without blocking auth state updates.
 * @returns A promise that resolves after the sync attempt completes.
 */
const syncProfileWithoutBlockingAuth = async (): Promise<void> => {
  try {
    await userApi.syncProfile()
  } catch (err: unknown) {
    void (err instanceof Error ? err.message : err)
  }
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser): Promise<void> => {
      if (currentUser) {
        await syncProfileWithoutBlockingAuth()
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
    await syncProfileWithoutBlockingAuth()
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
    await syncProfileWithoutBlockingAuth()
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
