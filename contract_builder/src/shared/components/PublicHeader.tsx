'use client'

import {
  Flex,
  Heading,
  Link,
  Button,
  HStack,
  Box,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function PublicHeader() {
  const { user, loading } = useAuth()

  return (
    <Flex
      as="header"
      bg="teal.500"
      color="white"
      py={4}
      px={8}
      align="center"
      justify="space-between"
      className="no-print"
      suppressHydrationWarning={true}
    >
      <Link as={NextLink} href="/" _hover={{ textDecoration: 'none' }}>
        <Heading as="h1" size="lg">
          Sea Saba
        </Heading>
      </Link>

      {!loading && !user && (
        <HStack spacing={4}>
          <Link as={NextLink} href="/login" _hover={{ textDecoration: 'underline' }}>
            Login
          </Link>
          <Link as={NextLink} href="/register" _hover={{ textDecoration: 'underline' }}>
            Register
          </Link>
        </HStack>
      )}

      {!loading && user && (
        <HStack spacing={4}>
          <Link as={NextLink} href="/app/dive-log/dives/dashboard" _hover={{ textDecoration: 'underline' }}>
            Dashboard
          </Link>
          <Link as={NextLink} href="/profile" _hover={{ textDecoration: 'underline' }}>
            Profile
          </Link>
        </HStack>
      )}
    </Flex>
  )
}
