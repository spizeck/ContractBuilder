// src/context/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

type Role = 'admin' | 'hotel-manager' | 'hotel-staff' | 'viewer'

interface AuthContextType {
  user: User | null
  role: Role
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'viewer', // Default role
  loading: true
})

export function AuthProvider ({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>('viewer') // Default role
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser)  => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        // console.log('Fetching role for user:', firebaseUser.uid)
        const userSnap = await getDoc(userRef)
        // console.log('User role:', userSnap.data()?.role)
        if (userSnap.exists()) {
          setRole(userSnap.data().role as Role)
        } else {
          setRole('viewer') // Default role if no user document
        }
      } else {
        setRole('viewer') // Default role if not logged in
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
