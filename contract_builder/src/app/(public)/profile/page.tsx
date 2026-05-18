'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Select,
  Spinner,
  Divider,
  HStack,
  Badge,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useAuth } from '@core/auth/AuthContext'
import { auth, db, googleProvider } from '@core/db/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { sendPasswordResetEmail, linkWithPopup, unlink } from 'firebase/auth'
import { UserProfile, UserPreferences } from '@core/types/userTypes'
import ProtectedPage from '@shared/components/LayoutComponents/ProtectedPage'

const defaultPrefs: UserPreferences = {
  units: {
    depth: 'meters',
    temp: 'celsius',
    pressure: 'bar'
  }
}

export default function ProfilePage () {
  const { user, role, loading } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [linkedProviders, setLinkedProviders] = useState<string[]>([])
  const [linkingGoogle, setLinkingGoogle] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      const userRef = doc(db, 'users', user.uid)
      const snap = await getDoc(userRef)
      if (snap.exists()) {
        const data = snap.data() as Partial<UserProfile>
        setUserProfile({
          ...(data as UserProfile),
          preferences: {
            ...defaultPrefs,
            ...data.preferences,
            units: {
              ...defaultPrefs.units,
              ...data.preferences?.units
            }
          }
        })
      }
    }
    loadProfile()
  }, [user])

  // Track linked auth providers
  useEffect(() => {
    if (user) {
      const providers = user.providerData.map(p => p.providerId)
      setLinkedProviders(providers)
    }
  }, [user])

  const handleProfileSave = async () => {
    if (!user || !userProfile) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: userProfile.name,
        preferences: {
          ...defaultPrefs,
          ...userProfile.preferences
        }
      })
      setMessage('Profile updated successfully.')
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    try {
      await sendPasswordResetEmail(auth, user.email)
      setMessage('Password reset email sent.')
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLinkGoogle = async () => {
    if (!user) return
    setLinkingGoogle(true)
    setError(null)
    setMessage(null)
    try {
      await linkWithPopup(user, googleProvider)
      // Refresh provider list
      setLinkedProviders(user.providerData.map(p => p.providerId))
      setMessage('Google account linked successfully.')
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLinkingGoogle(false)
        return
      }
      if (err.code === 'auth/credential-already-in-use') {
        setError('This Google account is already linked to another user.')
      } else if (err.code === 'auth/provider-already-linked') {
        setError('A Google account is already linked to this profile.')
        // Refresh providers in case state was stale
        setLinkedProviders(user.providerData.map(p => p.providerId))
      } else {
        setError('Failed to link Google account. Please try again.')
      }
    }
    setLinkingGoogle(false)
  }

  const handleUnlinkGoogle = async () => {
    if (!user) return
    // Prevent unlinking if it's the only provider
    if (linkedProviders.length <= 1) {
      setError('Cannot unlink Google — it is your only sign-in method. Add a password first.')
      return
    }
    setLinkingGoogle(true)
    setError(null)
    setMessage(null)
    try {
      await unlink(user, 'google.com')
      setLinkedProviders(user.providerData.map(p => p.providerId))
      setMessage('Google account unlinked.')
    } catch (err: any) {
      setError('Failed to unlink Google account. Please try again.')
    }
    setLinkingGoogle(false)
  }

  if (loading) return <Spinner />
  if (!user)
    return <Text color='red.500'>You must be logged in to view this page.</Text>

  const providerIds = new Set(linkedProviders)
  const hasGoogle = providerIds.has('google.com')
  const hasPassword = providerIds.has('password')

  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager', 'hotel-staff', 'employee', 'viewer']}>
      <Box p={6} maxW='800px' mx='auto'>
        <Text fontSize='2xl' fontWeight='bold' mb={4}>
          My Profile
        </Text>
        <VStack spacing={4} align='stretch' mb={6}>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input value={userProfile?.email || ''} isReadOnly />
          </FormControl>

          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input
              value={userProfile?.name || ''}
              onChange={e =>
                setUserProfile(prev =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
            />
          </FormControl>

          {/* Unit Preferences */}
          <>
            <FormControl>
              <FormLabel>Depth Units</FormLabel>
                <Select
                  value={userProfile?.preferences.units.depth}
                  onChange={e =>
                    setUserProfile(prev =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              units: {
                                ...prev.preferences.units,
                                depth: e.target.value as 'meters' | 'feet'
                              }
                            }
                          }
                        : prev
                    )
                  }
                >
                  <option value='meters'>Meters</option>
                  <option value='feet'>Feet</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Temperature Units</FormLabel>
                <Select
                  value={userProfile?.preferences.units.temp}
                  onChange={e =>
                    setUserProfile(prev =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              units: {
                                ...prev.preferences.units,
                                temp: e.target.value as 'celsius' | 'fahrenheit'
                              }
                            }
                          }
                        : prev
                    )
                  }
                >
                  <option value='celsius'>Celsius</option>
                  <option value='fahrenheit'>Fahrenheit</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Pressure Units</FormLabel>
                <Select
                  value={userProfile?.preferences.units.pressure}
                  onChange={e =>
                    setUserProfile(prev =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              units: {
                                ...prev.preferences.units,
                                pressure: e.target.value as 'bar' | 'psi'
                              }
                            }
                          }
                        : prev
                    )
                  }
                >
                  <option value='bar'>Bar</option>
                  <option value='psi'>PSI</option>
                </Select>
              </FormControl>
            </>

          <FormControl>
            <FormLabel>Role</FormLabel>
            <Input value={role} isReadOnly />
          </FormControl>

          {error && <Text color='red.500'>{error}</Text>}
          {message && <Text color='green.500'>{message}</Text>}

          <Button
            colorScheme='teal'
            onClick={handleProfileSave}
            isLoading={saving}
          >
            Save Profile
          </Button>

          {hasPassword && (
            <Button colorScheme='orange' onClick={handlePasswordReset}>
              Reset Password
            </Button>
          )}

          <Divider />

          {/* Linked Accounts Section */}
          <Text fontWeight='bold' fontSize='lg'>Linked Accounts</Text>

          <HStack justify='space-between' align='center'>
            <HStack spacing={2}>
              <Text>Google</Text>
              {hasGoogle ? (
                <Badge colorScheme='green'>Linked</Badge>
              ) : (
                <Badge colorScheme='gray'>Not linked</Badge>
              )}
            </HStack>
            {hasGoogle ? (
              <Button
                size='sm'
                colorScheme='red'
                variant='outline'
                onClick={handleUnlinkGoogle}
                isLoading={linkingGoogle}
                isDisabled={linkedProviders.length <= 1}
              >
                Unlink
              </Button>
            ) : (
              <Button
                size='sm'
                colorScheme='blue'
                onClick={handleLinkGoogle}
                isLoading={linkingGoogle}
              >
                Link Google Account
              </Button>
            )}
          </HStack>

          {hasGoogle && linkedProviders.length <= 1 && (
            <Alert status='info' fontSize='sm'>
              <AlertIcon />
              Google is your only sign-in method. Add a password before unlinking.
            </Alert>
          )}

          <HStack spacing={2}>
            <Text>Email/Password</Text>
            {hasPassword ? (
              <Badge colorScheme='green'>Linked</Badge>
            ) : (
              <Badge colorScheme='gray'>Not set</Badge>
            )}
          </HStack>
        </VStack>
      </Box>
    </ProtectedPage>
  )
}
