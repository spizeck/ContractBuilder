'use client'

import { useEffect, useRef } from 'react'
import { useColorMode } from '@chakra-ui/react'
import { useAuth } from '@core/auth/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@core/db/firebase'

export default function ThemeSync() {
  const { user, loading } = useAuth()
  const { setColorMode } = useColorMode()
  const appliedUid = useRef<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      appliedUid.current = null
      return
    }
    // Only fetch once per user session
    if (appliedUid.current === user.uid) return
    appliedUid.current = user.uid

    const apply = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (!snap.exists()) return
      const theme = snap.data()?.preferences?.theme as string | undefined
      if (theme === 'light' || theme === 'dark') {
        setColorMode(theme)
      } else {
        setColorMode('system')
      }
    }
    apply()
  }, [user, loading, setColorMode])

  return null
}
