'use client'

import { Link, HStack } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useAuth } from '@core/auth/AuthContext'
import AppHeader from '@shared/components/LayoutComponents/AppHeader'
import NavLinks from '@shared/components/LayoutComponents/NavLinks'

export default function PublicHeader() {
  const { user, loading } = useAuth()

  const rightContent = !loading && !user ? (
    <HStack spacing={4}>
      <Link as={NextLink} href="/login" _hover={{ textDecoration: 'underline' }}>
        Login
      </Link>
      <Link as={NextLink} href="/register" _hover={{ textDecoration: 'underline' }}>
        Register
      </Link>
    </HStack>
  ) : !loading && user ? (
    <NavLinks />
  ) : null

  return <AppHeader rightContent={rightContent} />
}
