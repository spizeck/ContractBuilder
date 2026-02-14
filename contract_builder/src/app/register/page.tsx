// src/app/register/page.tsx
'use client'

import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text
} from '@chakra-ui/react'

export default function RegisterPage () {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      // create a Firestore doc with default role = 'viewer'
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: name,
        role: 'viewer',
        createdAt: serverTimestamp()
      })

      router.push('/')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Box
      p={6}
      maxW='500px'
      mx='auto'
      mt={10}
      borderWidth='1px'
      borderRadius='lg'
      boxShadow='lg'
    >
      <form onSubmit={handleRegister}>
        <Text fontSize='2xl' fontWeight='semibold' mb={4}>
          Register
        </Text>
        <VStack spacing={4} align='stretch'>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='Enter your email'
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Enter your preferred first name'
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Create a password'
            />
          </FormControl>

          {error && <Text color='red.500'>{error}</Text>}

          <Button type='submit' colorScheme='teal' width='100%'>
            Register
          </Button>
        </VStack>
      </form>
    </Box>
  )
}
