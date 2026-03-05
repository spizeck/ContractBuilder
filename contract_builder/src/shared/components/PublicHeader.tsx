'use client'

import {
  Flex,
  Heading,
  Link,
  Button,
  HStack,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import { useAuth } from '@core/auth/AuthContext'

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

      <HStack spacing={4}>
        {!loading && !user && (
          <>
            <Link as={NextLink} href="/login" _hover={{ textDecoration: 'underline' }}>
              Login
            </Link>
            <Link as={NextLink} href="/register" _hover={{ textDecoration: 'underline' }}>
              Register
            </Link>
          </>
        )}
        {!loading && user && (
          <Button
            as={NextLink}
            href="/dive-log/dives/dashboard"
            colorScheme="whiteAlpha"
            variant="outline"
          >
            Go to Dashboard
          </Button>
        )}
      </HStack>
    </Flex>
  )
}
