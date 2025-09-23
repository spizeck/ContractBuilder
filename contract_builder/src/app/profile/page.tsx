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
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Select,
  Spinner
} from '@chakra-ui/react'
import { useAuth } from '@/context/AuthContext'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { UserProfile, UserPreferences } from '@/types/userTypes'

export default function ProfilePage () {
  const { user, role, loading } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // For admin/manager user list
  const [users, setUsers] = useState<any[]>([])
  const [savingUser, setSavingUser] = useState<string | null>(null)

  const defaultPrefs: UserPreferences = {
    units: {
      depth: 'meters',
      temp: 'celsius',
      pressure: 'bar'
    }
  }

  // Load own profile
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

  // Load all users if admin or manager
  useEffect(() => {
    const loadUsers = async () => {
      if (role === 'admin' || role === 'manager') {
        const snap = await getDocs(collection(db, 'users'))
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }
    }
    loadUsers()
  }, [role])

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

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSavingUser(userId)
    await updateDoc(doc(db, 'users', userId), { role: newRole })
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    )
    setSavingUser(null)
  }

  if (loading) return <Spinner />
  if (!user)
    return <Text color='red.500'>You must be logged in to view this page.</Text>

  return (
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
        <Button colorScheme='orange' onClick={handlePasswordReset}>
          Reset Password
        </Button>
      </VStack>

      {(role === 'admin' || role === 'manager') && (
        <>
          <Divider my={6} />
          <Text fontSize='2xl' fontWeight='bold' mb={4}>
            User List {role === 'admin' ? '(Manage Roles)' : '(View Only)'}
          </Text>
          <Table variant='simple'>
            <Thead>
              <Tr>
                <Th>Email</Th>
                <Th>Name</Th>
                <Th>Role</Th>
                {role === 'admin' && <Th>Action</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {users.map(u => (
                <Tr key={u.id}>
                  <Td>{u.email}</Td>
                  <Td>{u.name || '-'}</Td>
                  <Td>
                    {role === 'admin' ? (
                      <Tooltip
                        label='You cannot change your own role'
                        isDisabled={u.id !== user.uid} // only show tooltip if it's the current user
                      >
                        <Select
                          value={u.role || 'viewer'}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          disabled={savingUser === u.id || u.id === user.uid}
                        >
                          <option value='viewer'>Viewer</option>
                          <option value='staff'>Staff</option>
                          <option value='manager'>Manager</option>
                          <option value='admin'>Admin</option>
                        </Select>
                      </Tooltip>
                    ) : (
                      u.role || 'viewer'
                    )}
                  </Td>
                  {role === 'admin' && (
                    <Td>
                      <Button
                        size='sm'
                        colorScheme='teal'
                        onClick={() =>
                          handleRoleChange(u.id, u.role || 'viewer')
                        }
                        isLoading={savingUser === u.id}
                        disabled={u.id === user.uid} // 🚫 disable save for self
                      >
                        Save
                      </Button>
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </>
      )}
    </Box>
  )
}
