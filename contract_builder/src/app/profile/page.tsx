'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  HStack,
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
  Spinner,
  TableContainer
} from '@chakra-ui/react'
import { useAuth } from '@/context/AuthContext'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, setDoc, query, where } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { UserProfile, UserPreferences } from '@/types/userTypes'
import ProtectedPage from '@/components/shared/LayoutComponents/ProtectedPage'

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

  // For admin/manager user list
  const [users, setUsers] = useState<any[]>([])
  const [savingUser, setSavingUser] = useState<string | null>(null)

  // For hotel staff management
  const [hotels, setHotels] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('hotel-staff')
  const [inviteHotel, setInviteHotel] = useState('')
  const [inviting, setInviting] = useState(false)

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

  // Load users based on role and hotel assignment
  useEffect(() => {
    const loadUsers = async () => {
      if (role === 'admin') {
        // Admin sees all users
        const snap = await getDocs(collection(db, 'users'))
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } else if (role === 'hotel-manager' || role === 'hotel-staff') {
        // Hotel users only see users from their hotel
        if (userProfile?.hotelId) {
          const snap = await getDocs(
            query(collection(db, 'users'), where('hotelId', '==', userProfile.hotelId))
          )
          setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      }
    }
    loadUsers()
  }, [role, userProfile?.hotelId])

  // Load hotels for dropdown
  useEffect(() => {
    const loadHotels = async () => {
      if (role === 'admin') {
        const snap = await getDocs(collection(db, 'hotels'))
        setHotels(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }
    }
    loadHotels()
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

  const handleHotelStaffInvite = async () => {
    if (!inviteEmail || !inviteHotel) {
      setError('Please fill in all fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setInviting(true)
    try {
      // Store current user to restore after creation
      const currentUser = auth.currentUser
      
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8)
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        inviteEmail,
        tempPassword
      )
      
      // Create user document in Firestore with hotelId
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: inviteEmail,
        name: inviteEmail.split('@')[0], // Default name from email
        role: inviteRole,
        hotelId: inviteHotel,
        createdAt: new Date().toISOString(),
        preferences: defaultPrefs
      })
      
      // Send password reset email so user can set their own password
      await sendPasswordResetEmail(auth, inviteEmail)
      
      // Restore original user session
      if (currentUser) {
        await auth.updateCurrentUser(currentUser)
      }
      
      // Refresh users list
      const snap = await getDocs(collection(db, 'users'))
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      
      // Clear form
      setInviteEmail('')
      setInviteRole('hotel-staff')
      setInviteHotel('')
      
      setMessage(`Hotel staff invited successfully! They will receive an email to set their password.`)
      setError(null)
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or check the user list.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please try again.')
      } else {
        setError(err.message || 'Failed to invite staff member. Please try again.')
      }
    }
    setInviting(false)
  }

  if (loading) return <Spinner />
  if (!user)
    return <Text color='red.500'>You must be logged in to view this page.</Text>

  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager', 'hotel-staff', 'viewer']}>
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

          {/* Unit Preferences - Admin only */}
          {role === 'admin' && (
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
          )}

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

        {role === 'admin' && (
          <>
            <Divider my={6} />
            <Text fontSize='2xl' fontWeight='bold' mb={6}>
              Hotel Staff Management
            </Text>
            
            <Box p={6} borderWidth='1px' borderRadius='lg' bg='cardBg' mb={6}>
              <Text fontSize='lg' fontWeight='medium' mb={6}>Invite New Hotel Staff Member</Text>
              
              <VStack spacing={4} align='stretch'>
                <HStack spacing={4} align='start'>
                  <FormControl flex={2}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder='staff@example.com'
                      type='email'
                    />
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel>Role</FormLabel>
                    <Select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                      <option value='hotel-staff'>Hotel Staff</option>
                      <option value='hotel-manager'>Hotel Manager</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel>Hotel</FormLabel>
                    <Select value={inviteHotel} onChange={e => setInviteHotel(e.target.value)}>
                      <option value=''>Select Hotel</option>
                      {hotels.map(hotel => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.name} - {hotel.location || 'No location'}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>
                
                <Box pt={2}>
                  <Button
                    colorScheme='teal'
                    onClick={handleHotelStaffInvite}
                    isLoading={inviting}
                  >
                    Invite Staff Member
                  </Button>
                </Box>
              </VStack>
            </Box>
          </>
        )}

        {(role === 'admin' || role === 'hotel-manager') && (
          <>
            <Divider my={6} />
            <Text fontSize='2xl' fontWeight='bold' mb={4}>
              {role === 'admin' ? 'User List (Manage Roles)' : 'Hotel Staff List (View Only)'}
            </Text>

            <TableContainer overflowX='auto'>
              <Table variant='simple' size='sm'>
                {/* optional size="sm" for mobile */}
                <Thead>
                  <Tr>
                    <Th>Email</Th>
                    <Th>Name</Th>
                    <Th>Role</Th>
                    {role === 'admin' && <Th>Hotel</Th>}
                    {role === 'admin' && <Th>Action</Th>}
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map(u => (
                    <Tr key={u.id}>
                      <Td whiteSpace='nowrap'>{u.email}</Td>
                      <Td>{u.name || '-'}</Td>
                      <Td>
                        {role === 'admin' ? (
                          <Tooltip
                            label='You cannot change your own role'
                            isDisabled={u.id !== user.uid}
                          >
                            <Select
                              value={u.role || 'viewer'}
                              onChange={e =>
                                handleRoleChange(u.id, e.target.value)
                              }
                              disabled={
                                savingUser === u.id || u.id === user.uid
                              }
                              size='sm' // smaller select for mobile
                            >
                              <option value='viewer'>Viewer</option>
                              <option value='hotel-staff'>Hotel Staff</option>
                              <option value='hotel-manager'>Hotel Manager</option>
                              <option value='admin'>Admin</option>
                            </Select>
                          </Tooltip>
                        ) : (
                          u.role || 'viewer'
                        )}
                      </Td>
                      {role === 'admin' && (
                        <Td>
                          {u.hotelId ? (
                            hotels.find(h => h.id === u.hotelId)?.name || 'Unknown Hotel'
                          ) : (
                            '-'
                          )}
                        </Td>
                      )}
                      {role === 'admin' && (
                        <Td>
                          <Button
                            size='sm'
                            colorScheme='teal'
                            onClick={() =>
                              handleRoleChange(u.id, u.role || 'viewer')
                            }
                            isLoading={savingUser === u.id}
                            disabled={u.id === user.uid}
                          >
                            Save
                          </Button>
                        </Td>
                      )}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </ProtectedPage>
  )
}
