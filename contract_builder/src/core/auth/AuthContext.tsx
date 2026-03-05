// src/core/auth/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@core/db/firebase'

type Role = 'admin' | 'hotel-manager' | 'hotel-staff' | 'employee' | 'viewer'

interface AuthContextType {
  user: User | null
  role: Role
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'viewer', // Default role
  loading: true,
  logout: async () => {
    throw new Error(
      'AuthContext.logout called outside of AuthProvider. ' +
        'Ensure your component tree is wrapped in <AuthProvider>.'
    )
  }
})

export function AuthProvider ({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>('viewer') // Default role
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const rawRole = userSnap.data().role;
            const mappedRole: Role = rawRole === 'manager' ? 'hotel-manager' : ((rawRole as Role) || 'viewer');
            setRole(mappedRole)
          } else {
            // User exists in Firebase Auth but not in Firestore
            // (e.g. Google sign-in edge case) — auto-create viewer doc
            await setDoc(userRef, {
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              role: 'viewer',
              createdAt: serverTimestamp(),
            })
            setRole('viewer')
          }
        } else {
          setRole('viewer')
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        setRole('viewer')
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
